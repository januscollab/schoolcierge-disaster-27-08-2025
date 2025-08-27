/**
 * Secure Families Router
 * This is the security-hardened version of the families API
 * Includes authentication, authorization, rate limiting, and audit logging
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { AppError } from '../utils/errors';
import { requestValidator } from '../middleware/request-validator';
import { 
  authenticate, 
  authorizeFamily, 
  requireAdmin, 
  authorizeOwnerOrAdmin,
  auditLog 
} from '../middleware/auth';
import { 
  apiLimiter, 
  strictLimiter, 
  createLimiter 
} from '../middleware/rate-limit';

export const familiesRouter = Router();

// Apply rate limiting to all routes
familiesRouter.use(apiLimiter);

// Apply authentication to all routes
familiesRouter.use(authenticate);

// Validation schemas with enhanced security checks
const createFamilySchema = z.object({
  body: z.object({
    primaryEmail: z.string().email().max(255),
    secondaryEmail: z.string().email().max(255).optional(),
    whatsappNumber: z.string().min(10).max(20).regex(/^\+?[1-9]\d{1,14}$/),
    preferredLanguage: z.string().max(10).default('en'),
    timezone: z.string().max(50).default('UTC'),
  }),
});

const updateFamilySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    primaryEmail: z.string().email().max(255).optional(),
    secondaryEmail: z.string().email().max(255).optional(),
    whatsappNumber: z.string().min(10).max(20).regex(/^\+?[1-9]\d{1,14}$/).optional(),
    preferredLanguage: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

/**
 * GET /api/families
 * Get all families - ADMIN ONLY
 * Returns paginated list of families with basic information
 */
familiesRouter.get('/', 
  requireAdmin,
  auditLog('LIST_ALL_FAMILIES'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.family.count({
        where: { status: { not: 'deleted' } }
      });

      // Get families with limited data exposure
      const families = await prisma.family.findMany({
        where: { status: { not: 'deleted' } },
        select: {
          id: true,
          primaryEmail: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
              messages: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        data: families,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/families/:id
 * Get family by ID - AUTHORIZED FAMILY MEMBERS ONLY
 * Returns detailed family information for authorized users
 */
familiesRouter.get('/:id',
  authorizeFamily,
  auditLog('VIEW_FAMILY'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Fetch family with controlled data exposure
      const family = await prisma.family.findUnique({
        where: { 
          id,
          status: { not: 'deleted' }
        },
        select: {
          id: true,
          primaryEmail: true,
          secondaryEmail: true,
          whatsappNumber: true,
          preferredLanguage: true,
          timezone: true,
          status: true,
          createdAt: true,
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              grade: true,
              school: {
                select: {
                  id: true,
                  name: true,
                  domain: true
                }
              }
            }
          },
          // Limit message history to prevent data overexposure
          messages: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              direction: true,
              createdAt: true,
              // Don't expose message content in list view
            }
          },
          _count: {
            select: {
              messages: true,
              interactions: true,
            }
          }
        }
      });

      if (!family) {
        throw AppError.notFound('Family not found');
      }

      res.json({ data: family });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/families
 * Create new family - AUTHENTICATED USERS
 * Creates family and associates with creating user
 */
familiesRouter.post('/',
  createLimiter, // Prevent spam
  requestValidator(createFamilySchema),
  auditLog('CREATE_FAMILY'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user already has maximum families
      const existingFamiliesCount = await prisma.userFamily.count({
        where: {
          userId: req.auth!.userId,
          status: 'active'
        }
      });

      if (existingFamiliesCount >= 5) {
        throw AppError.badRequest('Maximum number of families reached');
      }

      // Check for duplicate email
      const existingFamily = await prisma.family.findFirst({
        where: {
          OR: [
            { primaryEmail: req.body.primaryEmail },
            { whatsappNumber: req.body.whatsappNumber }
          ],
          status: { not: 'deleted' }
        }
      });

      if (existingFamily) {
        throw AppError.conflict('A family with this email or phone number already exists');
      }

      // Create family with user association
      const family = await prisma.$transaction(async (tx) => {
        // Create the family
        const newFamily = await tx.family.create({
          data: {
            ...req.body,
            status: 'active'
          }
        });

        // Associate user with family as owner
        await tx.userFamily.create({
          data: {
            userId: req.auth!.userId,
            familyId: newFamily.id,
            role: 'owner',
            status: 'active'
          }
        });

        return newFamily;
      });

      res.status(201).json({
        data: {
          id: family.id,
          primaryEmail: family.primaryEmail,
          status: family.status
        },
        message: 'Family created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/families/:id
 * Update family - FAMILY OWNERS ONLY
 * Updates family information with validation
 */
familiesRouter.patch('/:id',
  authorizeFamily,
  requestValidator(updateFamilySchema),
  auditLog('UPDATE_FAMILY'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify owner permission
      if (req.family?.role !== 'owner') {
        throw AppError.forbidden('Only family owners can update family information');
      }

      const { id } = req.params;

      // Check for email conflicts if updating email
      if (req.body.primaryEmail || req.body.whatsappNumber) {
        const conflicts = await prisma.family.findFirst({
          where: {
            id: { not: id },
            OR: [
              req.body.primaryEmail ? { primaryEmail: req.body.primaryEmail } : {},
              req.body.whatsappNumber ? { whatsappNumber: req.body.whatsappNumber } : {}
            ].filter(condition => Object.keys(condition).length > 0),
            status: { not: 'deleted' }
          }
        });

        if (conflicts) {
          throw AppError.conflict('Email or phone number already in use');
        }
      }

      // Update family
      const family = await prisma.family.update({
        where: { 
          id,
          status: { not: 'deleted' }
        },
        data: {
          ...req.body,
          updatedAt: new Date()
        },
        select: {
          id: true,
          primaryEmail: true,
          secondaryEmail: true,
          whatsappNumber: true,
          preferredLanguage: true,
          timezone: true,
          status: true,
          updatedAt: true
        }
      });

      res.json({
        data: family,
        message: 'Family updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/families/:id
 * Soft delete family - FAMILY OWNERS ONLY
 * Marks family as deleted without removing data
 */
familiesRouter.delete('/:id',
  strictLimiter, // Strict limit on deletions
  authorizeFamily,
  auditLog('DELETE_FAMILY'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify owner permission
      if (req.family?.role !== 'owner') {
        throw AppError.forbidden('Only family owners can delete the family');
      }

      const { id } = req.params;

      // Soft delete - maintain data for compliance
      await prisma.$transaction(async (tx) => {
        // Mark family as deleted
        await tx.family.update({
          where: { id },
          data: { 
            status: 'deleted',
            deletedAt: new Date()
          }
        });

        // Deactivate all user associations
        await tx.userFamily.updateMany({
          where: { familyId: id },
          data: { status: 'inactive' }
        });

        // Log deletion for audit trail
        console.log({
          action: 'FAMILY_DELETED',
          familyId: id,
          deletedBy: req.auth!.userId,
          timestamp: new Date().toISOString()
        });
      });

      res.json({
        message: 'Family deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/families/:id/audit-log
 * Get family audit log - ADMIN ONLY
 * Returns security and access audit trail
 */
familiesRouter.get('/:id/audit-log',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // This would typically query an audit log table
      // For now, return a placeholder
      res.json({
        data: {
          familyId: id,
          logs: [],
          message: 'Audit logging system to be implemented'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { AppError } from '../utils/errors';
import { requestValidator } from '../middleware/request-validator';
import { authenticate, authorizeFamily, requireAdmin, auditLog } from '../middleware/auth';
import { sanitizeObject, sanitizeArray } from '../utils/security';

export const familiesRouter = Router();

// Validation schemas
const createFamilySchema = z.object({
  body: z.object({
    primaryEmail: z.string().email(),
    secondaryEmail: z.string().email().optional(),
    whatsappNumber: z.string().min(10),
    preferredLanguage: z.string().default('en'),
    timezone: z.string().default('UTC'),
  }),
});

const updateFamilySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    primaryEmail: z.string().email().optional(),
    secondaryEmail: z.string().email().optional(),
    whatsappNumber: z.string().min(10).optional(),
    preferredLanguage: z.string().optional(),
    timezone: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

// Get all families (admin only)
familiesRouter.get('/', 
  authenticate,
  requireAdmin,
  auditLog('list_all_families'),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const families = await prisma.family.findMany({
      include: {
        students: true,
        _count: {
          select: {
            messages: true,
            interactions: true,
          },
        },
      },
    });

    // Sanitize output to prevent XSS
    res.json({
      data: sanitizeArray(families),
      total: families.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get family by ID (requires family member access)
familiesRouter.get('/:id', 
  authenticate,
  authorizeFamily,
  auditLog('get_family'),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            school: true,
          },
        },
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        interactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!family) {
      throw AppError.notFound('Family not found');
    }

    // Sanitize output to prevent XSS
    res.json({ data: sanitizeObject(family) });
  } catch (error) {
    next(error);
  }
});

// Create family (admin only)
familiesRouter.post(
  '/',
  authenticate,
  requireAdmin,
  requestValidator(createFamilySchema),
  auditLog('create_family'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const family = await prisma.family.create({
        data: req.body,
      });

      // Log the creation
      console.log(`Family created: ${family.id} by admin user ${req.auth?.userId}`);
      
      res.status(201).json({
        data: sanitizeObject(family),
        message: 'Family created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update family (requires family owner access)
familiesRouter.patch(
  '/:id',
  authenticate,
  authorizeFamily,
  requestValidator(updateFamilySchema),
  auditLog('update_family'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Check if user is family owner (not just member)
      if (req.family?.role !== 'owner' && req.family?.role !== 'admin') {
        throw AppError.forbidden('Only family owners can update family details');
      }

      const family = await prisma.family.update({
        where: { id },
        data: req.body,
      });

      // Log the update
      console.log(`Family ${id} updated by user ${req.auth?.userId}`);
      
      res.json({
        data: sanitizeObject(family),
        message: 'Family updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete family (admin only)
familiesRouter.delete('/:id', 
  authenticate,
  requireAdmin,
  auditLog('delete_family'),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Soft delete instead of hard delete for data retention
    await prisma.family.update({
      where: { id },
      data: {
        status: 'inactive',
        deletedAt: new Date()
      }
    });
    
    // Log the deletion
    console.log(`Family ${id} deleted by admin ${req.auth?.userId}`);

    res.json({
      message: 'Family deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});
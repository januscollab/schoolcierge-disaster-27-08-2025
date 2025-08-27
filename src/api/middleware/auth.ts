import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '@clerk/express';
import { AppError } from '../utils/errors';
import { prisma } from '../utils/database';

// Extend Express Request type to include auth and family data
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        orgId?: string;
      };
      family?: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Require authenticated user via Clerk
 * This middleware ensures that a valid Clerk session exists
 */
export const authenticate = requireAuth();

/**
 * Verify family access permissions
 * Ensures the authenticated user has access to the requested family
 */
export const authorizeFamily = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure user is authenticated
    if (!req.auth?.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    // Extract family ID from params or body
    const familyId = req.params.id || req.body.familyId;
    if (!familyId) {
      throw AppError.badRequest('Family ID required');
    }

    // Validate family ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(familyId)) {
      throw AppError.badRequest('Invalid family ID format');
    }

    // Check if user belongs to this family
    const userFamily = await prisma.userFamily.findFirst({
      where: {
        userId: req.auth.userId,
        familyId: familyId,
        status: 'active'
      }
    });

    if (!userFamily) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized family access attempt: User ${req.auth.userId} tried to access family ${familyId}`);
      throw AppError.forbidden('Access denied to this family');
    }

    // Attach family info to request
    req.family = {
      id: familyId,
      role: userFamily.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only access
 * Restricts endpoint access to admin users only
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.auth?.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
      select: {
        id: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    if (user.status !== 'active') {
      throw AppError.forbidden('Account inactive');
    }

    if (user.role !== 'admin') {
      // Log unauthorized admin access attempt
      console.warn(`Unauthorized admin access attempt by user: ${req.auth.userId}`);
      throw AppError.forbidden('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user owns the resource or is admin
 * Flexible authorization for resource ownership
 */
export const authorizeOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.auth?.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
      select: {
        id: true,
        role: true
      }
    });

    if (user?.role === 'admin') {
      return next(); // Admins can access everything
    }

    // Otherwise, check family ownership
    await authorizeFamily(req, res, () => {
      if (req.family?.role !== 'owner') {
        throw AppError.forbidden('Owner access required for this operation');
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log security events for audit trail
 */
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log the security event
    console.log({
      timestamp: new Date().toISOString(),
      action,
      userId: req.auth?.userId,
      familyId: req.family?.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    next();
  };
};
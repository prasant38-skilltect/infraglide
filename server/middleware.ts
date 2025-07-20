import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AuthenticationService } from "./auth";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

const authService = new AuthenticationService(storage);

// Rate limiting middleware
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increase limit to 50 auth requests per windowMs  
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false, // Don't skip any requests, but use permissive settings for development
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increase limit to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false, // Don't skip any requests, but use permissive settings for development
});

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;

    // Check for JWT token in Authorization header
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await authService.verifyToken(token);
      
      if (decoded) {
        const user = await storage.getUserById(decoded.userId);
        if (user?.isActive) {
          req.user = user;
          return next();
        }
      }
    }

    // Check for session ID
    if (sessionId) {
      const user = await authService.validateSession(sessionId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
        return next();
      }
    }

    return res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid authentication" });
  }
};

// Admin middleware (requires auth first)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Optional auth middleware (adds user to request if authenticated, but doesn't require it)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await authService.verifyToken(token);
      
      if (decoded) {
        const user = await storage.getUserById(decoded.userId);
        if (user?.isActive) {
          req.user = user;
        }
      }
    } else if (sessionId) {
      const user = await authService.validateSession(sessionId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
      }
    }
  } catch (error) {
    console.error("Optional auth error:", error);
  }
  
  next();
};

// Session cleanup middleware (run periodically)
export const cleanupExpiredSessions = async () => {
  try {
    await storage.cleanupExpiredSessions();
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
};

// Run session cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';

/**
 * Configures security headers and CORS for the application
 * Implements Requirement 7.3: Security headers and HTTPS configuration
 */
export function configureSecurity(app: Express, isProduction: boolean) {
  // Configure CORS
  const corsOptions = {
    origin: isProduction 
      ? process.env.ALLOWED_ORIGINS?.split(',') || false
      : true, // Allow all origins in development
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  
  app.use(cors(corsOptions));

  // Configure Helmet security headers
  app.use(helmet({
    // HTTP Strict Transport Security (HSTS)
    // Forces HTTPS connections for 1 year
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    },

    // Content Security Policy (CSP)
    // Restricts resource loading to prevent XSS attacks
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for QR code generation
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
        imgSrc: ["'self'", 'data:', 'blob:'], // Allow data URLs for QR codes
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },

    // X-Frame-Options
    // Prevents clickjacking attacks
    frameguard: {
      action: 'deny'
    },

    // X-Content-Type-Options
    // Prevents MIME type sniffing
    noSniff: true,

    // X-XSS-Protection
    // Enables browser XSS protection
    xssFilter: true,

    // Referrer-Policy
    // Controls referrer information
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },

    // X-DNS-Prefetch-Control
    // Controls DNS prefetching
    dnsPrefetchControl: {
      allow: false
    },

    // X-Download-Options
    // Prevents IE from executing downloads in site context
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies
    // Restricts Adobe Flash and PDF cross-domain policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    }
  }));

  // Force HTTPS in production
  if (isProduction) {
    app.use((req, res, next) => {
      // Check if request is secure
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        next();
      } else {
        // Redirect to HTTPS
        res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
    });
  }
}

import { Router, Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message-service.js';
import { passwordVerificationLimiter, logFailedAuthAttempt } from '../middleware/rate-limiter.js';

/**
 * Request body for creating a message
 */
interface CreateMessageRequest {
  content: string;
  password: string;
}

/**
 * Creates and configures the messages router
 * @param messageService - The message service instance
 * @returns Configured Express router
 */
export function createMessagesRouter(messageService: MessageService): Router {
  const router = Router();

  /**
   * POST /api/messages
   * Creates a new secret message
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content, password } = req.body as CreateMessageRequest;

      // Call MessageService.createMessage()
      const result = await messageService.createMessage(content, password);

      // Return 201 with MessageCreationResult
      res.status(201).json(result);
    } catch (error) {
      // Pass errors to error handling middleware
      next(error);
    }
  });

  /**
   * GET /api/messages/:path
   * Retrieves message metadata without content
   */
  router.get('/:path', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract path parameter from URL
      const path = req.params.path as string;

      // Call MessageService.getMessageMetadata()
      const metadata = await messageService.getMessageMetadata(path);

      // Return 404 if message not found
      if (!metadata) {
        return res.status(404).json({
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'The requested message does not exist'
          }
        });
      }

      // Return 200 with MessageMetadata (without content)
      res.status(200).json(metadata);
    } catch (error) {
      // Pass errors to error handling middleware
      next(error);
    }
  });

  /**
   * POST /api/messages/:path/verify
   * Verifies password and returns message content
   * Rate limited to 5 attempts per minute per IP
   */
  router.post('/:path/verify', passwordVerificationLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract path parameter from URL
      const path = req.params.path as string;
      
      // Extract password from request body
      const { password } = req.body as { password: string };

      // Call MessageService.verifyAndGetMessage()
      const content = await messageService.verifyAndGetMessage(path, password);

      // Return 200 with message content if authentication succeeds
      res.status(200).json({ content });
    } catch (error) {
      // Log failed authentication attempts
      logFailedAuthAttempt(req);
      
      // Pass errors to error handling middleware
      // AuthenticationError will be converted to 401
      // NotFoundError will be converted to 404
      next(error);
    }
  });

  return router;
}

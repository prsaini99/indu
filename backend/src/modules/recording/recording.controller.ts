import { Request, Response, NextFunction } from 'express';
import { RecordingService } from './recording.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { ZoomWebhookEvent } from './recording.types';

const service = new RecordingService();

export class RecordingController {
  // Zoom webhook (no auth — verified by signature)
  async handleWebhook(req: Request, res: Response, _next: NextFunction) {
    try {
      const rawBody = req.body as Buffer;
      const timestamp = req.headers['x-zm-request-timestamp'] as string;
      const signature = req.headers['x-zm-signature'] as string;

      // Parse body first (needed for URL validation challenge even without signature)
      let event: ZoomWebhookEvent;
      try {
        event = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      // URL validation challenge doesn't have signature headers — allow it
      if (event.event === 'endpoint.url_validation' && event.plainToken) {
        const response = service.handleUrlValidation(event.plainToken);
        return res.status(200).json(response);
      }

      // All other events MUST have valid signature
      if (!timestamp || !signature) {
        return res.status(403).json({ message: 'Missing webhook signature headers' });
      }
      const valid = service.verifyWebhookSignature(rawBody, timestamp, signature);
      if (!valid) {
        return res.status(403).json({ message: 'Invalid webhook signature' });
      }

      // Handle recording completed
      if (event.event === 'recording.completed') {
        await service.handleRecordingCompleted(event);
      }

      // Always return 200 to Zoom
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Zoom recording webhook error:', error);
      // Still return 200 to prevent Zoom retries on our errors
      res.status(200).json({ received: true });
    }
  }

  // Parent: List my recordings
  async getMyRecordings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getMyRecordings(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // Tutor: List my recordings
  async getTutorRecordings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getTutorRecordings(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // Parent/Tutor: Get presigned URL for session recording
  async getSessionRecordingUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getSessionRecordingUrl(
        req.params.sessionId as string,
        req.user!.id,
        req.user!.role as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Parent/Consultant: Get presigned URL for demo recording
  async getDemoRecordingUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getDemoRecordingUrl(
        req.params.demoBookingId as string,
        req.user!.id,
        req.user!.role as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Admin: List all recordings
  async listAllRecordings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAllRecordings(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // Admin: Retry a failed recording
  async retryRecording(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.retryRecording(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

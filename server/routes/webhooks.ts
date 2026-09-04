/**
 * Webhook Routes
 * Handles webhook callbacks from social media platforms
 */

import { Router, Request, Response } from 'express';
import { getWebhookHandler } from '../integrations/webhookHandler';
import { SocialMediaPlatform } from '../../shared/types/checkin';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * Rate limiter for webhooks
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many webhook requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Telegram Webhook
 * POST /webhooks/telegram
 */
router.post('/telegram', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const result = await handler.handleWebhook(SocialMediaPlatform.TELEGRAM, req.body);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * WhatsApp Webhook
 * POST /webhooks/whatsapp
 */
router.post('/whatsapp', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-hub-signature-256'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.WHATSAPP, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Facebook Webhook
 * POST /webhooks/facebook
 */
router.post('/facebook', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-hub-signature-256'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.FACEBOOK, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Instagram Webhook
 * POST /webhooks/instagram
 */
router.post('/instagram', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-hub-signature-256'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.INSTAGRAM, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * X (Twitter) Webhook
 * POST /webhooks/x
 */
router.post('/x', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-signature'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.X, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('X webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Zalo Webhook
 * POST /webhooks/zalo
 */
router.post('/zalo', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-signature'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.ZALO, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Zalo webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Reddit Webhook
 * POST /webhooks/reddit
 */
router.post('/reddit', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-signature'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.REDDIT, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Reddit webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Discord Webhook
 * POST /webhooks/discord
 */
router.post('/discord', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const handler = getWebhookHandler();
    const signature = req.headers['x-signature-ed25519'] as string;
    const timestamp = req.headers['x-signature-timestamp'] as string;
    const result = await handler.handleWebhook(SocialMediaPlatform.DISCORD, req.body, signature);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Discord webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Health check endpoint
 * GET /webhooks/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Webhook service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

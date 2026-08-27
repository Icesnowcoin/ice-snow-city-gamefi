/**
 * Social Media Verification Framework
 * Handles verification of shares across multiple social media platforms
 */

import { SocialMediaPlatform } from '../../shared/types/checkin';

export interface VerificationRequest {
  platform: SocialMediaPlatform;
  shareUrl: string;
  groupId?: string;
  postId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  platform: SocialMediaPlatform;
  message: string;
  verificationData?: {
    postId?: string;
    groupId?: string;
    timestamp?: Date;
    engagementMetrics?: {
      likes?: number;
      shares?: number;
      comments?: number;
    };
    metadata?: Record<string, any>;
  };
  error?: string;
  retryable?: boolean;
}

export interface WebhookPayload {
  platform: SocialMediaPlatform;
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}

/**
 * Base class for social media verifiers
 */
export abstract class BaseSocialMediaVerifier {
  protected platform: SocialMediaPlatform;
  protected apiKey: string;
  protected apiSecret?: string;

  constructor(platform: SocialMediaPlatform, apiKey: string, apiSecret?: string) {
    this.platform = platform;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Verify a share on the platform
   */
  abstract verify(request: VerificationRequest): Promise<VerificationResult>;

  /**
   * Handle webhook from platform
   */
  abstract handleWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * Validate webhook signature
   */
  abstract validateSignature(payload: string, signature: string): boolean;

  /**
   * Extract post/message ID from URL
   */
  protected extractIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is valid
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Verification manager to handle all platforms
 */
export class SocialMediaVerificationManager {
  private verifiers: Map<SocialMediaPlatform, BaseSocialMediaVerifier> = new Map();

  /**
   * Register a verifier for a platform
   */
  registerVerifier(platform: SocialMediaPlatform, verifier: BaseSocialMediaVerifier): void {
    this.verifiers.set(platform, verifier);
  }

  /**
   * Get verifier for a platform
   */
  getVerifier(platform: SocialMediaPlatform): BaseSocialMediaVerifier | null {
    return this.verifiers.get(platform) || null;
  }

  /**
   * Verify a share
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const verifier = this.getVerifier(request.platform);

    if (!verifier) {
      return {
        verified: false,
        platform: request.platform,
        message: `平台 ${request.platform} 暂不支持`,
        retryable: false,
      };
    }

    try {
      return await verifier.verify(request);
    } catch (error) {
      return {
        verified: false,
        platform: request.platform,
        message: error instanceof Error ? error.message : '验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const verifier = this.getVerifier(payload.platform);

    if (!verifier) {
      throw new Error(`平台 ${payload.platform} 暂不支持`);
    }

    await verifier.handleWebhook(payload);
  }
}

/**
 * Global verification manager instance
 */
export let verificationManager: SocialMediaVerificationManager | null = null;

/**
 * Initialize verification manager with all verifiers
 */
export async function initializeVerificationManager(): Promise<SocialMediaVerificationManager> {
  if (verificationManager) {
    return verificationManager;
  }

  verificationManager = new SocialMediaVerificationManager();

  // Import and register all verifiers
  const { TelegramVerifier } = await import('./verifiers/telegramVerifier');
  const { WhatsAppVerifier } = await import('./verifiers/whatsappVerifier');
  const { FacebookVerifier } = await import('./verifiers/facebookVerifier');
  const { InstagramVerifier } = await import('./verifiers/instagramVerifier');
  const { XVerifier } = await import('./verifiers/xVerifier');
  const { ZaloVerifier } = await import('./verifiers/zaloVerifier');
  const { RedditVerifier } = await import('./verifiers/redditVerifier');
  const { DiscordVerifier } = await import('./verifiers/discordVerifier');

  // Get API keys from environment
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  const xBearerToken = process.env.X_BEARER_TOKEN || '';
  const zaloAccessToken = process.env.ZALO_ACCESS_TOKEN || '';
  const redditClientId = process.env.REDDIT_CLIENT_ID || '';
  const redditClientSecret = process.env.REDDIT_CLIENT_SECRET || '';
  const discordBotToken = process.env.DISCORD_BOT_TOKEN || '';

  // Register verifiers
  verificationManager.registerVerifier(
    SocialMediaPlatform.TELEGRAM,
    new TelegramVerifier(SocialMediaPlatform.TELEGRAM, telegramBotToken)
  );

  verificationManager.registerVerifier(
    SocialMediaPlatform.WHATSAPP,
    new WhatsAppVerifier(SocialMediaPlatform.WHATSAPP, whatsappAccessToken)
  );

  verificationManager.registerVerifier(
    SocialMediaPlatform.FACEBOOK,
    new FacebookVerifier(SocialMediaPlatform.FACEBOOK, facebookAccessToken)
  );

  verificationManager.registerVerifier(
    SocialMediaPlatform.INSTAGRAM,
    new InstagramVerifier(SocialMediaPlatform.INSTAGRAM, instagramAccessToken)
  );

  verificationManager.registerVerifier(SocialMediaPlatform.X, new XVerifier(SocialMediaPlatform.X, xBearerToken));

  verificationManager.registerVerifier(
    SocialMediaPlatform.ZALO,
    new ZaloVerifier(SocialMediaPlatform.ZALO, zaloAccessToken)
  );

  verificationManager.registerVerifier(
    SocialMediaPlatform.REDDIT,
    new RedditVerifier(SocialMediaPlatform.REDDIT, redditClientId, redditClientSecret)
  );

  verificationManager.registerVerifier(
    SocialMediaPlatform.DISCORD,
    new DiscordVerifier(SocialMediaPlatform.DISCORD, discordBotToken)
  );

  return verificationManager;
}

/**
 * Get or initialize verification manager
 */
export async function getVerificationManager(): Promise<SocialMediaVerificationManager> {
  if (!verificationManager) {
    return await initializeVerificationManager();
  }
  return verificationManager;
}

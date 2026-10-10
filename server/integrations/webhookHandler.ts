/**
 * Webhook Handler Framework
 * Processes webhook callbacks from social media platforms
 */

import { SocialMediaPlatform } from '../../shared/types/checkin';
import { getVerificationManager } from './socialMediaVerifier';
import { getGlobalRetryManager, getGlobalRetryQueue } from './retryMechanism';
import { verifyAndClaimCheckin, logShareVerification } from '../game-logic/checkinSystem';

export interface WebhookContext {
  platform: SocialMediaPlatform;
  userId: number;
  checkinId: number;
  shareUrl: string;
  timestamp: Date;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Webhook handler manager
 */
export class WebhookHandlerManager {
  /**
   * Handle webhook from social media platform
   */
  async handleWebhook(
    platform: SocialMediaPlatform,
    payload: Record<string, any>,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      // Get verification manager
      const verificationManager = await getVerificationManager();
      const verifier = verificationManager.getVerifier(platform);

      if (!verifier) {
        return {
          success: false,
          message: `平台 ${platform} 暂不支持`,
          error: 'Platform not supported',
        };
      }

      // Validate webhook signature
      if (signature && !verifier.validateSignature(JSON.stringify(payload), signature)) {
        return {
          success: false,
          message: '无效的 Webhook 签名',
          error: 'Invalid webhook signature',
        };
      }

      // Process webhook based on platform
      await this.processWebhookByPlatform(platform, payload);

      return {
        success: true,
        message: `${platform} Webhook 处理成功`,
      };
    } catch (error) {
      console.error(`Error handling ${platform} webhook:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process webhook by platform
   */
  private async processWebhookByPlatform(
    platform: SocialMediaPlatform,
    payload: Record<string, any>
  ): Promise<void> {
    switch (platform) {
      case SocialMediaPlatform.TELEGRAM:
        await this.processTelegramWebhook(payload);
        break;
      case SocialMediaPlatform.WHATSAPP:
        await this.processWhatsAppWebhook(payload);
        break;
      case SocialMediaPlatform.FACEBOOK:
        await this.processFacebookWebhook(payload);
        break;
      case SocialMediaPlatform.INSTAGRAM:
        await this.processInstagramWebhook(payload);
        break;
      case SocialMediaPlatform.X:
        await this.processXWebhook(payload);
        break;
      case SocialMediaPlatform.ZALO:
        await this.processZaloWebhook(payload);
        break;
      case SocialMediaPlatform.REDDIT:
        await this.processRedditWebhook(payload);
        break;
      case SocialMediaPlatform.DISCORD:
        await this.processDiscordWebhook(payload);
        break;
    }
  }

  /**
   * Process Telegram webhook
   */
  private async processTelegramWebhook(payload: Record<string, any>): Promise<void> {
    // Telegram sends updates with message data
    const message = payload.message;
    if (!message) return;

    console.log('Processing Telegram webhook:', message);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process WhatsApp webhook
   */
  private async processWhatsAppWebhook(payload: Record<string, any>): Promise<void> {
    // WhatsApp sends webhook with message data
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages) return;

    console.log('Processing WhatsApp webhook:', messages);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process Facebook webhook
   */
  private async processFacebookWebhook(payload: Record<string, any>): Promise<void> {
    // Facebook sends webhook with entry data
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging;

    if (!messaging) return;

    console.log('Processing Facebook webhook:', messaging);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process Instagram webhook
   */
  private async processInstagramWebhook(payload: Record<string, any>): Promise<void> {
    // Instagram sends webhook with entry data
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging;

    if (!messaging) return;

    console.log('Processing Instagram webhook:', messaging);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process X (Twitter) webhook
   */
  private async processXWebhook(payload: Record<string, any>): Promise<void> {
    // X sends webhook with tweet data
    console.log('Processing X webhook:', payload);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process Zalo webhook
   */
  private async processZaloWebhook(payload: Record<string, any>): Promise<void> {
    // Zalo sends webhook with message data
    console.log('Processing Zalo webhook:', payload);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process Reddit webhook
   */
  private async processRedditWebhook(payload: Record<string, any>): Promise<void> {
    // Reddit sends webhook with post data
    console.log('Processing Reddit webhook:', payload);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Process Discord webhook
   */
  private async processDiscordWebhook(payload: Record<string, any>): Promise<void> {
    // Discord sends webhook with message data
    const message = payload.message;
    if (!message) return;

    console.log('Processing Discord webhook:', message);
    // Extract user ID and verify share
    // Update verification status
  }

  /**
   * Verify share and claim reward
   */
  async verifyAndClaimReward(context: WebhookContext): Promise<WebhookResponse | void> {
    try {
      const retryManager = getGlobalRetryManager();

      // Attempt to verify and claim
      const result = await verifyAndClaimCheckin(context.userId, Number(context.checkinId), {
        platform: context.platform,
        shareUrl: context.shareUrl,
        verifiedAt: context.timestamp,
      });

      if (result.success) {
        // Clear retry state on success
        retryManager.recordSuccess(`${context.platform}-${context.checkinId}`);

        return {
          success: true,
          message: '分享验证成功，ISC 奖励已发放',
          data: {
            reward: result.reward,
            checkinId: context.checkinId,
          },
        };
      } else {
        // Record failure and schedule retry
        const nextRetry = retryManager.recordFailure(
          `${context.platform}-${context.checkinId}`,
          new Error(result.message)
        );

        if (nextRetry) {
          // Schedule retry
          const retryQueue = getGlobalRetryQueue();
          retryQueue.add(
            `${context.platform}-${context.checkinId}`,
            async () => {
              await this.verifyAndClaimReward(context);
            },
            nextRetry
          );

          return {
            success: false,
            message: `验证失败，将在 ${nextRetry.toISOString()} 重试`,
            data: {
              nextRetryTime: nextRetry,
            },
          };
        } else {
          return {
            success: false,
            message: result.message,
            error: '已达到最大重试次数',
          };
        }
      }
    } catch (error) {
      console.error('Error verifying and claiming reward:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Global webhook handler manager instance
 */
let globalWebhookHandler: WebhookHandlerManager | null = null;

/**
 * Get or create global webhook handler
 */
export function getWebhookHandler(): WebhookHandlerManager {
  if (!globalWebhookHandler) {
    globalWebhookHandler = new WebhookHandlerManager();
  }
  return globalWebhookHandler;
}

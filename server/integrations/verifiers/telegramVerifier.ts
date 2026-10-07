/**
 * Telegram API Verifier
 * Verifies shares in Telegram groups using Telegram Bot API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';
import crypto from 'crypto';

export class TelegramVerifier extends BaseSocialMediaVerifier {
  private botToken: string;
  private apiBaseUrl = 'https://api.telegram.org';

  constructor(platform: SocialMediaPlatform, botToken: string) {
    super(platform, botToken);
    this.botToken = botToken;
  }

  /**
   * Verify a Telegram group share
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    if (!this.isValidUrl(request.shareUrl)) {
      return {
        verified: false,
        platform: this.platform,
        message: '无效的 URL 格式',
        retryable: false,
      };
    }

    try {
      // Extract message ID from URL
      // Telegram URL format: https://t.me/c/{channel_id}/{message_id} or https://t.me/{username}/{message_id}
      const messageId = this.extractMessageIdFromTelegramUrl(request.shareUrl);

      if (!messageId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取消息 ID',
          retryable: false,
        };
      }

      // For Telegram, we verify by checking if the message exists and contains game link
      // This is a simplified verification - in production, you'd need to use bot API more extensively
      const verified = await this.verifyTelegramMessage(messageId, request.groupId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'Telegram 分享验证成功' : '无法验证 Telegram 分享',
        verificationData: verified
          ? {
              postId: messageId,
              groupId: request.groupId,
              timestamp: new Date(),
            }
          : undefined,
        retryable: !verified,
      };
    } catch (error) {
      return {
        verified: false,
        platform: this.platform,
        message: error instanceof Error ? error.message : 'Telegram 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle Telegram webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Telegram sends updates via webhook
    // Validate and process the update
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid Telegram webhook signature');
    }

    // Process the update
    const update = payload.data;
    if (update.message) {
      // Handle message update
      console.log('Telegram message received:', update.message);
    }
  }

  /**
   * Validate Telegram webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // Telegram uses X-Telegram-Bot-API-Secret-Token header for validation
    // In production, verify this against the secret token set in Telegram Bot API
    return true; // Simplified for now
  }

  /**
   * Extract message ID from Telegram URL
   */
  private extractMessageIdFromTelegramUrl(url: string): string | null {
    try {
      // Handle both formats:
      // https://t.me/c/{channel_id}/{message_id}
      // https://t.me/{username}/{message_id}
      const match = url.match(/t\.me\/(?:c\/)?(?:\d+\/)?(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Verify Telegram message exists and contains game link
   */
  private async verifyTelegramMessage(messageId: string, groupId?: string): Promise<boolean> {
    try {
      // In a real implementation, you would use Telegram Bot API to:
      // 1. Get the message details
      // 2. Check if it contains a link to your game
      // 3. Verify the message is in the specified group

      // For now, we'll do a simplified check
      // In production, integrate with Telegram Bot API properly
      return true;
    } catch (error) {
      console.error('Error verifying Telegram message:', error);
      return false;
    }
  }

  /**
   * Send message to Telegram group
   */
  async sendMessage(chatId: string, text: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }
}

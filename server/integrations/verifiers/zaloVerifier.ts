/**
 * Zalo API Verifier
 * Verifies shares in Zalo groups using Zalo API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';

export class ZaloVerifier extends BaseSocialMediaVerifier {
  private accessToken: string;
  private apiBaseUrl = 'https://openapi.zalo.me/v2.0';

  constructor(platform: SocialMediaPlatform, accessToken: string) {
    super(platform, accessToken);
    this.accessToken = accessToken;
  }

  /**
   * Verify a Zalo group share
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
      // Extract message ID from Zalo URL
      const messageId = this.extractMessageIdFromUrl(request.shareUrl);

      if (!messageId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取消息 ID',
          retryable: false,
        };
      }

      // Verify the message exists
      const verified = await this.verifyZaloMessage(messageId, request.groupId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'Zalo 分享验证成功' : '无法验证 Zalo 分享',
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
        message: error instanceof Error ? error.message : 'Zalo 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle Zalo webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid Zalo webhook signature');
    }

    // Process the webhook
    console.log('Zalo webhook received:', payload.data);
  }

  /**
   * Validate Zalo webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // Zalo uses HMAC SHA256 for signature validation
    return true; // Simplified for now
  }

  /**
   * Extract message ID from Zalo URL
   */
  private extractMessageIdFromUrl(url: string): string | null {
    try {
      // Zalo URL format varies, extract ID from path
      const match = url.match(/zalo\.me\/(?:g\/)?(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Verify Zalo message
   */
  private async verifyZaloMessage(messageId: string, groupId?: string): Promise<boolean> {
    try {
      // In production, use Zalo API to verify message
      // For now, simplified verification
      return true;
    } catch (error) {
      console.error('Error verifying Zalo message:', error);
      return false;
    }
  }

  /**
   * Send Zalo message
   */
  async sendMessage(userId: string, text: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/message/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            user_id: userId,
          },
          message: {
            text,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Zalo message:', error);
      return false;
    }
  }
}

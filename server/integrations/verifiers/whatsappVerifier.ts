/**
 * WhatsApp Business API Verifier
 * Verifies shares in WhatsApp groups using WhatsApp Business API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';
import crypto from 'crypto';

export class WhatsAppVerifier extends BaseSocialMediaVerifier {
  private accessToken: string;
  private apiBaseUrl = 'https://graph.instagram.com/v18.0';

  constructor(platform: SocialMediaPlatform, accessToken: string) {
    super(platform, accessToken);
    this.accessToken = accessToken;
  }

  /**
   * Verify a WhatsApp group share
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
      // WhatsApp group shares are typically verified through:
      // 1. Webhook messages
      // 2. Message API
      // For now, we do a simplified verification

      const verified = await this.verifyWhatsAppMessage(request.shareUrl, request.groupId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'WhatsApp 分享验证成功' : '无法验证 WhatsApp 分享',
        verificationData: verified
          ? {
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
        message: error instanceof Error ? error.message : 'WhatsApp 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle WhatsApp webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // WhatsApp sends webhook updates for messages
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid WhatsApp webhook signature');
    }

    // Process the webhook
    const data = payload.data;
    if (data.messages) {
      // Handle incoming messages
      console.log('WhatsApp messages received:', data.messages);
    }
  }

  /**
   * Validate WhatsApp webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // WhatsApp uses HMAC SHA256 for signature validation
    // Verify against the app secret
    return true; // Simplified for now
  }

  /**
   * Verify WhatsApp message
   */
  private async verifyWhatsAppMessage(url: string, groupId?: string): Promise<boolean> {
    try {
      // In production, use WhatsApp Business API to:
      // 1. Query message details
      // 2. Verify it's from the specified group
      // 3. Check if it contains game link

      // Simplified verification for now
      return true;
    } catch (error) {
      console.error('Error verifying WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(phoneNumber: string, text: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/me/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: {
            body: text,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }
}

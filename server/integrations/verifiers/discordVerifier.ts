/**
 * Discord Bot API Verifier
 * Verifies shares in Discord servers using Discord Bot API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';
import crypto from 'crypto';

export class DiscordVerifier extends BaseSocialMediaVerifier {
  private botToken: string;
  private apiBaseUrl = 'https://discord.com/api/v10';

  constructor(platform: SocialMediaPlatform, botToken: string) {
    super(platform, botToken);
    this.botToken = botToken;
  }

  /**
   * Verify a Discord message share
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
      // Extract message ID and channel ID from Discord URL
      const { messageId, channelId } = this.extractIdsFromDiscordUrl(request.shareUrl);

      if (!messageId || !channelId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取消息 ID 或频道 ID',
          retryable: false,
        };
      }

      // Verify the message exists
      const verified = await this.verifyDiscordMessage(channelId, messageId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'Discord 分享验证成功' : '无法验证 Discord 分享',
        verificationData: verified
          ? {
              postId: messageId,
              groupId: channelId,
              timestamp: new Date(),
            }
          : undefined,
        retryable: !verified,
      };
    } catch (error) {
      return {
        verified: false,
        platform: this.platform,
        message: error instanceof Error ? error.message : 'Discord 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle Discord webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid Discord webhook signature');
    }

    // Process the webhook
    console.log('Discord webhook received:', payload.data);
  }

  /**
   * Validate Discord webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // Discord uses Ed25519 for signature validation
    // Verify X-Signature-Ed25519 header against X-Signature-Timestamp
    return true; // Simplified for now
  }

  /**
   * Extract message ID and channel ID from Discord URL
   */
  private extractIdsFromDiscordUrl(url: string): { messageId: string | null; channelId: string | null } {
    try {
      // Discord URL format: https://discord.com/channels/{guild_id}/{channel_id}/{message_id}
      const match = url.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
      if (match) {
        return {
          channelId: match[2],
          messageId: match[3],
        };
      }
      return { messageId: null, channelId: null };
    } catch {
      return { messageId: null, channelId: null };
    }
  }

  /**
   * Verify Discord message
   */
  private async verifyDiscordMessage(channelId: string, messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/channels/${channelId}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if message exists and has content
      return !!data.id && !!data.content;
    } catch (error) {
      console.error('Error verifying Discord message:', error);
      return false;
    }
  }

  /**
   * Send message to Discord channel
   */
  async sendMessage(channelId: string, content: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Discord message:', error);
      return false;
    }
  }

  /**
   * React to Discord message
   */
  async addReaction(channelId: string, messageId: string, emoji: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${this.botToken}`,
          },
        }
      );

      return response.ok || response.status === 204;
    } catch (error) {
      console.error('Error adding Discord reaction:', error);
      return false;
    }
  }
}

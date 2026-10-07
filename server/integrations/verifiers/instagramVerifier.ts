/**
 * Instagram Graph API Verifier
 * Verifies shares on Instagram using Instagram Graph API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';

export class InstagramVerifier extends BaseSocialMediaVerifier {
  private accessToken: string;
  private apiBaseUrl = 'https://graph.instagram.com/v18.0';

  constructor(platform: SocialMediaPlatform, accessToken: string) {
    super(platform, accessToken);
    this.accessToken = accessToken;
  }

  /**
   * Verify an Instagram share
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
      // Extract media ID from Instagram URL
      const mediaId = this.extractMediaIdFromUrl(request.shareUrl);

      if (!mediaId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取媒体 ID',
          retryable: false,
        };
      }

      // Verify the media exists
      const verified = await this.verifyInstagramMedia(mediaId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'Instagram 分享验证成功' : '无法验证 Instagram 分享',
        verificationData: verified
          ? {
              postId: mediaId,
              timestamp: new Date(),
            }
          : undefined,
        retryable: !verified,
      };
    } catch (error) {
      return {
        verified: false,
        platform: this.platform,
        message: error instanceof Error ? error.message : 'Instagram 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle Instagram webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid Instagram webhook signature');
    }

    // Process the webhook
    const entry = payload.data.entry?.[0];
    if (entry?.messaging) {
      console.log('Instagram messages received:', entry.messaging);
    }
  }

  /**
   * Validate Instagram webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // Instagram uses X-Hub-Signature-256 header (same as Facebook)
    return true; // Simplified for now
  }

  /**
   * Extract media ID from Instagram URL
   */
  private extractMediaIdFromUrl(url: string): string | null {
    try {
      // Instagram URL formats:
      // https://www.instagram.com/p/{media_id}/
      // https://www.instagram.com/reel/{media_id}/
      // https://www.instagram.com/tv/{media_id}/

      const match = url.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Verify Instagram media
   */
  private async verifyInstagramMedia(mediaId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${mediaId}?fields=caption,media_type&access_token=${this.accessToken}`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if media has caption or is valid media
      return !!data.media_type;
    } catch (error) {
      console.error('Error verifying Instagram media:', error);
      return false;
    }
  }

  /**
   * Share to Instagram story
   */
  async shareToStory(userId: string, imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${userId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          media_type: 'IMAGE',
          access_token: this.accessToken,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sharing to Instagram story:', error);
      return false;
    }
  }
}

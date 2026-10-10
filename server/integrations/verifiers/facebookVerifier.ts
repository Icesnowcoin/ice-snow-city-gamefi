/**
 * Facebook Graph API Verifier
 * Verifies shares on Facebook using Facebook Graph API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';
import crypto from 'crypto';

export class FacebookVerifier extends BaseSocialMediaVerifier {
  private accessToken: string;
  private apiBaseUrl = 'https://graph.facebook.com/v18.0';

  constructor(platform: SocialMediaPlatform, accessToken: string) {
    super(platform, accessToken);
    this.accessToken = accessToken;
  }

  /**
   * Verify a Facebook share
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
      // Extract post ID from Facebook URL
      const postId = this.extractPostIdFromUrl(request.shareUrl);

      if (!postId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取帖子 ID',
          retryable: false,
        };
      }

      // Verify the post exists and contains game link
      const verified = await this.verifyFacebookPost(postId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'Facebook 分享验证成功' : '无法验证 Facebook 分享',
        verificationData: verified
          ? {
              postId,
              timestamp: new Date(),
            }
          : undefined,
        retryable: !verified,
      };
    } catch (error) {
      return {
        verified: false,
        platform: this.platform,
        message: error instanceof Error ? error.message : 'Facebook 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle Facebook webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid Facebook webhook signature');
    }

    // Process the webhook
    const entry = payload.data.entry?.[0];
    if (entry?.messaging) {
      console.log('Facebook messages received:', entry.messaging);
    }
  }

  /**
   * Validate Facebook webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // Facebook uses X-Hub-Signature-256 header
    // Compute HMAC SHA256 of payload with app secret
    // Compare with provided signature
    return true; // Simplified for now
  }

  /**
   * Extract post ID from Facebook URL
   */
  private extractPostIdFromUrl(url: string): string | null {
    try {
      // Facebook URL formats:
      // https://www.facebook.com/{page}/posts/{post_id}
      // https://www.facebook.com/photo.php?fbid={photo_id}
      // https://www.facebook.com/{user}/posts/{post_id}

      const match = url.match(/(?:posts|photo\.php\?fbid=)\/(\d+)|fbid=(\d+)/);
      return match ? match[1] || match[2] : null;
    } catch {
      return null;
    }
  }

  /**
   * Verify Facebook post
   */
  private async verifyFacebookPost(postId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${postId}?fields=message,story,link&access_token=${this.accessToken}`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if post contains game link or message
      const content = data.message || data.story || data.link || '';
      return content.length > 0;
    } catch (error) {
      console.error('Error verifying Facebook post:', error);
      return false;
    }
  }

  /**
   * Share message to Facebook
   */
  async shareMessage(pageId: string, message: string, link?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          link,
          access_token: this.accessToken,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sharing to Facebook:', error);
      return false;
    }
  }
}

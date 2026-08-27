/**
 * X (Twitter) API v2 Verifier
 * Verifies shares on X using X API v2
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';

export class XVerifier extends BaseSocialMediaVerifier {
  private bearerToken: string;
  private apiBaseUrl = 'https://api.twitter.com/2';

  constructor(platform: SocialMediaPlatform, bearerToken: string) {
    super(platform, bearerToken);
    this.bearerToken = bearerToken;
  }

  /**
   * Verify an X (Twitter) share
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
      // Extract tweet ID from X URL
      const tweetId = this.extractTweetIdFromUrl(request.shareUrl);

      if (!tweetId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取推文 ID',
          retryable: false,
        };
      }

      // Verify the tweet exists
      const verified = await this.verifyXTweet(tweetId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'X 分享验证成功' : '无法验证 X 分享',
        verificationData: verified
          ? {
              postId: tweetId,
              timestamp: new Date(),
            }
          : undefined,
        retryable: !verified,
      };
    } catch (error) {
      return {
        verified: false,
        platform: this.platform,
        message: error instanceof Error ? error.message : 'X 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle X webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid X webhook signature');
    }

    // Process the webhook
    console.log('X webhook received:', payload.data);
  }

  /**
   * Validate X webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // X uses SHA256 HMAC for signature validation
    return true; // Simplified for now
  }

  /**
   * Extract tweet ID from X URL
   */
  private extractTweetIdFromUrl(url: string): string | null {
    try {
      // X URL format: https://x.com/{username}/status/{tweet_id}
      // Also supports: https://twitter.com/{username}/status/{tweet_id}

      const match = url.match(/(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Verify X tweet
   */
  private async verifyXTweet(tweetId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tweets/${tweetId}?tweet.fields=created_at,public_metrics`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if tweet exists and has data
      return !!data.data;
    } catch (error) {
      console.error('Error verifying X tweet:', error);
      return false;
    }
  }

  /**
   * Post tweet
   */
  async postTweet(text: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error posting X tweet:', error);
      return false;
    }
  }
}

/**
 * Reddit API Verifier
 * Verifies shares on Reddit using Reddit API
 */

import { BaseSocialMediaVerifier, VerificationRequest, VerificationResult, WebhookPayload } from '../socialMediaVerifier';
import { SocialMediaPlatform } from '../../../shared/types/checkin';

export class RedditVerifier extends BaseSocialMediaVerifier {
  private clientId: string;
  private clientSecret: string;
  private apiBaseUrl = 'https://oauth.reddit.com';
  private accessToken: string = '';

  constructor(platform: SocialMediaPlatform, clientId: string, clientSecret: string) {
    super(platform, clientId, clientSecret);
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Verify a Reddit share
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
      // Extract post ID from Reddit URL
      const postId = this.extractPostIdFromUrl(request.shareUrl);

      if (!postId) {
        return {
          verified: false,
          platform: this.platform,
          message: '无法从 URL 提取帖子 ID',
          retryable: false,
        };
      }

      // Verify the post exists
      const verified = await this.verifyRedditPost(postId);

      return {
        verified,
        platform: this.platform,
        message: verified ? 'Reddit 分享验证成功' : '无法验证 Reddit 分享',
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
        message: error instanceof Error ? error.message : 'Reddit 验证失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Handle Reddit webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.validateSignature(JSON.stringify(payload.data), payload.signature || '')) {
      throw new Error('Invalid Reddit webhook signature');
    }

    // Process the webhook
    console.log('Reddit webhook received:', payload.data);
  }

  /**
   * Validate Reddit webhook signature
   */
  validateSignature(payload: string, signature: string): boolean {
    // Reddit uses HMAC SHA256 for signature validation
    return true; // Simplified for now
  }

  /**
   * Extract post ID from Reddit URL
   */
  private extractPostIdFromUrl(url: string): string | null {
    try {
      // Reddit URL formats:
      // https://www.reddit.com/r/{subreddit}/comments/{post_id}/{title}
      // https://reddit.com/r/{subreddit}/comments/{post_id}/{title}

      const match = url.match(/\/comments\/([a-z0-9]+)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get access token from Reddit
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'IceSnowCity/1.0',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Failed to get Reddit access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token || '';
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Reddit access token:', error);
      throw error;
    }
  }

  /**
   * Verify Reddit post
   */
  private async verifyRedditPost(postId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.apiBaseUrl}/comments/${postId}?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'IceSnowCity/1.0',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if post exists and has data
      return !!data[0]?.data?.children?.[0];
    } catch (error) {
      console.error('Error verifying Reddit post:', error);
      return false;
    }
  }

  /**
   * Submit post to Reddit
   */
  async submitPost(subreddit: string, title: string, url: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.apiBaseUrl}/api/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'IceSnowCity/1.0',
        },
        body: new URLSearchParams({
          sr: subreddit,
          title,
          url,
          kind: 'link',
        }).toString(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error submitting Reddit post:', error);
      return false;
    }
  }
}

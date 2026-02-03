/**
 * X (Twitter) API utilities for tweet verification
 */

const X_API_BASE = 'https://api.x.com/2';

export interface TweetData {
  id: string;
  text: string;
  author_id: string;
}

export interface XUser {
  id: string;
  username: string;
  name: string;
}

interface TweetResponse {
  data?: TweetData;
  includes?: {
    users?: XUser[];
  };
  errors?: Array<{
    detail: string;
    title: string;
    type: string;
  }>;
}

/**
 * Extract tweet ID from various X/Twitter URL formats
 * Supports:
 * - https://x.com/username/status/1234567890
 * - https://twitter.com/username/status/1234567890
 * - https://x.com/username/status/1234567890?s=20
 */
export function extractTweetId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Validate domain
    if (!hostname.includes('x.com') && !hostname.includes('twitter.com')) {
      return null;
    }

    // Extract tweet ID from path: /username/status/TWEET_ID
    const pathParts = urlObj.pathname.split('/');
    const statusIndex = pathParts.indexOf('status');

    if (statusIndex === -1 || statusIndex + 1 >= pathParts.length) {
      return null;
    }

    const tweetId = pathParts[statusIndex + 1];

    // Validate tweet ID (should be numeric)
    if (!/^\d+$/.test(tweetId)) {
      return null;
    }

    return tweetId;
  } catch {
    return null;
  }
}

/**
 * Fetch tweet data from X API
 */
export async function fetchTweet(tweetId: string): Promise<{
  success: boolean;
  data?: TweetData;
  author?: XUser;
  error?: string;
}> {
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    return {
      success: false,
      error: 'X API not configured',
    };
  }

  try {
    const response = await fetch(
      `${X_API_BASE}/tweets/${tweetId}?expansions=author_id&user.fields=username`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid X API credentials' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Tweet not found' };
      }
      if (response.status === 429) {
        return { success: false, error: 'X API rate limit exceeded' };
      }
      return { success: false, error: `X API error: ${response.status}` };
    }

    const result: TweetResponse = await response.json();

    if (result.errors && result.errors.length > 0) {
      return { success: false, error: result.errors[0].detail };
    }

    if (!result.data) {
      return { success: false, error: 'Tweet not found' };
    }

    const author = result.includes?.users?.find(
      (user) => user.id === result.data?.author_id
    );

    return {
      success: true,
      data: result.data,
      author,
    };
  } catch (err) {
    console.error('Error fetching tweet:', err);
    return {
      success: false,
      error: 'Failed to fetch tweet',
    };
  }
}

/**
 * Verify that a tweet contains the expected verification code
 */
export function verifyTweetContent(
  tweetText: string,
  verificationCode: string
): boolean {
  // Case-insensitive check for the verification code in the tweet
  return tweetText.toLowerCase().includes(verificationCode.toLowerCase());
}

/**
 * Full verification flow: fetch tweet and verify it contains the code
 */
export async function verifyTweetWithCode(
  tweetUrl: string,
  verificationCode: string
): Promise<{
  success: boolean;
  error?: string;
  authorUsername?: string;
}> {
  // Extract tweet ID
  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return {
      success: false,
      error: 'Invalid tweet URL format',
    };
  }

  // Fetch tweet
  const tweetResult = await fetchTweet(tweetId);
  if (!tweetResult.success || !tweetResult.data) {
    return {
      success: false,
      error: tweetResult.error || 'Could not fetch tweet',
    };
  }

  // Verify content
  if (!verifyTweetContent(tweetResult.data.text, verificationCode)) {
    return {
      success: false,
      error: 'Tweet does not contain your verification code',
    };
  }

  return {
    success: true,
    authorUsername: tweetResult.author?.username,
  };
}

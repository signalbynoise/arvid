const GITHUB_API_BASE = 'https://api.github.com';
const MIN_REMAINING_BEFORE_PAUSE = 10;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

interface GitHubClientOptions {
  token: string;
}

interface RateLimitState {
  remaining: number;
  resetAt: number;
}

export class GitHubClient {
  private token: string;
  private rateLimit: RateLimitState = { remaining: 5000, resetAt: 0 };

  constructor(options: GitHubClientOptions) {
    this.token = options.token;
  }

  async request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
    const method = options?.method ?? 'GET';
    const url = `${GITHUB_API_BASE}${path}`;

    await this.waitForRateLimit();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.info(
          `[INFO] [githubClient:retry] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`,
          JSON.stringify({ path, backoffMs: backoff }),
        );
        await sleep(backoff);
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };

      const res = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      this.updateRateLimit(res);

      if (res.ok) {
        console.debug(
          `[DEBUG] [githubClient:request] ${method} ${path} succeeded`,
          JSON.stringify({ status: res.status, remaining: this.rateLimit.remaining }),
        );
        return await res.json() as T;
      }

      if (res.status === 401) {
        const errorBody = await res.text();
        console.error(
          `[ERROR] [githubClient:request] Authentication failed`,
          JSON.stringify({ path, status: res.status, body: errorBody }),
        );
        throw new GitHubAuthError('GitHub token is invalid or revoked');
      }

      if (res.status === 403 || res.status === 429) {
        lastError = new Error(`GitHub rate limited: ${res.status}`);
        console.warn(
          `[WARN] [githubClient:request] Rate limited`,
          JSON.stringify({ path, status: res.status, remaining: this.rateLimit.remaining }),
        );
        await this.waitForRateLimit();
        continue;
      }

      if (res.status >= 500) {
        lastError = new Error(`GitHub server error: ${res.status}`);
        console.warn(
          `[WARN] [githubClient:request] Server error, retrying`,
          JSON.stringify({ path, status: res.status }),
        );
        continue;
      }

      const errorBody = await res.text();
      console.error(
        `[ERROR] [githubClient:request] Request failed`,
        JSON.stringify({ path, status: res.status, body: errorBody }),
      );
      throw new GitHubApiError(`GitHub API error: ${res.status}`, res.status, path);
    }

    throw lastError ?? new Error(`GitHub request failed after ${MAX_RETRIES + 1} attempts`);
  }

  private updateRateLimit(res: Response): void {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const reset = res.headers.get('X-RateLimit-Reset');

    if (remaining !== null) {
      this.rateLimit.remaining = parseInt(remaining, 10);
    }
    if (reset !== null) {
      this.rateLimit.resetAt = parseInt(reset, 10) * 1000;
    }
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.rateLimit.remaining >= MIN_REMAINING_BEFORE_PAUSE) return;

    const now = Date.now();
    const waitMs = Math.max(0, this.rateLimit.resetAt - now + 1000);

    if (waitMs > 0 && waitMs < 3600_000) {
      console.info(
        `[INFO] [githubClient:rateLimit] Pausing for rate limit reset`,
        JSON.stringify({ waitMs, remaining: this.rateLimit.remaining }),
      );
      await sleep(waitMs);
    }
  }
}

export class GitHubAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubAuthError';
  }
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

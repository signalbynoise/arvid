const SUPABASE_API_BASE = 'https://api.supabase.com';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

interface SupabaseMgmtClientOptions {
  accessToken: string;
}

interface RateLimitState {
  remaining: number;
  resetAt: number;
}

export class SupabaseManagementClient {
  private accessToken: string;
  private rateLimit: RateLimitState = { remaining: 120, resetAt: 0 };

  constructor(options: SupabaseMgmtClientOptions) {
    this.accessToken = options.accessToken;
  }

  async request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
    const method = options?.method ?? 'GET';
    const url = `${SUPABASE_API_BASE}${path}`;

    await this.waitForRateLimit();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.info(
          `[INFO] [supabaseMgmt:retry] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`,
          JSON.stringify({ path, backoffMs: backoff }),
        );
        await sleep(backoff);
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      this.updateRateLimit(res);

      if (res.ok) {
        console.debug(
          `[DEBUG] [supabaseMgmt:request] ${method} ${path} succeeded`,
          JSON.stringify({ status: res.status, remaining: this.rateLimit.remaining }),
        );
        return await res.json() as T;
      }

      if (res.status === 401) {
        const errorBody = await res.text();
        console.error(
          `[ERROR] [supabaseMgmt:request] Authentication failed`,
          JSON.stringify({ path, status: res.status, body: errorBody }),
        );
        throw new SupabaseMgmtAuthError('Supabase Management API token is invalid or expired');
      }

      if (res.status === 429) {
        lastError = new Error(`Supabase Management API rate limited: ${res.status}`);
        console.warn(
          `[WARN] [supabaseMgmt:request] Rate limited`,
          JSON.stringify({ path, remaining: this.rateLimit.remaining }),
        );
        await this.waitForRateLimit();
        continue;
      }

      if (res.status >= 500) {
        lastError = new Error(`Supabase Management API server error: ${res.status}`);
        console.warn(
          `[WARN] [supabaseMgmt:request] Server error, retrying`,
          JSON.stringify({ path, status: res.status }),
        );
        continue;
      }

      const errorBody = await res.text();
      console.error(
        `[ERROR] [supabaseMgmt:request] Request failed`,
        JSON.stringify({ path, status: res.status, body: errorBody }),
      );
      throw new SupabaseMgmtApiError(`Supabase Management API error: ${res.status}`, res.status, path);
    }

    throw lastError ?? new Error(`Supabase Management API request failed after ${MAX_RETRIES + 1} attempts`);
  }

  async readOnlyQuery<T = unknown>(projectRef: string, query: string): Promise<T> {
    return this.request<T>(`/v1/projects/${projectRef}/database/query/read-only`, {
      method: 'POST',
      body: { query },
    });
  }

  private updateRateLimit(res: Response): void {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const reset = res.headers.get('X-RateLimit-Reset');

    if (remaining !== null) {
      this.rateLimit.remaining = parseInt(remaining, 10);
    }
    if (reset !== null) {
      this.rateLimit.resetAt = Date.now() + parseInt(reset, 10) * 1000;
    }
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.rateLimit.remaining >= 5) return;

    const now = Date.now();
    const waitMs = Math.max(0, this.rateLimit.resetAt - now + 1000);

    if (waitMs > 0 && waitMs < 120_000) {
      console.info(
        `[INFO] [supabaseMgmt:rateLimit] Pausing for rate limit reset`,
        JSON.stringify({ waitMs, remaining: this.rateLimit.remaining }),
      );
      await sleep(waitMs);
    }
  }
}

export class SupabaseMgmtAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseMgmtAuthError';
  }
}

export class SupabaseMgmtApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'SupabaseMgmtApiError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

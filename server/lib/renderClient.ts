const RENDER_API_BASE = 'https://api.render.com/v1';
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000;

interface RenderClientOptions {
  apiKey: string;
}

interface RenderOwner {
  owner: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
}

interface RenderServiceResponse {
  service: {
    id: string;
    name: string;
    type: string;
    serviceDetails?: { url?: string };
    branch?: string;
    repo?: string;
    suspended?: string;
  };
  cursor?: string;
}

interface RenderDeployResponse {
  id: string;
  commit?: { id: string; message?: string; createdAt?: string };
  status: string;
  finishedAt?: string;
  createdAt: string;
}

interface RenderDeployListItem {
  deploy: RenderDeployResponse;
  cursor?: string;
}

export class RenderClient {
  private apiKey: string;

  constructor(options: RenderClientOptions) {
    this.apiKey = options.apiKey;
  }

  async request<T>(path: string, options?: { method?: string; body?: unknown; params?: Record<string, string> }): Promise<T> {
    const method = options?.method ?? 'GET';
    const url = new URL(`${RENDER_API_BASE}${path}`);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.info(
          `[INFO] [renderClient:retry] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`,
          JSON.stringify({ path, backoffMs: backoff }),
        );
        await sleep(backoff);
      }

      const res = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (res.ok) {
        console.debug(
          `[DEBUG] [renderClient:request] ${method} ${path} succeeded`,
          JSON.stringify({ status: res.status }),
        );
        return await res.json() as T;
      }

      if (res.status === 401) {
        const errorBody = await res.text();
        console.error(
          `[ERROR] [renderClient:request] Authentication failed`,
          JSON.stringify({ path, status: res.status, body: errorBody }),
        );
        throw new RenderAuthError('Render API key is invalid or revoked');
      }

      if (res.status === 429) {
        lastError = new Error(`Render rate limited: ${res.status}`);
        console.warn(
          `[WARN] [renderClient:request] Rate limited`,
          JSON.stringify({ path, status: res.status }),
        );
        continue;
      }

      if (res.status >= 500) {
        lastError = new Error(`Render server error: ${res.status}`);
        console.warn(
          `[WARN] [renderClient:request] Server error, retrying`,
          JSON.stringify({ path, status: res.status }),
        );
        continue;
      }

      const errorBody = await res.text();
      console.error(
        `[ERROR] [renderClient:request] Request failed`,
        JSON.stringify({ path, status: res.status, body: errorBody }),
      );
      throw new RenderApiError(`Render API error: ${res.status}`, res.status, path);
    }

    throw lastError ?? new Error(`Render request failed after ${MAX_RETRIES + 1} attempts`);
  }

  async listOwners(): Promise<RenderOwner[]> {
    return this.request<RenderOwner[]>('/owners');
  }

  async listServices(ownerId?: string): Promise<RenderServiceResponse[]> {
    const params: Record<string, string> = { limit: '50' };
    if (ownerId) params.ownerId = ownerId;
    return this.request<RenderServiceResponse[]>('/services', { params });
  }

  async getService(serviceId: string): Promise<RenderServiceResponse> {
    return this.request<RenderServiceResponse>(`/services/${serviceId}`);
  }

  async listDeploys(serviceId: string, opts?: { limit?: number }): Promise<RenderDeployResponse[]> {
    const raw = await this.request<RenderDeployListItem[]>(`/services/${serviceId}/deploys`, {
      params: { limit: String(opts?.limit ?? 5) },
    });
    return raw.map(item => item.deploy);
  }
}

export class RenderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RenderAuthError';
  }
}

export class RenderApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'RenderApiError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

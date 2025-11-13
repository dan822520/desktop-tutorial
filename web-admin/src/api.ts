export interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function apiRequest<T = unknown>(
  baseUrl: string,
  token: string | null,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = new URL(path, ensureTrailingSlash(baseUrl));
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers
  });

  const result: ApiResponse<T> = {
    ok: response.ok,
    status: response.status
  };

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => undefined);
    if (response.ok) {
      result.data = payload;
    } else {
      result.error = (payload as any)?.error || (payload as any)?.message || response.statusText;
      result.data = payload;
    }
  } else {
    const text = await response.text();
    if (response.ok) {
      result.data = text as unknown as T;
    } else {
      result.error = text || response.statusText;
    }
  }

  if (!result.ok && !result.error) {
    result.error = response.statusText;
  }

  return result;
}

function ensureTrailingSlash(url: string) {
  if (!url.endsWith('/')) {
    return `${url}/`;
  }
  return url;
}

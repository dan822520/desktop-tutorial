export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

export const buildUrl = (baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

export const apiRequest = async <T = unknown>(
  baseUrl: string,
  token: string | null,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { query, headers, ...rest } = options;
  const url = buildUrl(baseUrl, path, query);
  const init: RequestInit = {
    ...rest,
    headers: new Headers(headers)
  };

  if (token) {
    (init.headers as Headers).set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !(init.headers as Headers).has('Content-Type')) {
    (init.headers as Headers).set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, init);
    const text = await response.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = text;
      }
    }
    if (!response.ok) {
      const message = typeof data === 'object' && data !== null ? (data as any).message || (data as any).error : undefined;
      return { ok: false, status: response.status, error: message || response.statusText, data: data as T };
    }
    return { ok: true, status: response.status, data: data as T };
  } catch (error) {
    return { ok: false, status: 0, error: (error as Error).message };
  }
};

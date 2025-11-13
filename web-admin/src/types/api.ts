import type { ApiResponse, RequestOptions } from '../services/apiClient';

export type ApiInvoker = <T = unknown>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;

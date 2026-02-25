export interface ApiError {
  code: string;
  field?: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T, M = null> {
  data: T | null;
  meta: M | null;
  errors: ApiError[] | null;
}

/**
 * Build a successful response envelope.
 */
export function success<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T, Record<string, unknown>> {
  return {
    data,
    meta: meta ?? null,
    errors: null,
  };
}

/**
 * Build a paginated response envelope.
 */
export function paginated<T>(
  data: T,
  page: number,
  perPage: number,
  total: number,
): ApiResponse<T, PaginationMeta> {
  return {
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
    errors: null,
  };
}

/**
 * Build an error response envelope.
 */
export function error(errors: ApiError[]): ApiResponse<null> {
  return {
    data: null,
    meta: null,
    errors,
  };
}

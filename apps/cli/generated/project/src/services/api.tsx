export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standardized API client for all backend requests.
 */
export const apiClient = async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'An unexpected error occurred');
  }

  return response.json();
};

/**
 * RESTful service interface.
 */
export const api = {
  get: <T,>(url: string) => apiClient<T>(url, { method: 'GET' }),
  post: <T,>(url: string, data: any) => apiClient<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T,>(url: string, data: any) => apiClient<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T,>(url: string, data: any) => apiClient<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T,>(url: string) => apiClient<T>(url, { method: 'DELETE' }),
};

export default api;
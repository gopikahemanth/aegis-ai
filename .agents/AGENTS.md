# Project-Scoped Agent Guidelines

## API Client Response Pattern
When generating a client-side HTTP utility or api service helper (e.g., `src/services/apiClient.ts`), you MUST define the methods to return response payloads wrapped in an Axios-like object containing a `.data` property, like this:

```typescript
export interface ApiResponse<T> {
  data: T;
}

export const apiClient = {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    // ...
  },
  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    // ...
  },
  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    // ...
  },
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // ...
  }
};
```

All other generated API service modules MUST consume the response object under `res.data` (e.g., `const res = await apiClient.get<Card[]>(...); return res.data;`). Do NOT return raw payloads directly from request helpers.

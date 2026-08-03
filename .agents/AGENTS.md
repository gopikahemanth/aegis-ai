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

## Zod Validation Error Spelling
When catch blocks check for Zod validation errors, always retrieve the validation issues using `.issues` instead of `.errors`. For example:
```typescript
if (error instanceof z.ZodError) {
  res.status(400).json({ error: error.issues[0].message });
  return;
}
```
Do NOT use `error.errors` as it may throw compilation errors in strict TypeScript environments.

## React Router Route Parameters
When using `useParams()` from `react-router-dom` in React components, remember that route parameters are typed as `string | undefined`. Before passing a parameter (such as `deckId` or `cardId`) to a service function that expects a strict `string`, you MUST narrow it or assert it as defined (e.g., using `!`). For example:
```typescript
const { deckId } = useParams<{ deckId: string }>();
// ...
if (!deckId) return;
const data = await fetchDeckById(deckId!); // Assert defined so types match
```

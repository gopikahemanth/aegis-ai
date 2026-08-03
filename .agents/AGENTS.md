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

## Form Component and Parent Callback Type Safety
When developing React form modals or form components that handle optional properties (for example, an optional `description?: string` or `category?: string` field), you MUST ensure that the optional property is defined with the same optional signature in both the form component props and the parent page's handler function signature.
For example, if the page handler expects:
```typescript
const handleSave = async (data: { title: string; category: string; description?: string }) => { ... }
```
Then the form component MUST define its submit handler to match:
```typescript
interface FormProps {
  onSubmit: (data: { title: string; category: string; description?: string }) => Promise<void>;
}
```
Do NOT make the parameter required (e.g. `description: string`) in the form component or the parent page handler if the schema allows it to be optional or undefined.

## Express Route Parameters and Query Types
When extracting parameter variables from `req.params` or query parameters from `req.query` in Express controller methods, always assert their type using `as string` (or narrow them) before assigning or passing them to Prisma model queries.
For example, instead of:
```typescript
const { deckId } = req.params;
const deck = await prisma.deck.findUnique({ where: { id: deckId } });
```
You MUST write:
```typescript
const deckId = req.params.deckId as string;
const deck = await prisma.deck.findUnique({ where: { id: deckId } });
```
This avoids type-safety compilation errors (such as `Type 'string | string[]' is not assignable to type 'string'`).

## Lucide React Icons Imports
Always ensure that every Lucide icon referenced inside any generated UI component (e.g. `BookOpen`, `ArrowRight`, `Trash2`, etc.) is explicitly declared in the imports statement at the top of the file from `'lucide-react'`.

## Prisma Client Singleton Pattern
Always instantiate the Prisma client ONCE in a shared database utility file (such as `server/config/database.ts` or `src/server/db.ts`) and export it as a singleton.
For example:
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```
All Express controllers and service modules MUST import `prisma` from this shared utility module (e.g. `import { prisma } from '../config/database';`) instead of creating `const prisma = new PrismaClient()` in multiple files.

## Recharts Tooltip and Pie Label Type Safety
When building Recharts analytics components (`<Tooltip />`, `<Pie />`, `<BarChart />`, `<LineChart />`):
1. For `<Tooltip formatter={...} />`, always type the formatter callback parameter flexibly (e.g. `(value: any) => ...` or `(value: any) => [String(value ?? ''), 'Label']`). Do NOT type the parameter strictly as `(val: number)` because Recharts `ValueType` can be `undefined`.
2. For custom `<Pie label={...} />` render functions, type the render props parameter flexibly as `(props: any) => ...` or destructure `{ name, percent }: any` to avoid `PieLabelRenderProps` custom property compilation errors.

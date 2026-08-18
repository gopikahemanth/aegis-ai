# Aegis V2.1 Deep Codebase Diagnostic — 08: Database & Migration Analysis

**Audit Date:** August 18, 2026  
**Scope:** Prisma ORM, PostgreSQL vs SQLite handling, P1000 connection error recovery, and schema overwrites.

---

## 1. Database Architecture & Provisioning

Aegis configures fullstack database layers using Prisma ORM:
- **Datasource:** Defaults to `postgresql` in `.env` (`DATABASE_URL="postgresql://postgres:postgres@localhost:5432/<dbname>?schema=public"`).
- **Client Generation:** `npx prisma@6 generate` produces `@prisma/client`.

---

## 2. P1000 Connection Error Handling

During live generation, no local PostgreSQL server was running on port 5432, resulting in Prisma error P1000:
```
Error: P1000: Authentication failed against database server, the provided database credentials for `postgres` are not valid.
```

### 2.1 Graceful Degradation in Aegis V2.1
Instead of crashing the generation pipeline, `ProjectStartupAgent` and `Orchestrator` implemented an intelligent fallback:
```
[Startup] ⚠️ DATABASE_CONNECTION_REQUIRED: Could not connect to postgresql server
[Startup] Skipping live migration. Prisma Client has been generated.
[DATABASE] ⚠️ BLOCKED — PostgreSQL connection unavailable (environment issue, NOT a code error).
  DATABASE_STATUS: BLOCKED
  CODE_STATUS: PASS
```
- **Validation:** Static validation (`prisma validate` and client compilation) succeeded.
- **Client Artifacts:** `@prisma/client` types and query methods were generated successfully into `node_modules/.pnpm/@prisma+client...`.

---

## 3. The Canonical Schema Overwrite Bug

The most critical database vulnerability identified during this audit is the canonical schema overwrite in `orchestrator.ts` line 1337:

```ts
// packages/ai-core/src/agent/orchestrator.ts: Line 1337
const schemaValidation = CanonicalDataModelContract.validateSchema(schemaContent);
if (!schemaValidation.valid) {
  console.log(`[PRISMA] ⚠️ Schema missing canonical models: ${schemaValidation.missingModels.join(", ")}. Replacing with canonical schema.`);
  writeFileSync(prismaSchema, CanonicalDataModelContract.getPrismaSchema(), "utf8");
}
```

Because `validateSchema()` was invoked without passing the project prompt or architecture contract, it defaulted to requiring `Item` and `Activity` models. When the Task Manager's `Task` and `BoardColumn` models were evaluated, they failed validation, and the entire domain schema was overwritten with generic placeholders.

**Remediation Required:**
Pass the original request and contract:
```ts
const schemaValidation = CanonicalDataModelContract.validateSchema(schemaContent, request, this.resolvedContract);
```
And only overwrite if the schema is completely empty or syntactically invalid.

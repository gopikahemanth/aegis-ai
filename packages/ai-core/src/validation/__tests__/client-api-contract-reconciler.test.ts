import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ClientApiContractReconciler } from "../client-api-contract-reconciler.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_client_api_reconciler");

describe("ClientApiContractReconciler — Full-Stack API Contract Verification", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(TEST_DIR, "server", "validators"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "services"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "components"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  // 1. Correct matching endpoints
  it("passes when frontend API calls match backend endpoints, methods, and parameters", () => {
    // Server entry mounting router
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import serviceRouter from './routes/service';
const app = express();
app.use('/api/services', serviceRouter);
export default app;`
    );

    // Route declaring GET / and GET /:id
    writeFileSync(
      join(TEST_DIR, "server", "routes", "service.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json([]));
router.get('/:id', (req, res) => res.json({ id: req.params.id }));
export default router;`
    );

    // Frontend service calling matching endpoints
    writeFileSync(
      join(TEST_DIR, "src", "services", "api.ts"),
      `import axios from 'axios';
const api = axios.create();
export const fetchServices = () => api.get('/api/services');
export const fetchServiceById = (id: string) => api.get(\`/api/services/\${id}\`);`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(2);
    expect(report.diagnostics).toHaveLength(0);
  });

  // 2. Wrong HTTP methods
  it("detects HTTP method mismatches (e.g. frontend sends GET, backend expects POST)", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import orderRouter from './routes/order';
const app = express();
app.use('/api/orders', orderRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "order.ts"),
      `import { Router } from 'express';
const router = Router();
router.post('/', (req, res) => res.status(201).json({ success: true }));
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "components", "OrderCheckout.tsx"),
      `import axios from 'axios';
export const submitOrder = async (orderData: any) => {
  return axios.get('/api/orders'); // BUG: GET instead of POST
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(false);
    const methodDiag = report.diagnostics.find(d => d.type === "HTTP_METHOD_MISMATCH");
    expect(methodDiag).toBeDefined();
    expect(methodDiag?.expectedMethod).toBe("POST");
    expect(methodDiag?.actualMethod).toBe("GET");
  });

  // 3. Incorrect endpoint paths
  it("detects incorrect endpoint paths (e.g. singular /api/service instead of /api/services)", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import serviceRouter from './routes/service';
const app = express();
app.use('/api/services', serviceRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "service.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json([]));
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "components", "ServiceList.tsx"),
      `export const loadServices = () => fetch('/api/service'); // BUG: missing plural s`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(false);
    const pathDiag = report.diagnostics.find(d => d.type === "ENDPOINT_PATH_MISMATCH");
    expect(pathDiag).toBeDefined();
    expect(pathDiag?.expectedPath).toBe("/api/services");
    expect(pathDiag?.actualPath).toBe("/api/service");
  });

  // 4. Path parameter mismatches
  it("detects path parameter mismatches (e.g. :serviceId instead of :id)", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import serviceRouter from './routes/service';
const app = express();
app.use('/api/services', serviceRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "service.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/:id', (req, res) => res.json({ id: req.params.id }));
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "services", "api.ts"),
      `import axios from 'axios';
export const getService = (serviceId: string) => axios.get(\`/api/services/\${serviceId}\`);`
    );

    // Both normalize to a path param, and path matches
    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(1);
  });

  // 5. Query parameter mismatches
  it("detects query parameter alias mismatches (e.g. frontend sends cat, backend requires category)", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import catalogRouter from './routes/catalog';
const app = express();
app.use('/api/catalog', catalogRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "catalog.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: 'category is required' });
  res.json([]);
});
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "components", "CatalogFilter.tsx"),
      `import axios from 'axios';
const api = axios.create();
export const filterCatalog = (cat: string) => {
  return api.get('/api/catalog', { params: { cat } }); // BUG: 'cat' instead of 'category'
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(false);
    const qpDiag = report.diagnostics.find(d => d.type === "QUERY_PARAMETER_MISMATCH");
    expect(qpDiag).toBeDefined();
    expect(qpDiag?.paramName).toBe("cat");
    expect(qpDiag?.expectedParams).toContain("category");
  });

  // 6. Request body mismatches
  it("detects request body field mismatches against declared validator schema", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import serviceRouter from './routes/service';
const app = express();
app.use('/api/services', serviceRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "validators", "serviceSchema.ts"),
      `import { z } from 'zod';
export const serviceSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
});`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "service.ts"),
      `import { Router } from 'express';
import { serviceSchema } from '../validators/serviceSchema';
const router = Router();
router.post('/', validateRequest(serviceSchema), (req, res) => {
  const { name, price, description } = req.body;
  res.status(201).json({ id: '1', name });
});
export default router;`
    );

    // Frontend sends payload missing 'price' and with 'title' instead of 'name'
    writeFileSync(
      join(TEST_DIR, "src", "components", "CreateServiceModal.tsx"),
      `export const createService = async () => {
  return fetch('/api/services', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Consultation', // BUG: 'title' instead of 'name'
      description: 'Consultation session'
    })
  });
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(false);
    const bodyDiag = report.diagnostics.find(d => d.type === "REQUEST_BODY_MISMATCH");
    expect(bodyDiag).toBeDefined();
    expect(bodyDiag?.expectedParams).toContain("name");
  });

  // 7. Authentication requirements
  it("detects protected endpoints called without Authorization headers or auth client", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import adminRouter from './routes/admin';
const app = express();
app.use('/api/admin', adminRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "admin.ts"),
      `import { Router } from 'express';
const router = Router();
const requireAdmin = (req: any, res: any, next: any) => next();
router.delete('/users/:id', requireAdmin, (req, res) => res.status(204).end());
router.post('/settings', requireAdmin, (req, res) => res.json({ ok: true }));
export default router;`
    );

    // Unauthenticated fetch call without Authorization, and authenticated cookie call
    writeFileSync(
      join(TEST_DIR, "src", "pages", "AdminDashboard.tsx"),
      `export const deleteUser = (id: string) => {
  return fetch(\`/api/admin/users/\${id}\`, {
    method: 'DELETE'
  }); // BUG: missing Authorization header
};

export const updateSettings = () => {
  return fetch('/api/admin/settings', {
    method: 'POST',
    credentials: 'include' // Cookie-based authentication
  });
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(false);
    const authDiags = report.diagnostics.filter(d => d.type === "AUTHENTICATION_MISMATCH");
    expect(authDiags).toHaveLength(1);
    expect(authDiags[0]?.expectedPath).toBe("/api/admin/users/:id");
  });

  // 8. Axios wrappers & shared instances
  it("supports shared Axios instances with auth interceptor configured", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import profileRouter from './routes/profile';
const app = express();
app.use('/api/profile', profileRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "profile.ts"),
      `import { Router } from 'express';
const router = Router();
const requireAuth = (req: any, res: any, next: any) => next();
router.get('/', requireAuth, (req, res) => res.json({ name: 'User' }));
export default router;`
    );

    // Shared apiClient with built-in auth
    writeFileSync(
      join(TEST_DIR, "src", "services", "api.ts"),
      `import axios from 'axios';
export const apiClient = axios.create();
export const getProfile = () => apiClient.get('/api/profile');`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(1);
  });

  // 9. Fetch wrappers with query string parsing
  it("extracts query parameters directly from fetch template literal URLs", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import scheduleRouter from './routes/schedule';
const app = express();
app.use('/api/availability', scheduleRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "schedule.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => {
  const { date, serviceId } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required' });
  res.json({ slots: ['09:00', '10:00'] });
});
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "components", "BookingCalendar.tsx"),
      `export const getSlots = async (selectedDate: string, serviceId: string) => {
  return fetch(\`/api/availability?date=\${selectedDate}&serviceId=\${serviceId}\`);
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(1);
    expect(report.diagnostics).toHaveLength(0);
  });

  // 10. URLSearchParams usage
  it("recognizes query parameters passed via URLSearchParams or axios params", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import metricsRouter from './routes/metrics';
const app = express();
app.use('/api/metrics', metricsRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "metrics.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/timeseries', (req, res) => {
  const { interval, metric } = req.query;
  if (!interval) return res.status(400).json({ error: 'interval required' });
  res.json([]);
});
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "services", "metricsApi.ts"),
      `import axios from 'axios';
const client = axios.create();
export const fetchTimeSeries = (interval: string, metric: string) => {
  return client.get('/api/metrics/timeseries', {
    params: { interval, metric }
  });
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(1);
  });

  // 11. Express router prefixes
  it("resolves nested and mounted Express router prefixes correctly", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import v1Router from './routes/v1';
const app = express();
app.use('/api/v1/telemetry', v1Router);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "v1.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.get('/alerts/:id', (req, res) => res.json({ id: req.params.id }));
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "services", "telemetry.ts"),
      `import axios from 'axios';
export const getHealth = () => axios.get('/api/v1/telemetry/health');
export const getAlert = (id: string) => axios.get(\`/api/v1/telemetry/alerts/\${id}\`);`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(2);
  });

  // 12. Dynamic template literals
  it("reconciles dynamic template literals with complex expressions into canonical path segments", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import postRouter from './routes/post';
const app = express();
app.use('/api/posts', postRouter);`
    );

    writeFileSync(
      join(TEST_DIR, "server", "routes", "post.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/:postId/comments/:commentId', (req, res) => res.json({}));
export default router;`
    );

    writeFileSync(
      join(TEST_DIR, "src", "components", "PostView.tsx"),
      `export const loadComment = (post: { id: string }, commentId: string) => {
  return fetch(\`/api/posts/\${post.id}/comments/\${commentId}\`);
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(1);
  });

  // 13. Unresolved expressions & external endpoints
  it("reports opaque runtime URL variables as UNRESOLVED rather than false positive errors", () => {
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
const app = express();
app.get('/api/ping', (req, res) => res.send('pong'));`
    );

    writeFileSync(
      join(TEST_DIR, "src", "services", "generic.ts"),
      `import axios from 'axios';
export const requestFromConfig = (configEndpoint: string) => {
  return axios.get(configEndpoint); // Dynamic variable URL -> UNRESOLVED
};

export const callExternalStripe = () => {
  return fetch('https://api.stripe.com/v1/charges'); // External 3rd party API URL -> safely ignored
};`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true); // Does not block since severity is UNRESOLVED
    const unresolvedDiag = report.diagnostics.find(d => d.type === "UNRESOLVED_EXPRESSION");
    expect(unresolvedDiag).toBeDefined();
    expect(unresolvedDiag?.severity).toBe("UNRESOLVED");
    expect(report.diagnostics.filter(d => d.type === "UNKNOWN_ENDPOINT")).toHaveLength(0);
  });

  // 14. Complex multi-route full-stack application verification
  it("verifies a multi-route full-stack application with auth, query params, mutations, and CRUD cleanly", () => {
    // Express entry
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from 'express';
import authRouter from './routes/auth';
import productRouter from './routes/product';
import cartRouter from './routes/cart';

const app = express();
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
export default app;`
    );

    // Auth routes
    writeFileSync(
      join(TEST_DIR, "server", "routes", "auth.ts"),
      `import { Router } from 'express';
const router = Router();
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ token: 'jwt_123' });
});
router.post('/register', (req, res) => res.status(201).json({ id: '1' }));
export default router;`
    );

    // Product routes
    writeFileSync(
      join(TEST_DIR, "server", "routes", "product.ts"),
      `import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => {
  const { category, search } = req.query;
  res.json([]);
});
router.get('/:id', (req, res) => res.json({ id: req.params.id }));
export default router;`
    );

    // Cart routes (protected)
    writeFileSync(
      join(TEST_DIR, "server", "routes", "cart.ts"),
      `import { Router } from 'express';
const router = Router();
const requireAuth = (req: any, res: any, next: any) => next();
router.get('/', requireAuth, (req, res) => res.json([]));
router.post('/items', requireAuth, (req, res) => {
  const { productId, quantity } = req.body;
  res.status(201).json({ success: true });
});
router.delete('/items/:id', requireAuth, (req, res) => res.status(204).end());
export default router;`
    );

    // Frontend API services
    writeFileSync(
      join(TEST_DIR, "src", "services", "api.ts"),
      `import axios from 'axios';
export const apiClient = axios.create();

// Auth
export const login = (credentials: { email: string; password: string }) =>
  fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });

// Products
export const getProducts = (category?: string, search?: string) =>
  apiClient.get('/api/products', { params: { category, search } });

export const getProductById = (id: string) =>
  apiClient.get(\`/api/products/\${id}\`);

// Cart (uses apiClient which has auth)
export const getCart = () =>
  apiClient.get('/api/cart');

export const addToCart = (productId: string, quantity: number) =>
  apiClient.post('/api/cart/items', { productId, quantity });

export const removeFromCart = (itemId: string) =>
  apiClient.delete(\`/api/cart/items/\${itemId}\`);`
    );

    const report = ClientApiContractReconciler.reconcileProject(TEST_DIR);
    expect(report.passed).toBe(true);
    expect(report.matchedCalls).toBe(6);
    expect(report.endpointsFound).toBe(7);
    expect(report.diagnostics).toHaveLength(0);
  });
});


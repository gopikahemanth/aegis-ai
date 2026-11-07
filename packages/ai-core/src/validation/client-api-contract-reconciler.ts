import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import ts from "typescript";

export type ApiMismatchType =
  | "HTTP_METHOD_MISMATCH"
  | "ENDPOINT_PATH_MISMATCH"
  | "PATH_PARAMETER_MISMATCH"
  | "QUERY_PARAMETER_MISMATCH"
  | "REQUEST_BODY_MISMATCH"
  | "AUTHENTICATION_MISMATCH"
  | "UNKNOWN_ENDPOINT"
  | "UNRESOLVED_EXPRESSION";

export interface ApiMismatchDiagnostic {
  type: ApiMismatchType;
  severity: "ERROR" | "WARNING" | "UNRESOLVED";
  frontendFile: string;
  backendFile?: string;
  line?: number;
  column?: number;
  expectedMethod?: string;
  actualMethod?: string;
  expectedPath?: string;
  actualPath?: string;
  paramName?: string;
  expectedParams?: string[];
  actualParams?: string[];
  message: string;
  suggestedFix?: string;
}

export interface BackendEndpointContract {
  sourceFile: string;
  method: string;
  fullPath: string;
  pathParams: string[];
  queryParams: { name: string; required: boolean }[];
  bodyFields: { name: string; required: boolean }[];
  requiresAuth: boolean;
  line?: number;
  column?: number;
}

export interface FrontendApiCall {
  sourceFile: string;
  method: string;
  rawUrl: string;
  normalizedPath: string;
  pathParams: string[];
  queryParams: string[];
  bodyFields: string[];
  hasAuth: boolean;
  isDynamic: boolean;
  isUnresolved: boolean;
  isExternal?: boolean;
  line: number;
  column: number;
}

export interface ClientApiReconciliationReport {
  passed: boolean;
  totalCalls: number;
  matchedCalls: number;
  diagnostics: ApiMismatchDiagnostic[];
  endpointsFound: number;
}

export class ClientApiContractReconciler {
  /**
   * Reconciles all frontend API calls in a project against declared backend Express endpoints.
   */
  public static reconcileProject(projectRoot: string): ClientApiReconciliationReport {
    const backendEndpoints = this.discoverBackendEndpoints(projectRoot);
    const frontendCalls = this.discoverFrontendApiCalls(projectRoot);

    return this.reconcile(frontendCalls, backendEndpoints);
  }

  /**
   * Core pure reconciliation logic between discovered calls and endpoints.
   */
  public static reconcile(
    frontendCalls: FrontendApiCall[],
    backendEndpoints: BackendEndpointContract[]
  ): ClientApiReconciliationReport {
    const diagnostics: ApiMismatchDiagnostic[] = [];
    let matchedCalls = 0;

    for (const call of frontendCalls) {
      if (call.isUnresolved) {
        diagnostics.push({
          type: "UNRESOLVED_EXPRESSION",
          severity: "UNRESOLVED",
          frontendFile: call.sourceFile,
          line: call.line,
          column: call.column,
          actualMethod: call.method,
          actualPath: call.rawUrl,
          message: `Dynamic API endpoint expression "${call.rawUrl}" cannot be statically verified. Requires runtime verification.`,
        });
        continue;
      }

      // 1. Try finding exact path match (canonicalizing path parameters)
      const matchingPathEndpoints = backendEndpoints.filter(ep =>
        this.pathsMatch(ep.fullPath, call.normalizedPath)
      );

      if (matchingPathEndpoints.length === 0) {
        // Path did not match any backend route. Check if endpoint exists with similar path or parameter naming
        const candidateEndpoint = this.findFuzzyOrParamMismatchEndpoint(call.normalizedPath, backendEndpoints);

        if (candidateEndpoint) {
          const pathParamMismatch = this.detectPathParamMismatch(candidateEndpoint.fullPath, call.normalizedPath);
          if (pathParamMismatch) {
            diagnostics.push({
              type: "PATH_PARAMETER_MISMATCH",
              severity: "ERROR",
              frontendFile: call.sourceFile,
              backendFile: candidateEndpoint.sourceFile,
              line: call.line,
              column: call.column,
              expectedPath: candidateEndpoint.fullPath,
              actualPath: call.rawUrl,
              paramName: pathParamMismatch.actualParam,
              expectedParams: [pathParamMismatch.expectedParam],
              actualParams: [pathParamMismatch.actualParam],
              message: `Path parameter mismatch on "${call.rawUrl}". Expected ":${pathParamMismatch.expectedParam}" from route definition in ${candidateEndpoint.sourceFile}, but frontend uses ":${pathParamMismatch.actualParam}".`,
              suggestedFix: `Update path parameter name to match ":${pathParamMismatch.expectedParam}".`,
            });
            continue;
          }

          diagnostics.push({
            type: "ENDPOINT_PATH_MISMATCH",
            severity: "ERROR",
            frontendFile: call.sourceFile,
            backendFile: candidateEndpoint.sourceFile,
            line: call.line,
            column: call.column,
            expectedPath: candidateEndpoint.fullPath,
            actualPath: call.rawUrl,
            message: `Frontend calls "${call.rawUrl}", but backend route is declared as "${candidateEndpoint.fullPath}" in ${candidateEndpoint.sourceFile}.`,
            suggestedFix: `Update request URL to "${candidateEndpoint.fullPath}".`,
          });
          continue;
        }

        // Unknown endpoint
        diagnostics.push({
          type: "UNKNOWN_ENDPOINT",
          severity: "ERROR",
          frontendFile: call.sourceFile,
          line: call.line,
          column: call.column,
          actualMethod: call.method,
          actualPath: call.rawUrl,
          message: `Frontend calls unknown API endpoint "${call.method} ${call.rawUrl}". No matching Express route was found on the backend.`,
          suggestedFix: `Verify router mounting and route path in server/routes.`,
        });
        continue;
      }

      // 2. Path exists. Check HTTP method match
      const exactEndpoint = matchingPathEndpoints.find(
        ep => ep.method.toUpperCase() === call.method.toUpperCase()
      );

      if (!exactEndpoint) {
        const availableMethods = matchingPathEndpoints.map(ep => ep.method.toUpperCase());
        diagnostics.push({
          type: "HTTP_METHOD_MISMATCH",
          severity: "ERROR",
          frontendFile: call.sourceFile,
          backendFile: matchingPathEndpoints[0].sourceFile,
          line: call.line,
          column: call.column,
          expectedMethod: availableMethods.join(" | "),
          actualMethod: call.method.toUpperCase(),
          expectedPath: matchingPathEndpoints[0].fullPath,
          actualPath: call.rawUrl,
          message: `HTTP method mismatch: frontend calls "${call.method.toUpperCase()} ${call.rawUrl}", but backend endpoint in ${matchingPathEndpoints[0].sourceFile} only accepts [${availableMethods.join(", ")}].`,
          suggestedFix: `Change HTTP method from ${call.method.toUpperCase()} to ${availableMethods[0]}.`,
        });
        continue;
      }

      // 3. Method and Path match! Now verify parameters & contracts
      let callHasErrors = false;

      // 3a. Query Parameters verification
      if (exactEndpoint.queryParams.length > 0 || call.queryParams.length > 0) {
        const queryDiagnostics = this.verifyQueryParams(call, exactEndpoint);
        if (queryDiagnostics.length > 0) {
          diagnostics.push(...queryDiagnostics);
          callHasErrors = true;
        }
      }

      // 3b. Request Body verification (for POST, PUT, PATCH)
      if (["POST", "PUT", "PATCH"].includes(exactEndpoint.method.toUpperCase())) {
        const bodyDiagnostics = this.verifyRequestBody(call, exactEndpoint);
        if (bodyDiagnostics.length > 0) {
          diagnostics.push(...bodyDiagnostics);
          callHasErrors = true;
        }
      }

      // 3c. Authentication verification
      if (exactEndpoint.requiresAuth && !call.hasAuth) {
        diagnostics.push({
          type: "AUTHENTICATION_MISMATCH",
          severity: "ERROR",
          frontendFile: call.sourceFile,
          backendFile: exactEndpoint.sourceFile,
          line: call.line,
          column: call.column,
          expectedPath: exactEndpoint.fullPath,
          actualPath: call.rawUrl,
          message: `Protected endpoint "${exactEndpoint.method} ${exactEndpoint.fullPath}" requires authentication (middleware in ${exactEndpoint.sourceFile}), but frontend call in ${call.sourceFile} does not provide Authorization header or use authenticated API client.`,
          suggestedFix: `Attach Bearer token header or use authenticated apiClient with getToken().`,
        });
        callHasErrors = true;
      }

      if (!callHasErrors) {
        matchedCalls++;
      }
    }

    const hasErrors = diagnostics.some(d => d.severity === "ERROR");
    return {
      passed: !hasErrors,
      totalCalls: frontendCalls.length,
      matchedCalls,
      diagnostics,
      endpointsFound: backendEndpoints.length,
    };
  }

  // ── Backend Route Discovery ───────────────────────────────────────────────

  public static discoverBackendEndpoints(projectRoot: string): BackendEndpointContract[] {
    const endpoints: BackendEndpointContract[] = [];
    const serverDir = join(projectRoot, "server");
    if (!existsSync(serverDir)) return endpoints;

    const mountPrefixes = new Map<string, string>();
    const entryFiles = ["index.ts", "app.ts", "server.ts", "index.js", "app.js"]
      .map(f => join(serverDir, f))
      .filter(existsSync);

    // 1. Scan entry files for router mounts: app.use('/api/services', serviceRouter)
    for (const entryPath of entryFiles) {
      try {
        const content = readFileSync(entryPath, "utf8");
        const sf = ts.createSourceFile(entryPath, content, ts.ScriptTarget.Latest, true);

        // Find router imports: import serviceRouter from './routes/service'
        const importMap = new Map<string, string>();
        for (const stmt of sf.statements) {
          if (ts.isImportDeclaration(stmt) && stmt.importClause) {
            const moduleSpec = (stmt.moduleSpecifier as ts.StringLiteral).text;
            const routeName = moduleSpec.replace(/^.*[\\\/]/, "").replace(/\.[^/.]+$/, "");

            if (stmt.importClause.name) {
              importMap.set(stmt.importClause.name.text, routeName);
            }
            if (stmt.importClause.namedBindings && ts.isNamedImports(stmt.importClause.namedBindings)) {
              for (const elem of stmt.importClause.namedBindings.elements) {
                importMap.set(elem.name.text, routeName);
              }
            }
          }
        }

        // Walk AST for app.use(prefix, router)
        const walk = (node: ts.Node) => {
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const fnName = node.expression.name.text;
            if (fnName === "use" && node.arguments.length >= 2) {
              const firstArg = node.arguments[0];
              const secondArg = node.arguments[1];

              let prefix = "";
              if (ts.isStringLiteral(firstArg)) {
                prefix = firstArg.text;
              } else if (ts.isNoSubstitutionTemplateLiteral(firstArg)) {
                prefix = firstArg.text;
              } else if (ts.isTemplateExpression(firstArg)) {
                prefix = firstArg.head.text;
              }

              if (prefix) {
                prefix = prefix.replace(/\/$/, "");
                if (!prefix.startsWith("/")) prefix = `/${prefix}`;

                let routerVar = "";
                if (ts.isIdentifier(secondArg)) {
                  routerVar = secondArg.text;
                } else if (ts.isCallExpression(secondArg) && ts.isIdentifier(secondArg.expression)) {
                  routerVar = secondArg.expression.text;
                }

                if (routerVar) {
                  mountPrefixes.set(routerVar, prefix);
                  const mappedModule = importMap.get(routerVar);
                  if (mappedModule) {
                    mountPrefixes.set(mappedModule, prefix);
                    mountPrefixes.set(mappedModule.toLowerCase(), prefix);
                  }
                }
              }
            }
          }
          ts.forEachChild(node, walk);
        };
        walk(sf);
      } catch {}
    }

    // 2. Scan route files under server/routes
    const routesDir = join(serverDir, "routes");
    const routeFiles: string[] = [];
    if (existsSync(routesDir)) {
      for (const f of readdirSync(routesDir)) {
        if ((f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts")) {
          routeFiles.push(join(routesDir, f));
        }
      }
    }

    // Also include any direct routes in server entry files
    routeFiles.push(...entryFiles);

    for (const rf of routeFiles) {
      try {
        const content = readFileSync(rf, "utf8");
        const relPath = relative(projectRoot, rf).replace(/\\/g, "/");
        const baseName = rf.replace(/^.*[\\\/]/, "").replace(/\.[^/.]+$/, "");
        const cleanName = baseName.replace(/\.routes?$/i, "").replace(/[-_.]?routes?$/i, "");

        let defaultPrefix = mountPrefixes.get(baseName) ||
                             mountPrefixes.get(cleanName) ||
                             mountPrefixes.get(`${cleanName}Router`) ||
                             mountPrefixes.get(`${baseName}Router`) ||
                             mountPrefixes.get(`${cleanName}Routes`) ||
                             mountPrefixes.get(`${baseName}Routes`) ||
                             mountPrefixes.get(baseName.toLowerCase()) ||
                             mountPrefixes.get(cleanName.toLowerCase());

        if (!defaultPrefix) {
          defaultPrefix = rf.includes("/routes/") ? `/api/${cleanName.toLowerCase()}` : "";
        }

        const sf = ts.createSourceFile(rf, content, ts.ScriptTarget.Latest, true);
        const fileEndpoints = this.extractEndpointsFromSourceFile(sf, relPath, defaultPrefix);
        endpoints.push(...fileEndpoints);
      } catch {}
    }

    return endpoints;
  }

  private static extractEndpointsFromSourceFile(
    sf: ts.SourceFile,
    sourceFile: string,
    prefix: string
  ): BackendEndpointContract[] {
    const endpoints: BackendEndpointContract[] = [];

    const walk = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text.toLowerCase();
        if (["get", "post", "put", "patch", "delete"].includes(method) && node.arguments.length >= 2) {
          const pathArg = node.arguments[0];
          let subPath = "";

          if (ts.isStringLiteral(pathArg) || ts.isNoSubstitutionTemplateLiteral(pathArg)) {
            subPath = pathArg.text;
          }

          if (subPath !== undefined) {
            if (!subPath.startsWith("/")) subPath = `/${subPath}`;
            let fullPath = prefix ? (subPath === "/" ? prefix : `${prefix}${subPath}`) : subPath;
            if (!fullPath.startsWith("/")) fullPath = `/${fullPath}`;
            if (!fullPath.startsWith("/api") && !fullPath.startsWith("/auth") && !fullPath.startsWith("/health")) {
              fullPath = `/api${fullPath}`;
            }

            // Extract path params from fullPath (e.g. /:id -> ['id'])
            const pathParams = (fullPath.match(/:[a-zA-Z0-9_$]+/g) || []).map(p => p.slice(1));

            // Inspect middleware & handler for auth, query, and body
            let requiresAuth = false;
            const queryParams: { name: string; required: boolean }[] = [];
            const bodyFields: { name: string; required: boolean }[] = [];

            // Middlewares are args between pathArg and the last handler
            for (let i = 1; i < node.arguments.length; i++) {
              const arg = node.arguments[i];
              const argText = arg.getText(sf);

              if (
                /requireAdmin|requireAuth|authenticate|authenticateToken|verifyToken|authMiddleware|requireUser|protect/i.test(
                  argText
                )
              ) {
                requiresAuth = true;
              }

              // Extract Zod validator schema: validateRequest(serviceSchema)
              if (ts.isCallExpression(arg) && argText.includes("validate")) {
                const schemaArg = arg.arguments[0];
                if (schemaArg) {
                  const schemaFields = this.findSchemaFieldsInSourceFile(sf, schemaArg.getText(sf));
                  bodyFields.push(...schemaFields);
                }
              }

              // Inspect handler function body
              if (ts.isFunctionExpression(arg) || ts.isArrowFunction(arg)) {
                this.inspectRouteHandler(arg, queryParams, bodyFields);
              }
            }

            const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));

            endpoints.push({
              sourceFile,
              method: method.toUpperCase(),
              fullPath,
              pathParams,
              queryParams,
              bodyFields,
              requiresAuth,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }
      ts.forEachChild(node, walk);
    };

    walk(sf);
    return endpoints;
  }

  private static inspectRouteHandler(
    handler: ts.FunctionExpression | ts.ArrowFunction,
    queryParams: { name: string; required: boolean }[],
    bodyFields: { name: string; required: boolean }[]
  ): void {
    const walk = (node: ts.Node) => {
      // 1. Destructuring: const { category, date } = req.query; const { name, price } = req.body;
      if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer) {
        const initText = node.initializer.getText();
        if (initText.endsWith("query") || initText.includes(".query")) {
          for (const elem of node.name.elements) {
            if (ts.isIdentifier(elem.name)) {
              const paramName = elem.propertyName ? elem.propertyName.getText() : elem.name.text;
              if (!queryParams.some(q => q.name === paramName)) {
                queryParams.push({ name: paramName, required: false });
              }
            }
          }
        } else if (initText.endsWith("body") || initText.includes(".body")) {
          for (const elem of node.name.elements) {
            if (ts.isIdentifier(elem.name)) {
              const fieldName = elem.propertyName ? elem.propertyName.getText() : elem.name.text;
              if (!bodyFields.some(b => b.name === fieldName)) {
                bodyFields.push({ name: fieldName, required: !elem.initializer });
              }
            }
          }
        }
      }

      // 2. Direct property access: req.query.category or req.body.price
      if (ts.isPropertyAccessExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          if (expr.name.text === "query") {
            const paramName = node.name.text;
            if (!queryParams.some(q => q.name === paramName)) {
              queryParams.push({ name: paramName, required: false });
            }
          } else if (expr.name.text === "body") {
            const fieldName = node.name.text;
            if (!bodyFields.some(b => b.name === fieldName)) {
              bodyFields.push({ name: fieldName, required: false });
            }
          }
        }
      }

      // 3. Detect validation checks: if (!date) return res.status(400)...
      if (ts.isIfStatement(node)) {
        const condText = node.expression.getText();
        const paramMatch = condText.match(/!([a-zA-Z0-9_$]+)/);
        if (paramMatch) {
          const checkedParam = paramMatch[1];
          const qp = queryParams.find(q => q.name === checkedParam);
          if (qp) qp.required = true;
          const bp = bodyFields.find(b => b.name === checkedParam);
          if (bp) bp.required = true;
        }
      }

      ts.forEachChild(node, walk);
    };

    if (handler.body) walk(handler.body);
  }

  private static findSchemaFieldsInSourceFile(
    sf: ts.SourceFile,
    schemaName: string
  ): { name: string; required: boolean }[] {
    const fields: { name: string; required: boolean }[] = [];
    const walk = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === schemaName) {
        if (node.initializer && ts.isCallExpression(node.initializer)) {
          const arg = node.initializer.arguments[0];
          if (arg && ts.isObjectLiteralExpression(arg)) {
            for (const prop of arg.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                const propText = prop.initializer.getText(sf);
                const isOptional = propText.includes(".optional()");
                fields.push({
                  name: prop.name.text,
                  required: !isOptional,
                });
              }
            }
          }
        }
      }
      ts.forEachChild(node, walk);
    };
    walk(sf);
    return fields;
  }

  // ── Frontend Client Call Discovery ────────────────────────────────────────

  public static discoverFrontendApiCalls(projectRoot: string): FrontendApiCall[] {
    const calls: FrontendApiCall[] = [];
    const srcDir = join(projectRoot, "src");
    if (!existsSync(srcDir)) return calls;

    const sourceFiles: string[] = [];
    const collectFiles = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          collectFiles(full);
        } else if ((entry.endsWith(".ts") || entry.endsWith(".tsx")) && !entry.endsWith(".d.ts")) {
          sourceFiles.push(full);
        }
      }
    };
    collectFiles(srcDir);

    for (const sfPath of sourceFiles) {
      try {
        const content = readFileSync(sfPath, "utf8");
        const relPath = relative(projectRoot, sfPath).replace(/\\/g, "/");
        const sf = ts.createSourceFile(sfPath, content, ts.ScriptTarget.Latest, true);

        const fileCalls = this.extractFrontendCallsFromSourceFile(sf, relPath);
        calls.push(...fileCalls);
      } catch {}
    }

    return calls;
  }

  private static extractFrontendCallsFromSourceFile(
    sf: ts.SourceFile,
    sourceFile: string
  ): FrontendApiCall[] {
    const calls: FrontendApiCall[] = [];

    const walk = (node: ts.Node) => {
      // 1. fetch(url, options)
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "fetch") {
        if (node.arguments.length >= 1) {
          const urlArg = node.arguments[0];
          const optionsArg = node.arguments[1];

          let method = "GET";
          let hasAuth = false;
          const bodyFields: string[] = [];
          const queryParams: string[] = [];

          if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
            for (const prop of optionsArg.properties) {
              if (ts.isPropertyAssignment(prop)) {
                const propName = prop.name.getText(sf);
                if (propName === "method") {
                  method = prop.initializer.getText(sf).replace(/['"]/g, "").toUpperCase();
                } else if (propName === "headers") {
                  const headersText = prop.initializer.getText(sf);
                  if (/Authorization|Bearer|token|Cookie|session/i.test(headersText)) {
                    hasAuth = true;
                  }
                } else if (propName === "credentials") {
                  const credVal = prop.initializer.getText(sf).replace(/['"]/g, "");
                  if (credVal === "include" || credVal === "same-origin") {
                    hasAuth = true;
                  }
                } else if (propName === "body") {
                  this.extractPayloadFields(prop.initializer, bodyFields, sf);
                }
              }
            }
          }

          const parsedUrl = this.parseUrlExpression(urlArg, sf);
          if (parsedUrl.isExternal) {
            // External 3rd party API (e.g. Stripe, OpenAI, Google Maps) - safe from Express route checks
            return;
          }

          if (parsedUrl.isUnresolved || (parsedUrl.path && (parsedUrl.path.startsWith("/api") || parsedUrl.path.startsWith("api/") || parsedUrl.path.startsWith("/auth")))) {
            const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            queryParams.push(...parsedUrl.queryParams);

            calls.push({
              sourceFile,
              method,
              rawUrl: parsedUrl.rawUrl,
              normalizedPath: parsedUrl.path || parsedUrl.rawUrl,
              pathParams: parsedUrl.pathParams,
              queryParams,
              bodyFields,
              hasAuth,
              isDynamic: parsedUrl.isDynamic,
              isUnresolved: parsedUrl.isUnresolved,
              isExternal: false,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }

      // 2. axios/apiClient calls: axios.get(url, config), apiClient.post(url, data, config), api.get(url)
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const callerName = node.expression.expression.getText(sf);
        const methodName = node.expression.name.text.toLowerCase();

        const isClientCall =
          ["axios", "apiClient", "api", "client", "http"].includes(callerName) ||
          callerName.endsWith("Client") ||
          callerName.endsWith("Api");

        if (isClientCall && ["get", "post", "put", "patch", "delete"].includes(methodName) && node.arguments.length >= 1) {
          const urlArg = node.arguments[0];
          const method = methodName.toUpperCase();
          let hasAuth = callerName === "apiClient" || callerName === "api"; // default clients have interceptor
          const bodyFields: string[] = [];
          const queryParams: string[] = [];

          let configArg: ts.Expression | undefined;
          if (["post", "put", "patch"].includes(methodName)) {
            const dataArg = node.arguments[1];
            if (dataArg) {
              this.extractPayloadFields(dataArg, bodyFields, sf);
            }
            configArg = node.arguments[2];
          } else {
            configArg = node.arguments[1];
          }

          if (configArg && ts.isObjectLiteralExpression(configArg)) {
            for (const prop of configArg.properties) {
              if (ts.isPropertyAssignment(prop)) {
                const propName = prop.name.getText(sf);
                if (propName === "headers") {
                  if (/Authorization|Bearer|token|Cookie|session/i.test(prop.initializer.getText(sf))) {
                    hasAuth = true;
                  }
                } else if (propName === "withCredentials") {
                  if (prop.initializer.getText(sf) === "true") {
                    hasAuth = true;
                  }
                } else if (propName === "params") {
                  if (ts.isObjectLiteralExpression(prop.initializer)) {
                    for (const paramProp of prop.initializer.properties) {
                      if (ts.isPropertyAssignment(paramProp)) {
                        queryParams.push(paramProp.name.getText(sf));
                      } else if (ts.isShorthandPropertyAssignment(paramProp)) {
                        queryParams.push(paramProp.name.getText(sf));
                      }
                    }
                  }
                }
              }
            }
          }

          const parsedUrl = this.parseUrlExpression(urlArg, sf);
          if (parsedUrl.isExternal) {
            // External 3rd party API call - safe from Express route checks
            return;
          }

          if (parsedUrl.isUnresolved || (parsedUrl.path && (parsedUrl.path.startsWith("/api") || parsedUrl.path.startsWith("api/") || parsedUrl.path.startsWith("/") || parsedUrl.path.startsWith("/auth")))) {
            let norm = parsedUrl.path || parsedUrl.rawUrl;
            if (!parsedUrl.isUnresolved) {
              if (!norm.startsWith("/")) norm = `/${norm}`;
              if (!norm.startsWith("/api") && !norm.startsWith("/auth") && !norm.startsWith("/health")) {
                norm = `/api${norm}`;
              }
            }

            const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            queryParams.push(...parsedUrl.queryParams);

            calls.push({
              sourceFile,
              method,
              rawUrl: parsedUrl.rawUrl,
              normalizedPath: norm,
              pathParams: parsedUrl.pathParams,
              queryParams,
              bodyFields,
              hasAuth,
              isDynamic: parsedUrl.isDynamic,
              isUnresolved: parsedUrl.isUnresolved,
              isExternal: false,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }

      ts.forEachChild(node, walk);
    };

    walk(sf);
    return calls;
  }

  private static parseUrlExpression(
    urlNode: ts.Expression,
    sf: ts.SourceFile
  ): {
    rawUrl: string;
    path: string;
    pathParams: string[];
    queryParams: string[];
    isDynamic: boolean;
    isUnresolved: boolean;
    isExternal?: boolean;
  } {
    const queryParams: string[] = [];
    const pathParams: string[] = [];

    // String literal: "/api/services"
    if (ts.isStringLiteral(urlNode) || ts.isNoSubstitutionTemplateLiteral(urlNode)) {
      const rawUrl = urlNode.text;

      // Handle full absolute URLs (e.g. http://localhost:3000/api/services or https://api.stripe.com/v1)
      if (/^https?:\/\//i.test(rawUrl)) {
        try {
          const parsed = new URL(rawUrl);
          const isLoopback =
            parsed.hostname === "localhost" ||
            parsed.hostname === "127.0.0.1" ||
            parsed.hostname === "0.0.0.0";

          if (!isLoopback) {
            // External 3rd-party endpoint (e.g. Stripe, AWS S3, OAuth provider)
            return {
              rawUrl,
              path: "",
              pathParams: [],
              queryParams: [],
              isDynamic: false,
              isUnresolved: false,
              isExternal: true,
            };
          }

          // Loopback URL -> extract local route path and query parameters
          const pathPart = parsed.pathname;
          for (const [k] of parsed.searchParams) {
            queryParams.push(k);
          }
          return {
            rawUrl,
            path: pathPart,
            pathParams: [],
            queryParams,
            isDynamic: false,
            isUnresolved: false,
            isExternal: false,
          };
        } catch {
          return {
            rawUrl,
            path: "",
            pathParams: [],
            queryParams: [],
            isDynamic: false,
            isUnresolved: true,
            isExternal: true,
          };
        }
      }

      const [pathPart, queryPart] = rawUrl.split("?");
      if (queryPart) {
        for (const pair of queryPart.split("&")) {
          const k = pair.split("=")[0];
          if (k) queryParams.push(k);
        }
      }
      return {
        rawUrl,
        path: pathPart,
        pathParams: [],
        queryParams,
        isDynamic: false,
        isUnresolved: false,
        isExternal: false,
      };
    }

    // Template literal: `/api/services/${id}?date=${d}` or `${API_BASE}/api/services/${id}`
    if (ts.isTemplateExpression(urlNode)) {
      const rawText = urlNode.getText(sf).slice(1, -1);

      // External 3rd party template URL (e.g. `https://api.stripe.com/v1/${endpoint}`)
      if (/^https?:\/\//i.test(rawText) && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(rawText)) {
        return {
          rawUrl: rawText,
          path: "",
          pathParams: [],
          queryParams: [],
          isDynamic: true,
          isUnresolved: false,
          isExternal: true,
        };
      }

      let normalized = urlNode.head.text;

      for (let i = 0; i < urlNode.templateSpans.length; i++) {
        const span = urlNode.templateSpans[i];
        const exprText = span.expression.getText(sf);
        const cleanParam = exprText.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^_+|_+$/g, "") || `param${i + 1}`;

        // If template starts with an environment variable or client base URL prefix, e.g. `${API_URL}/api/...`
        if (
          i === 0 &&
          !normalized &&
          /^(API_URL|BASE_URL|API_BASE|VITE_API_URL|BACKEND_URL|SERVER_URL|import_meta_env.*|process_env.*)$/i.test(cleanParam)
        ) {
          normalized += span.literal.text;
          continue;
        }

        if (!normalized.includes("?")) {
          normalized += `:${cleanParam}`;
          pathParams.push(cleanParam);
        }
        normalized += span.literal.text;
      }

      // If loopback host prefix was present, e.g. `http://localhost:3000/api/services/${id}`
      if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(normalized)) {
        normalized = normalized.replace(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i, "");
      }

      const [pathPart, queryPart] = normalized.split("?");
      if (queryPart) {
        // Extract static query keys from template query part (e.g. date=${d}&serviceId=...)
        const qMatches = queryPart.match(/([a-zA-Z0-9_$]+)=/g);
        if (qMatches) {
          for (const qm of qMatches) {
            queryParams.push(qm.replace(/=$/, ""));
          }
        }
      }

      return {
        rawUrl: rawText,
        path: pathPart,
        pathParams,
        queryParams,
        isDynamic: true,
        isUnresolved: false,
        isExternal: false,
      };
    }

    // Binary expression with string concat: "/api/services/" + id
    if (ts.isBinaryExpression(urlNode) && urlNode.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const leftText = urlNode.left.getText(sf).replace(/['"]/g, "");
      const rightText = urlNode.right.getText(sf).replace(/[^a-zA-Z0-9_$]/g, "_");
      if (leftText.startsWith("/")) {
        const full = `${leftText.replace(/\/$/, "")}/:${rightText}`;
        pathParams.push(rightText);
        return {
          rawUrl: urlNode.getText(sf),
          path: full,
          pathParams,
          queryParams,
          isDynamic: true,
          isUnresolved: false,
        };
      }
    }

    // Identifier or opaque expression: api.get(urlVar)
    return {
      rawUrl: urlNode.getText(sf),
      path: "",
      pathParams: [],
      queryParams: [],
      isDynamic: true,
      isUnresolved: true,
    };
  }

  private static extractPayloadFields(
    payloadNode: ts.Expression,
    fields: string[],
    sf: ts.SourceFile
  ): void {
    // 1. Direct object literal: { name, price }
    if (ts.isObjectLiteralExpression(payloadNode)) {
      for (const prop of payloadNode.properties) {
        if (ts.isPropertyAssignment(prop)) {
          fields.push(prop.name.getText(sf));
        } else if (ts.isShorthandPropertyAssignment(prop)) {
          fields.push(prop.name.getText(sf));
        }
      }
      return;
    }

    // 2. JSON.stringify({ name, price })
    if (
      ts.isCallExpression(payloadNode) &&
      payloadNode.expression.getText(sf) === "JSON.stringify" &&
      payloadNode.arguments.length >= 1
    ) {
      this.extractPayloadFields(payloadNode.arguments[0], fields, sf);
    }
  }

  // ── Matching & Verification Helpers ───────────────────────────────────────

  public static pathsMatch(backendPath: string, frontendPath: string): boolean {
    const bSegments = backendPath.replace(/\/$/, "").split("/").filter(Boolean);
    const fSegments = frontendPath.replace(/\/$/, "").split("/").filter(Boolean);

    if (bSegments.length !== fSegments.length) return false;

    for (let i = 0; i < bSegments.length; i++) {
      const b = bSegments[i];
      const f = fSegments[i];

      const bIsParam = b.startsWith(":");
      const fIsParam = f.startsWith(":");

      // Both are params or both are identical literals
      if (bIsParam || fIsParam) {
        continue;
      }
      if (b.toLowerCase() !== f.toLowerCase()) {
        return false;
      }
    }

    return true;
  }

  private static findFuzzyOrParamMismatchEndpoint(
    frontendPath: string,
    backendEndpoints: BackendEndpointContract[]
  ): BackendEndpointContract | undefined {
    const fSegments = frontendPath.replace(/\/$/, "").split("/").filter(Boolean);

    for (const ep of backendEndpoints) {
      const bSegments = ep.fullPath.replace(/\/$/, "").split("/").filter(Boolean);
      if (bSegments.length === fSegments.length) {
        let matchCount = 0;
        for (let i = 0; i < bSegments.length; i++) {
          const b = bSegments[i];
          const f = fSegments[i];
          if (b.toLowerCase() === f.toLowerCase() || b.startsWith(":") || f.startsWith(":")) {
            matchCount++;
          }
        }
        // If all or all-but-one segment matches
        if (matchCount >= bSegments.length - 1 && matchCount > 0) {
          return ep;
        }
      }
    }

    return undefined;
  }

  private static detectPathParamMismatch(
    backendPath: string,
    frontendPath: string
  ): { expectedParam: string; actualParam: string } | null {
    const bSegments = backendPath.replace(/\/$/, "").split("/").filter(Boolean);
    const fSegments = frontendPath.replace(/\/$/, "").split("/").filter(Boolean);

    if (bSegments.length !== fSegments.length) return null;

    for (let i = 0; i < bSegments.length; i++) {
      const b = bSegments[i];
      const f = fSegments[i];

      if (b.startsWith(":") && f.startsWith(":")) {
        const bName = b.slice(1);
        const fName = f.slice(1);
        if (bName !== fName) {
          return { expectedParam: bName, actualParam: fName };
        }
      }
    }

    return null;
  }

  private static verifyQueryParams(
    call: FrontendApiCall,
    endpoint: BackendEndpointContract
  ): ApiMismatchDiagnostic[] {
    const diags: ApiMismatchDiagnostic[] = [];

    // Check if backend requires query params that frontend missed
    for (const qp of endpoint.queryParams) {
      if (qp.required && !call.queryParams.includes(qp.name)) {
        // Check for common parameter aliases (e.g. cat vs category, d vs date)
        const sentAlias = call.queryParams.find(p =>
          qp.name.toLowerCase().startsWith(p.toLowerCase()) || p.toLowerCase().startsWith(qp.name.toLowerCase())
        );

        if (sentAlias) {
          diags.push({
            type: "QUERY_PARAMETER_MISMATCH",
            severity: "ERROR",
            frontendFile: call.sourceFile,
            backendFile: endpoint.sourceFile,
            line: call.line,
            column: call.column,
            expectedPath: endpoint.fullPath,
            actualPath: call.rawUrl,
            paramName: sentAlias,
            expectedParams: [qp.name],
            actualParams: [sentAlias],
            message: `Query parameter alias mismatch on "${call.rawUrl}". Frontend sends "${sentAlias}", but backend endpoint in ${endpoint.sourceFile} requires "${qp.name}".`,
            suggestedFix: `Rename query parameter from "${sentAlias}" to "${qp.name}".`,
          });
        } else {
          diags.push({
            type: "QUERY_PARAMETER_MISMATCH",
            severity: "ERROR",
            frontendFile: call.sourceFile,
            backendFile: endpoint.sourceFile,
            line: call.line,
            column: call.column,
            expectedPath: endpoint.fullPath,
            actualPath: call.rawUrl,
            paramName: qp.name,
            expectedParams: [qp.name],
            actualParams: call.queryParams,
            message: `Missing required query parameter "${qp.name}" on "${call.method} ${call.rawUrl}". Declared in ${endpoint.sourceFile}.`,
            suggestedFix: `Add query parameter "${qp.name}" to request.`,
          });
        }
      }
    }

    return diags;
  }

  private static verifyRequestBody(
    call: FrontendApiCall,
    endpoint: BackendEndpointContract
  ): ApiMismatchDiagnostic[] {
    const diags: ApiMismatchDiagnostic[] = [];

    // Only validate payload if frontend provided explicit fields and backend declared required fields
    if (call.bodyFields.length > 0 && endpoint.bodyFields.length > 0) {
      const requiredFields = endpoint.bodyFields.filter(bf => bf.required);
      for (const rf of requiredFields) {
        if (!call.bodyFields.includes(rf.name)) {
          // Check for common field aliases (e.g. title vs name)
          const sentAlias = call.bodyFields.find(bf =>
            (rf.name === "name" && bf === "title") ||
            (rf.name === "title" && bf === "name") ||
            (rf.name === "userId" && bf === "user_id") ||
            (rf.name === "durationMinutes" && bf === "duration")
          );

          if (sentAlias) {
            diags.push({
              type: "REQUEST_BODY_MISMATCH",
              severity: "ERROR",
              frontendFile: call.sourceFile,
              backendFile: endpoint.sourceFile,
              line: call.line,
              column: call.column,
              expectedPath: endpoint.fullPath,
              actualPath: call.rawUrl,
              paramName: sentAlias,
              expectedParams: [rf.name],
              actualParams: [sentAlias],
              message: `Payload field alias mismatch in request to "${call.method} ${call.rawUrl}". Frontend sends payload field "${sentAlias}", but backend in ${endpoint.sourceFile} expects "${rf.name}".`,
              suggestedFix: `Change payload key "${sentAlias}" to "${rf.name}".`,
            });
          } else {
            diags.push({
              type: "REQUEST_BODY_MISMATCH",
              severity: "ERROR",
              frontendFile: call.sourceFile,
              backendFile: endpoint.sourceFile,
              line: call.line,
              column: call.column,
              expectedPath: endpoint.fullPath,
              actualPath: call.rawUrl,
              paramName: rf.name,
              expectedParams: [rf.name],
              actualParams: call.bodyFields,
              message: `Missing required payload field "${rf.name}" in request to "${call.method} ${call.rawUrl}". Declared in ${endpoint.sourceFile}.`,
              suggestedFix: `Include "${rf.name}" in request body.`,
            });
          }
        }
      }
    }

    return diags;
  }
}

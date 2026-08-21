/**
 * HttpControllerResolver — Aegis V2.3 Project 2 Phase 7.2
 *
 * Resolves controller method definitions, req.params / req.query / req.body extractions,
 * response shapes (res.json, res.status().json), and Service invocations.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ControllerMethodInfo {
  controllerName: string;
  methodName: string;
  filePath: string;
  extractedParams: string[];
  extractedQuery: string[];
  usesBody: boolean;
  statusCodes: number[];
  serviceCalls: string[];
  startPos: number;
  endPos: number;
}

export class HttpControllerResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Resolves details of a controller method in a file.
   */
  public resolveControllerMethod(
    filePath: string,
    controllerName: string,
    methodName: string
  ): ControllerMethodInfo | null {
    const fullPath = resolve(this.projectRoot, filePath);
    if (!existsSync(fullPath)) return null;

    const content = readFileSync(fullPath, "utf8");
    const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    let info: ControllerMethodInfo | null = null;

    const visit = (node: ts.Node) => {
      // Class method or object property function
      if (
        (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === methodName) ||
        (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === methodName)
      ) {
        const extractedParams: string[] = [];
        const extractedQuery: string[] = [];
        const statusCodes: number[] = [];
        const serviceCalls: string[] = [];
        let usesBody = false;

        const checkBody = (child: ts.Node) => {
          // Check req.params.foo or const { id } = req.params
          if (ts.isPropertyAccessExpression(child)) {
            const text = child.getText(sf);
            if (text.startsWith("req.params.")) {
              extractedParams.push(child.name.text);
            } else if (text.startsWith("req.query.")) {
              extractedQuery.push(child.name.text);
            } else if (text === "req.body") {
              usesBody = true;
            }
          }

          // Check res.status(200)
          if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression)) {
            if (child.expression.name.text === "status" && child.arguments.length > 0) {
              const arg = child.arguments[0];
              if (ts.isNumericLiteral(arg)) {
                statusCodes.push(parseInt(arg.text, 10));
              }
            }
          }

          // Check service calls e.g. taskService.updateTask(...)
          if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression)) {
            const propText = child.expression.getText(sf);
            if (propText.includes("Service.") || propText.includes("service.")) {
              serviceCalls.push(propText);
            }
          }

          ts.forEachChild(child, checkBody);
        };

        ts.forEachChild(node, checkBody);

        info = {
          controllerName,
          methodName,
          filePath,
          extractedParams: [...new Set(extractedParams)],
          extractedQuery: [...new Set(extractedQuery)],
          usesBody,
          statusCodes: statusCodes.length > 0 ? statusCodes : [200],
          serviceCalls,
          startPos: node.getStart(sf),
          endPos: node.getEnd(),
        };
      }
      ts.forEachChild(node, visit);
    };

    visit(sf);
    return info;
  }
}

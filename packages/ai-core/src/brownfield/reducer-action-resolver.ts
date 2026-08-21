/**
 * ReducerActionResolver
 *
 * Traverses TypeScript ASTs to extract discriminated union action types,
 * reducer function switch/case branches, action creators, and dispatch call sites.
 * Safely halts on dynamic action types or computed dispatch payloads.
 */

import ts from "typescript";
import { SymbolReferenceResolver } from "./symbol-reference-resolver.js";

export type ActionEdgeType =
  | "DEFINES_ACTION"
  | "CREATES_ACTION"
  | "DISPATCHES_ACTION"
  | "HANDLES_ACTION"
  | "READS_REDUCER_STATE"
  | "WRITES_REDUCER_STATE";

export interface ActionTypeDefinition {
  typeName: string;
  filePath: string;
  actionTypeLiteral: string; // e.g. "UPDATE_TASK"
  payloadFields: string[]; // ["id", "meta"]
  line: number;
  col: number;
}

export interface ActionCreatorDefinition {
  creatorName: string;
  filePath: string;
  actionTypeLiteral: string;
  parameterNames: string[];
  line: number;
  col: number;
}

export interface ReducerBranch {
  reducerName: string;
  filePath: string;
  actionTypeLiteral: string;
  propertyReads: string[]; // ["id", "meta"]
  line: number;
  col: number;
}

export interface DispatchCallSite {
  callerFile: string;
  callerComponent: string;
  actionTypeLiteral: string;
  dispatchedFields: string[];
  isDynamic: boolean;
  line: number;
  col: number;
}

export interface ActionUsageEdge {
  fromFile: string;
  fromComponent: string;
  toFile: string;
  actionTypeLiteral: string;
  edgeType: ActionEdgeType;
  line: number;
  col: number;
}

export interface UnsafeActionPattern {
  filePath: string;
  actionTypeLiteral?: string;
  reason: string;
}

export class ReducerActionResolver {
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly actionTypes: ActionTypeDefinition[] = [];
  private readonly actionCreators: ActionCreatorDefinition[] = [];
  private readonly reducerBranches: ReducerBranch[] = [];
  private readonly dispatchSites: DispatchCallSite[] = [];
  private readonly edges: ActionUsageEdge[] = [];
  private readonly unsafePatterns: UnsafeActionPattern[] = [];

  constructor(symbolResolver: SymbolReferenceResolver) {
    this.symbolResolver = symbolResolver;
  }

  /**
   * Analyzes all files in the project for action types, reducers, action creators, and dispatches.
   */
  public analyzeProject(): {
    actionTypes: ActionTypeDefinition[];
    actionCreators: ActionCreatorDefinition[];
    reducerBranches: ReducerBranch[];
    dispatchSites: DispatchCallSite[];
    edges: ActionUsageEdge[];
    unsafePatterns: UnsafeActionPattern[];
  } {
    const summaries = this.symbolResolver.getAllSummaries();

    for (const [filePath] of summaries) {
      this.analyzeFile(filePath);
    }

    this.linkActionEdges();

    return {
      actionTypes: this.actionTypes,
      actionCreators: this.actionCreators,
      reducerBranches: this.reducerBranches,
      dispatchSites: this.dispatchSites,
      edges: this.edges,
      unsafePatterns: this.unsafePatterns,
    };
  }

  /**
   * Finds all definition, creator, dispatch, and reducer sites for a specific action type literal.
   */
  public findActionTrace(
    actionTypeLiteral: string,
    payloadField?: string
  ): {
    actionTypes: ActionTypeDefinition[];
    actionCreators: ActionCreatorDefinition[];
    reducerBranches: ReducerBranch[];
    dispatchSites: DispatchCallSite[];
    hasDynamicAction: boolean;
    unsafeReasons: string[];
  } {
    const types = this.actionTypes.filter(t => t.actionTypeLiteral === actionTypeLiteral);
    const creators = this.actionCreators.filter(c => c.actionTypeLiteral === actionTypeLiteral);
    const branches = this.reducerBranches.filter(b => b.actionTypeLiteral === actionTypeLiteral);
    const dispatches = this.dispatchSites.filter(d => d.actionTypeLiteral === actionTypeLiteral);

    const hasDynamic = dispatches.some(d => d.isDynamic) ||
      this.unsafePatterns.some(u => u.actionTypeLiteral === actionTypeLiteral || !u.actionTypeLiteral);

    const unsafeReasons: string[] = [];
    if (hasDynamic) {
      unsafeReasons.push(
        `DYNAMIC_ACTION_DISPATCH: Action "${actionTypeLiteral}" is constructed dynamically or dispatched with non-literal type expression. Cannot statically prove action completeness.`
      );
    }

    const matchedBranches = payloadField
      ? branches.filter(b => b.propertyReads.includes(payloadField) || b.propertyReads.length === 0)
      : branches;

    return {
      actionTypes: types,
      actionCreators: creators,
      reducerBranches: matchedBranches,
      dispatchSites: dispatches,
      hasDynamicAction: hasDynamic,
      unsafeReasons,
    };
  }

  public getUnsafePatterns(): UnsafeActionPattern[] {
    return this.unsafePatterns;
  }

  private analyzeFile(filePath: string) {
    const sourceFile = this.symbolResolver.getSourceFile(filePath);
    if (!sourceFile) return;

    const scopeStack: string[] = ["top_level"];

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      // Track function / component scopes
      if (ts.isFunctionDeclaration(node) && node.name) {
        scopeStack.push(node.name.text);
        pushedScope = true;

        // Check if function is a Reducer: e.g. taskReducer(state, action)
        if (node.name.text.endsWith("Reducer") || node.name.text.includes("reducer")) {
          this.extractReducerBranches(node, node.name.text, filePath, sourceFile);
        }
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        scopeStack.push(node.name.text);
        pushedScope = true;

        if (node.name.text.endsWith("Reducer") || node.name.text.includes("reducer")) {
          this.extractReducerBranches(node.initializer, node.name.text, filePath, sourceFile);
        }
      }

      const currentScope = scopeStack[scopeStack.length - 1];

      // 1. Action Type Declarations: type Action = { type: "ADD_TASK"; task: any } | { type: "UPDATE_TASK"; id: string }
      if (ts.isTypeAliasDeclaration(node) && ts.isIdentifier(node.name)) {
        this.extractActionTypes(node.type, node.name.text, filePath, sourceFile);
      }

      // 2. Action Interface Declarations: interface UpdateTaskAction { type: "UPDATE_TASK"; id: string; }
      if (ts.isInterfaceDeclaration(node) && ts.isIdentifier(node.name)) {
        this.extractInterfaceAction(node, node.name.text, filePath, sourceFile);
      }

      // 3. Action Creator Functions: function updateTask(id, meta) { return { type: "UPDATE_TASK", id, meta }; }
      if (ts.isFunctionDeclaration(node) && node.name && !node.name.text.endsWith("Reducer")) {
        this.extractActionCreator(node.body, node.name.text, node.parameters, filePath, sourceFile, node.getStart(sourceFile));
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        this.extractActionCreator(node.initializer.body, node.name.text, node.initializer.parameters, filePath, sourceFile, node.getStart(sourceFile));
      }

      // 4. Dispatch Call Sites: dispatch({ type: "UPDATE_TASK", id }) or dispatch(updateTask(id))
      if (ts.isCallExpression(node)) {
        const callText = node.expression.getText(sourceFile);
        if (callText === "dispatch" || callText.endsWith(".dispatch")) {
          this.extractDispatchCall(node, currentScope, filePath, sourceFile);
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopeStack.pop();
      }
    };

    visit(sourceFile);
  }

  private extractActionTypes(typeNode: ts.TypeNode, typeName: string, filePath: string, sourceFile: ts.SourceFile) {
    // Discriminated union: A | B | C
    if (ts.isUnionTypeNode(typeNode)) {
      for (const member of typeNode.types) {
        if (ts.isTypeLiteralNode(member)) {
          this.extractTypeLiteralAction(member, typeName, filePath, sourceFile);
        }
      }
    } else if (ts.isTypeLiteralNode(typeNode)) {
      this.extractTypeLiteralAction(typeNode, typeName, filePath, sourceFile);
    }
  }

  private extractTypeLiteralAction(typeLiteral: ts.TypeLiteralNode, typeName: string, filePath: string, sourceFile: ts.SourceFile) {
    let actionTypeLiteral: string | undefined;
    const payloadFields: string[] = [];
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(typeLiteral.getStart(sourceFile));

    for (const member of typeLiteral.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const fieldName = member.name.text;
        if (fieldName === "type" && member.type && ts.isLiteralTypeNode(member.type) && ts.isStringLiteral(member.type.literal)) {
          actionTypeLiteral = member.type.literal.text;
        } else if (fieldName !== "type") {
          payloadFields.push(fieldName);
        }
      }
    }

    if (actionTypeLiteral) {
      this.actionTypes.push({
        typeName,
        filePath,
        actionTypeLiteral,
        payloadFields,
        line: line + 1,
        col: character + 1,
      });
    }
  }

  private extractInterfaceAction(iface: ts.InterfaceDeclaration, typeName: string, filePath: string, sourceFile: ts.SourceFile) {
    let actionTypeLiteral: string | undefined;
    const payloadFields: string[] = [];
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(iface.getStart(sourceFile));

    for (const member of iface.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const fieldName = member.name.text;
        if (fieldName === "type" && member.type && ts.isLiteralTypeNode(member.type) && ts.isStringLiteral(member.type.literal)) {
          actionTypeLiteral = member.type.literal.text;
        } else if (fieldName !== "type") {
          payloadFields.push(fieldName);
        }
      }
    }

    if (actionTypeLiteral) {
      this.actionTypes.push({
        typeName,
        filePath,
        actionTypeLiteral,
        payloadFields,
        line: line + 1,
        col: character + 1,
      });
    }
  }

  private extractActionCreator(
    body: ts.Node | undefined,
    creatorName: string,
    params: ts.NodeArray<ts.ParameterDeclaration>,
    filePath: string,
    sourceFile: ts.SourceFile,
    startPos: number
  ) {
    if (!body) return;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(startPos);
    const paramNames = params.map(p => p.name.getText(sourceFile));

    const checkReturn = (n: ts.Node) => {
      // Direct return statement: return { type: "..." }
      if (ts.isReturnStatement(n) && n.expression) {
        let expr = n.expression;
        if (ts.isParenthesizedExpression(expr)) expr = expr.expression;
        if (ts.isObjectLiteralExpression(expr)) {
          this.checkObjectForActionCreator(expr, creatorName, paramNames, filePath, line, character);
        }
      }
      // Arrow function direct expression body: () => ({ type: "..." })
      else if (ts.isArrowFunction(n) && !ts.isBlock(n.body)) {
        let expr = n.body;
        if (ts.isParenthesizedExpression(expr)) expr = expr.expression;
        if (ts.isObjectLiteralExpression(expr)) {
          this.checkObjectForActionCreator(expr, creatorName, paramNames, filePath, line, character);
        }
      }

      if (!ts.isFunctionDeclaration(n) && !ts.isFunctionExpression(n) && !ts.isArrowFunction(n)) {
        ts.forEachChild(n, checkReturn);
      }
    };

    // If body is expression (arrow function)
    if (!ts.isBlock(body)) {
      let expr = body;
      if (ts.isParenthesizedExpression(expr)) expr = expr.expression;
      if (ts.isObjectLiteralExpression(expr)) {
        this.checkObjectForActionCreator(expr, creatorName, paramNames, filePath, line, character);
        return;
      }
    }

    ts.forEachChild(body, checkReturn);
  }

  private checkObjectForActionCreator(
    obj: ts.ObjectLiteralExpression,
    creatorName: string,
    paramNames: string[],
    filePath: string,
    line: number,
    col: number
  ) {
    for (const prop of obj.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === "type" && ts.isStringLiteral(prop.initializer)) {
        this.actionCreators.push({
          creatorName,
          filePath,
          actionTypeLiteral: prop.initializer.text,
          parameterNames: paramNames,
          line: line + 1,
          col: col + 1,
        });
      }
    }
  }

  private extractReducerBranches(reducerNode: ts.Node, reducerName: string, filePath: string, sourceFile: ts.SourceFile) {
    const visitBranches = (n: ts.Node) => {
      // switch(action.type)
      if (ts.isSwitchStatement(n)) {
        for (const clause of n.caseBlock.clauses) {
          if (ts.isCaseClause(clause) && ts.isStringLiteral(clause.expression)) {
            const actionTypeLiteral = clause.expression.text;
            const propertyReads: string[] = [];
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(clause.getStart(sourceFile));

            // Scan case statements for action.fieldName reads
            const visitCaseBlock = (child: ts.Node) => {
              if (ts.isPropertyAccessExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === "action") {
                const prop = child.name.text;
                if (prop !== "type" && !propertyReads.includes(prop)) {
                  propertyReads.push(prop);
                }
              }
              ts.forEachChild(child, visitCaseBlock);
            };

            for (const st of clause.statements) {
              visitCaseBlock(st);
            }

            this.reducerBranches.push({
              reducerName,
              filePath,
              actionTypeLiteral,
              propertyReads,
              line: line + 1,
              col: character + 1,
            });
          }
        }
      }

      // Static Handler Map: handlers.UPDATE_TASK = (state, action) => ...
      if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name)) {
        const actionTypeLiteral = n.name.text;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile));
        this.reducerBranches.push({
          reducerName,
          filePath,
          actionTypeLiteral,
          propertyReads: [],
          line: line + 1,
          col: character + 1,
        });
      }

      ts.forEachChild(n, visitBranches);
    };

    visitBranches(reducerNode);
  }

  private extractDispatchCall(callNode: ts.CallExpression, callerComponent: string, filePath: string, sourceFile: ts.SourceFile) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(callNode.getStart(sourceFile));
    if (callNode.arguments.length === 0) return;

    const firstArg = callNode.arguments[0];

    // Direct object literal: dispatch({ type: "UPDATE_TASK", id })
    if (ts.isObjectLiteralExpression(firstArg)) {
      let actionTypeLiteral: string | undefined;
      const dispatchedFields: string[] = [];

      for (const prop of firstArg.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          if (prop.name.text === "type") {
            if (ts.isStringLiteral(prop.initializer)) {
              actionTypeLiteral = prop.initializer.text;
            } else {
              // Dynamic action type: dispatch({ type: dynamicVar })
              this.unsafePatterns.push({
                filePath,
                reason: `Dynamic action type variable in dispatch call "${firstArg.getText(sourceFile)}" in ${filePath}`,
              });
              this.dispatchSites.push({
                callerFile: filePath,
                callerComponent,
                actionTypeLiteral: "UNKNOWN_DYNAMIC",
                dispatchedFields: [],
                isDynamic: true,
                line: line + 1,
                col: character + 1,
              });
              return;
            }
          } else {
            dispatchedFields.push(prop.name.text);
          }
        } else if (ts.isShorthandPropertyAssignment(prop)) {
          if (prop.name.text !== "type") {
            dispatchedFields.push(prop.name.text);
          }
        }
      }

      if (actionTypeLiteral) {
        this.dispatchSites.push({
          callerFile: filePath,
          callerComponent,
          actionTypeLiteral,
          dispatchedFields,
          isDynamic: false,
          line: line + 1,
          col: character + 1,
        });
      }
    }
    // Action Creator Call: dispatch(updateTask(id))
    else if (ts.isCallExpression(firstArg)) {
      const creatorName = firstArg.expression.getText(sourceFile);
      const creatorDef = this.actionCreators.find(c => c.creatorName === creatorName);

      if (creatorDef) {
        this.dispatchSites.push({
          callerFile: filePath,
          callerComponent,
          actionTypeLiteral: creatorDef.actionTypeLiteral,
          dispatchedFields: creatorDef.parameterNames,
          isDynamic: false,
          line: line + 1,
          col: character + 1,
        });
      } else {
        // Unknown dynamic builder function
        this.unsafePatterns.push({
          filePath,
          reason: `Unresolved dynamic action builder function "${creatorName}" in ${filePath}`,
        });
        this.dispatchSites.push({
          callerFile: filePath,
          callerComponent,
          actionTypeLiteral: "UNKNOWN_DYNAMIC",
          dispatchedFields: [],
          isDynamic: true,
          line: line + 1,
          col: character + 1,
        });
      }
    }
  }

  private linkActionEdges() {
    for (const def of this.actionTypes) {
      this.edges.push({
        fromFile: def.filePath,
        fromComponent: "top_level",
        toFile: def.filePath,
        actionTypeLiteral: def.actionTypeLiteral,
        edgeType: "DEFINES_ACTION",
        line: def.line,
        col: def.col,
      });
    }

    for (const creator of this.actionCreators) {
      this.edges.push({
        fromFile: creator.filePath,
        fromComponent: creator.creatorName,
        toFile: creator.filePath,
        actionTypeLiteral: creator.actionTypeLiteral,
        edgeType: "CREATES_ACTION",
        line: creator.line,
        col: creator.col,
      });
    }

    for (const branch of this.reducerBranches) {
      this.edges.push({
        fromFile: branch.filePath,
        fromComponent: branch.reducerName,
        toFile: branch.filePath,
        actionTypeLiteral: branch.actionTypeLiteral,
        edgeType: "HANDLES_ACTION",
        line: branch.line,
        col: branch.col,
      });
    }

    for (const disp of this.dispatchSites) {
      if (!disp.isDynamic) {
        this.edges.push({
          fromFile: disp.callerFile,
          fromComponent: disp.callerComponent,
          toFile: disp.callerFile,
          actionTypeLiteral: disp.actionTypeLiteral,
          edgeType: "DISPATCHES_ACTION",
          line: disp.line,
          col: disp.col,
        });
      }
    }
  }
}

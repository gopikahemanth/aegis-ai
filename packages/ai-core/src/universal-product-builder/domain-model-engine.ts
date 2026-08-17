/**
 * DomainModelEngine
 *
 * Derives normalized database models, relation schemas, and field types from discovered domain specifications.
 */

import { type ProductDomain } from "./domain-discovery-engine.js";

export interface ModelField {
  name: string;
  type: "String" | "Int" | "Float" | "Boolean" | "DateTime" | "Json";
  isRequired: boolean;
  isUnique?: boolean;
  isId?: boolean;
  defaultValue?: string;
}

export interface DomainEntityModel {
  name: string;
  description: string;
  fields: ModelField[];
  relations: { targetModel: string; relationType: "ONE_TO_MANY" | "MANY_TO_ONE" | "ONE_TO_ONE" }[];
}

export class DomainModelEngine {
  public static deriveDomainModels(domain: ProductDomain, customEntityNames?: string[]): DomainEntityModel[] {
    switch (domain) {
      case "ECOMMERCE":
        return [
          {
            name: "User",
            description: "Registered shoppers and administrators",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "email", type: "String", isRequired: true, isUnique: true },
              { name: "role", type: "String", isRequired: true, defaultValue: '"CUSTOMER"' },
            ],
            relations: [{ targetModel: "Order", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Product",
            description: "Merchandise catalog item",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "name", type: "String", isRequired: true },
              { name: "price", type: "Float", isRequired: true },
              { name: "inventoryCount", type: "Int", isRequired: true },
            ],
            relations: [{ targetModel: "CartItem", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Order",
            description: "Completed customer purchase transaction",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "totalAmount", type: "Float", isRequired: true },
              { name: "status", type: "String", isRequired: true, defaultValue: '"PENDING"' },
            ],
            relations: [
              { targetModel: "User", relationType: "MANY_TO_ONE" },
              { targetModel: "Payment", relationType: "ONE_TO_ONE" },
            ],
          },
          {
            name: "Payment",
            description: "Financial settlement record",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "amount", type: "Float", isRequired: true },
              { name: "provider", type: "String", isRequired: true, defaultValue: '"STRIPE"' },
              { name: "status", type: "String", isRequired: true, defaultValue: '"COMPLETED"' },
            ],
            relations: [{ targetModel: "Order", relationType: "MANY_TO_ONE" }],
          },
        ];

      case "EDUCATION":
        return [
          {
            name: "User",
            description: "Students, instructors, and academic administrators",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "email", type: "String", isRequired: true, isUnique: true },
              { name: "role", type: "String", isRequired: true, defaultValue: '"STUDENT"' },
            ],
            relations: [{ targetModel: "Enrollment", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Course",
            description: "Structured curriculum syllabus",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "title", type: "String", isRequired: true },
              { name: "description", type: "String", isRequired: false },
            ],
            relations: [{ targetModel: "Lesson", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Lesson",
            description: "Course learning module",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "title", type: "String", isRequired: true },
              { name: "content", type: "String", isRequired: true },
            ],
            relations: [{ targetModel: "Course", relationType: "MANY_TO_ONE" }],
          },
          {
            name: "Assignment",
            description: "Course student assessment task",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "title", type: "String", isRequired: true },
              { name: "maxScore", type: "Int", isRequired: true },
            ],
            relations: [{ targetModel: "Submission", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Submission",
            description: "Student assignment response and grading",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "content", type: "String", isRequired: true },
              { name: "grade", type: "Float", isRequired: false },
            ],
            relations: [{ targetModel: "Assignment", relationType: "MANY_TO_ONE" }],
          },
        ];

      case "CRM":
        return [
          {
            name: "User",
            description: "Sales representatives and account executives",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "email", type: "String", isRequired: true, isUnique: true },
              { name: "role", type: "String", isRequired: true, defaultValue: '"SALES_REP"' },
            ],
            relations: [{ targetModel: "Lead", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Lead",
            description: "Prospective customer contact",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "name", type: "String", isRequired: true },
              { name: "company", type: "String", isRequired: false },
              { name: "status", type: "String", isRequired: true, defaultValue: '"NEW"' },
            ],
            relations: [{ targetModel: "Opportunity", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Opportunity",
            description: "Sales deal pipeline stage",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "dealSize", type: "Float", isRequired: true },
              { name: "stage", type: "String", isRequired: true, defaultValue: '"PROSPECTING"' },
            ],
            relations: [{ targetModel: "Lead", relationType: "MANY_TO_ONE" }],
          },
          {
            name: "Activity",
            description: "Logged interaction (call, email, meeting)",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "type", type: "String", isRequired: true },
              { name: "notes", type: "String", isRequired: false },
            ],
            relations: [{ targetModel: "Lead", relationType: "MANY_TO_ONE" }],
          },
        ];

      case "BOOKING":
        return [
          {
            name: "User",
            description: "Customers and booking managers",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "email", type: "String", isRequired: true, isUnique: true },
            ],
            relations: [{ targetModel: "Booking", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Service",
            description: "Bookable resource or service package",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "name", type: "String", isRequired: true },
              { name: "durationMinutes", type: "Int", isRequired: true },
              { name: "price", type: "Float", isRequired: true },
            ],
            relations: [{ targetModel: "Booking", relationType: "ONE_TO_MANY" }],
          },
          {
            name: "Booking",
            description: "Scheduled customer appointment",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "scheduledAt", type: "DateTime", isRequired: true },
              { name: "status", type: "String", isRequired: true, defaultValue: '"CONFIRMED"' },
            ],
            relations: [
              { targetModel: "User", relationType: "MANY_TO_ONE" },
              { targetModel: "Service", relationType: "MANY_TO_ONE" },
            ],
          },
        ];

      default: // CUSTOM & others
        const entities = customEntityNames && customEntityNames.length > 0 ? customEntityNames : ["Item", "Record", "Transaction"];
        return [
          {
            name: "User",
            description: "Primary system actor",
            fields: [
              { name: "id", type: "String", isRequired: true, isId: true },
              { name: "email", type: "String", isRequired: true, isUnique: true },
              { name: "role", type: "String", isRequired: true, defaultValue: '"USER"' },
            ],
            relations: [],
          },
          ...entities.map((ent) => ({
            name: ent,
            description: `Dynamic domain entity: ${ent}`,
            fields: [
              { name: "id", type: "String" as const, isRequired: true, isId: true },
              { name: "name", type: "String" as const, isRequired: true },
              { name: "status", type: "String" as const, isRequired: true, defaultValue: '"ACTIVE"' },
            ],
            relations: [{ targetModel: "User", relationType: "MANY_TO_ONE" as const }],
          })),
        ];
    }
  }
}

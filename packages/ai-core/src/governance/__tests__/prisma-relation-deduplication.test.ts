import { describe, it, expect } from "vitest";
import { AuthorizedSchemaManager } from "../authorized-schema-manager.js";
import { DynamicDataModelContract } from "../dynamic-data-model.js";

describe("Prisma Relation Deduplication & Canonical Naming Suite (Defect 2)", () => {
  it("generates canonical camelCase plural relations in DynamicDataModelContract", () => {
    const domainContract = {
      domainName: "coffee-roastery",
      entities: [
        { name: "User", kind: "infrastructure" },
        { name: "CoffeeItem", kind: "domain" },
        { name: "TableReservation", kind: "domain" },
        { name: "CartItem", kind: "domain" },
        { name: "FeedbackSubmission", kind: "domain" },
        { name: "QuizPreference", kind: "domain" },
        { name: "RoastProfile", kind: "domain" },
      ],
    } as any;

    const result = DynamicDataModelContract.derive(domainContract, "postgresql");
    const schema = result.prismaSchema;

    // User model must contain canonical camelCase relation names
    expect(schema).toMatch(/coffeeItems\s+CoffeeItem\[\]/);
    expect(schema).toMatch(/tableReservations\s+TableReservation\[\]/);
    expect(schema).toMatch(/cartItems\s+CartItem\[\]/);
    expect(schema).toMatch(/feedbackSubmissions\s+FeedbackSubmission\[\]/);
    expect(schema).toMatch(/quizPreferences\s+QuizPreference\[\]/);
    expect(schema).toMatch(/roastProfiles\s+RoastProfile\[\]/);

    // Must NOT contain all-lowercase duplicates
    expect(schema).not.toContain("coffeeitems");
    expect(schema).not.toContain("tablereservations");
    expect(schema).not.toContain("cartitems");
    expect(schema).not.toContain("feedbacksubmissions");
    expect(schema).not.toContain("quizpreferences");
    expect(schema).not.toContain("roastprofiles");
  });

  it("canonicalizes and deduplicates existing schemas with both lowercase and camelCase relations", () => {
    const dirtySchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                  String               @id @default(uuid())
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  email               String               @unique
  passwordHash        String
  coffeeitems         CoffeeItem[]
  cartitems           CartItem[]
  tablereservations   TableReservation[]
  feedbacksubmissions FeedbackSubmission[]
  quizpreferences     QuizPreference[]
  roastprofiles       RoastProfile[]
  coffeeItems         CoffeeItem[]
  cartItems           CartItem[]
  tableReservations   TableReservation[]
  feedbackSubmissions FeedbackSubmission[]
  quizPreferences     QuizPreference[]
  roastProfiles       RoastProfile[]
}

model CoffeeItem {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
}

model CartItem {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
}

model TableReservation {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
}

model FeedbackSubmission {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
}

model QuizPreference {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
}

model RoastProfile {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
}
`;

    const cleaned = (AuthorizedSchemaManager as any).canonicalizeAndDeduplicateRelations(dirtySchema);

    // Each relation must appear EXACTLY ONCE
    expect(cleaned.match(/coffeeItems\s+CoffeeItem\[\]/g)?.length).toBe(1);
    expect(cleaned.match(/cartItems\s+CartItem\[\]/g)?.length).toBe(1);
    expect(cleaned.match(/tableReservations\s+TableReservation\[\]/g)?.length).toBe(1);
    expect(cleaned.match(/feedbackSubmissions\s+FeedbackSubmission\[\]/g)?.length).toBe(1);
    expect(cleaned.match(/quizPreferences\s+QuizPreference\[\]/g)?.length).toBe(1);
    expect(cleaned.match(/roastProfiles\s+RoastProfile\[\]/g)?.length).toBe(1);

    // No lowercase duplicate relations
    expect(cleaned).not.toContain("coffeeitems");
    expect(cleaned).not.toContain("tablereservations");
    expect(cleaned).not.toContain("cartitems");
    expect(cleaned).not.toContain("feedbacksubmissions");
    expect(cleaned).not.toContain("quizpreferences");
    expect(cleaned).not.toContain("roastprofiles");

    // Must pass schema validation
    const validation = AuthorizedSchemaManager.validateSchemaContent(cleaned);
    expect(validation.valid).toBe(true);
  });

  it("reconciles incoming model without creating ambiguous duplicate relations", () => {
    const existing = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String       @id @default(uuid())
  coffeeitems CoffeeItem[]
}

model CoffeeItem {
  id     String @id @default(uuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
`;

    const incoming = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String       @id @default(uuid())
  coffeeItems CoffeeItem[]
}

model CoffeeItem {
  id     String @id @default(uuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
`;

    const result = AuthorizedSchemaManager.reconcile(existing, incoming, "postgresql");
    expect(result.success).toBe(true);
    expect(result.schemaContent.match(/coffeeItems\s+CoffeeItem\[\]/g)?.length).toBe(1);
    expect(result.schemaContent).not.toContain("coffeeitems");
  });
});

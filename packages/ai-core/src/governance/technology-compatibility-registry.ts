export interface TechnologyFamily {
  name: string;
  compatible: string[];
  incompatible: string[];
}

export class TechnologyCompatibilityRegistry {
  private static matrix: Record<string, TechnologyFamily> = {
    "react-vite": {
      name: "React-Vite",
      compatible: ["react", "vite", "react-router-dom", "@tanstack/react-query", "lucide-react", "tailwindcss", "clsx"],
      incompatible: ["next", "next-auth", "@next/font", "next/navigation", "next/server"]
    },
    "express": {
      name: "Express",
      compatible: ["express", "cors", "multer", "jsonwebtoken", "bcryptjs", "zod"],
      incompatible: ["next/server", "next-auth", "koa", "fastify"]
    },
    "postgresql": {
      name: "PostgreSQL",
      compatible: ["prisma", "@prisma/client", "pg"],
      incompatible: ["mongoose", "mongodb", "drizzle-orm"]
    }
  };

  public static isForbidden(technology: string, stack: { frontend: string; backend: string; database: string }): boolean {
    const techLower = technology.toLowerCase().trim();
    
    // Check forbidden Next.js terms if frontend is React-Vite
    if (stack.frontend.toLowerCase().includes("vite") || stack.frontend.toLowerCase().includes("react")) {
      if (techLower.includes("next") || techLower.includes("nextauth") || techLower.includes("app router") || techLower.includes("server actions")) {
        return true;
      }
    }

    // Check forbidden Mongoose/MongoDB terms if database is PostgreSQL
    if (stack.database.toLowerCase().includes("postgres") || stack.database.toLowerCase().includes("sqlite")) {
      if (techLower.includes("mongo") || techLower.includes("mongoose") || techLower.includes("drizzle")) {
        return true;
      }
    }

    return false;
  }
}

import React from "react";
import { AppRoutes } from "./routes";

export default function App() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-text-primary, var(--color-text))",
      }}
    >
      <AppRoutes />
    </div>
  );
}

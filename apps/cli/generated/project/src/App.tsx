import React from "react";
import AppRoutes from "./routes";

export default function App(props: any) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppRoutes />
    </div>
  );
}
export { App };

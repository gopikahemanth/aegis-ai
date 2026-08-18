import React from "react";
import { Routes, Route } from "react-router-dom";

export function AppRoutes(props: any) {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Application Ready</h1></div>} />
    </Routes>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
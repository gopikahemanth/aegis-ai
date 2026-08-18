import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function App(props: any) {
  return (
    <QueryClientProvider client={queryClient}>
      
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
          <AppRoutes />
        </div>
      
    </QueryClientProvider>
  );
}

export default App;

import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import App from "./App";

// Create a container for the root element
const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = createRoot(container);

// Render the app with QueryClientProvider and AuthProvider at the top level
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);

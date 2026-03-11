import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/theme/context";
import { App } from "@/app";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      useToastStore.getState().addToast({
        message: getApiErrorMessage(error),
        variant: "error",
      });
    },
  }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

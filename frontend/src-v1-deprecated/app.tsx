import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { useAuth } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";

export function App() {
  useAuth();

  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}

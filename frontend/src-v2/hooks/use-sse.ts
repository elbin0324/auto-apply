import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

/**
 * Opens an SSE connection to /api/applications/stream and invalidates
 * relevant React Query caches when progress/result events arrive.
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      // Get current access token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || cancelled) return;

      const url = `${API_BASE_URL}/api/applications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("progress", () => {
        queryClient.invalidateQueries({ queryKey: ["applications"] });
        queryClient.invalidateQueries({ queryKey: ["queue-status"] });
        queryClient.invalidateQueries({ queryKey: ["application-stats"] });
      });

      es.addEventListener("result", () => {
        queryClient.invalidateQueries({ queryKey: ["applications"] });
        queryClient.invalidateQueries({ queryKey: ["application-stats"] });
        queryClient.invalidateQueries({ queryKey: ["queue-status"] });
      });

      es.onerror = () => {
        // Close and reconnect after a short delay
        es.close();
        esRef.current = null;
        if (!cancelled) {
          setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    // Re-connect when the token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (session && !cancelled) {
        connect();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [queryClient]);
}

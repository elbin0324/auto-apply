import { AnimatePresence, motion } from "motion/react";
import { useToastStore } from "@/stores/toast-store";
import { router } from "@/router";
import { Check, X } from "@/icons";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed right-5 top-5 z-[300] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isSuccess = toast.variant === "success";
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-elevated"
              style={{
                background: isSuccess ? "var(--ok-bg)" : "var(--fail-bg)",
                borderColor: isSuccess ? "var(--ok-border)" : "var(--fail-border)",
                minWidth: 280,
                maxWidth: 400,
              }}
            >
              <span className="shrink-0">
                {isSuccess ? (
                  <Check size={14} color="var(--color-ok)" />
                ) : (
                  <X size={14} color="var(--color-fail)" />
                )}
              </span>
              <span
                className="flex-1 font-mono text-[11px]"
                style={{ color: isSuccess ? "var(--color-ok-dim)" : "var(--color-fail-dim)" }}
              >
                {toast.message}
              </span>
              {toast.action && (
                <button
                  onClick={() => {
                    removeToast(toast.id);
                    router.navigate({ to: toast.action!.href });
                  }}
                  className="shrink-0 cursor-pointer rounded border border-current px-2 py-0.5 font-mono text-[10px] font-semibold transition-opacity hover:opacity-80"
                  style={{ color: isSuccess ? "var(--color-ok-dim)" : "var(--color-fail-dim)" }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-bg-muted"
              >
                <X size={12} className="text-t-400" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

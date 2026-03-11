import { useToastStore } from "@/stores/toast-store";
import { Check, X } from "@/icons";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-5 top-5 z-[300] flex flex-col gap-2">
      {toasts.map((toast) => {
        const isSuccess = toast.variant === "success";
        return (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-elevated animate-in fade-in slide-in-from-right-5"
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
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-bg-muted"
            >
              <X size={12} className="text-t-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

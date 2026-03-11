import { cn } from "@/theme/utils";

type ButtonVariant = "primary" | "ghost" | "outline" | "success" | "danger";

interface ButtonProps {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-pri text-bg-deep border-transparent hover:brightness-110",
  ghost: "bg-transparent text-t-700 border-border-main hover:bg-bg-inset",
  outline: "bg-transparent text-t-500 border border-border-main hover:border-pri hover:text-pri",
  success: "",
  danger: "",
};

export function Button({
  variant = "primary",
  icon,
  children,
  onClick,
  disabled,
  loading,
  className,
  style,
  type = "button",
}: ButtonProps) {
  const isInline = variant === "success" || variant === "danger";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-[18px] py-[9px] font-mono text-[11px] font-semibold uppercase tracking-[0.03em] transition-all",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !isInline && VARIANT_CLASSES[variant],
        isInline && "border",
        className,
      )}
      style={{
        ...style,
        ...(variant === "success"
          ? {
              background: "var(--ok-bg)",
              color: "var(--color-ok-dim)",
              borderColor: "var(--ok-border)",
            }
          : {}),
        ...(variant === "danger"
          ? {
              background: "var(--fail-bg)",
              color: "var(--color-fail-dim)",
              borderColor: "var(--fail-border)",
            }
          : {}),
      }}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

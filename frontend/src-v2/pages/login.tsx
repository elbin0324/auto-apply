import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user?.onboarding_completed) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-body p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-xl font-bold tracking-wide text-t-900">
            APPLY<span className="text-pri">PILOT</span>
          </h1>
          <p className="mt-2 font-mono text-xs tracking-widest uppercase text-t-500">
            Sign in to continue
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border-main bg-bg-card p-6 shadow-card">
          {error && (
            <div
              className="mb-4 rounded-[var(--radius)] px-3 py-2 font-mono text-xs text-fail"
              style={{ background: "var(--fail-bg)", border: "1px solid var(--fail-border)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-semibold tracking-[.06em] uppercase text-t-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full rounded-[var(--radius)] border border-border-main bg-bg-inset px-3 py-2",
                  "font-sans text-[13px] text-t-900 placeholder:text-t-400",
                  "outline-none transition-colors focus:border-pri",
                )}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-semibold tracking-[.06em] uppercase text-t-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(
                  "w-full rounded-[var(--radius)] border border-border-main bg-bg-inset px-3 py-2",
                  "font-sans text-[13px] text-t-900 placeholder:text-t-400",
                  "outline-none transition-colors focus:border-pri",
                )}
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full rounded-[var(--radius)] bg-pri px-4 py-2.5",
                "font-mono text-[11px] font-semibold tracking-[.03em] uppercase text-bg-deep",
                "transition-opacity hover:opacity-90 disabled:opacity-50",
              )}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-main" />
            <span className="font-mono text-[9px] tracking-widest uppercase text-t-400">or</span>
            <div className="h-px flex-1 bg-border-main" />
          </div>

          <button
            onClick={handleGoogle}
            className={cn(
              "w-full rounded-[var(--radius)] border border-border-main bg-bg-inset px-4 py-2.5",
              "font-mono text-[11px] font-semibold tracking-[.03em] uppercase text-t-700",
              "transition-colors hover:border-pri",
            )}
          >
            Sign in with Google
          </button>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] text-t-500">
          No account?{" "}
          <Link to="/signup" className="text-pri hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

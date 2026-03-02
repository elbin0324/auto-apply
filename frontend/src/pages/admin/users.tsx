import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers } from "@/hooks/use-admin";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 50;

  const { data, isLoading } = useAdminUsers({
    page,
    per_page: perPage,
    search: search || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {data ? `${data.total} users total` : "Loading..."}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-border-subtle bg-bg-card py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Role
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">
                Apps
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">
                Applied
              </th>
              <th className="px-4 py-3 text-center font-medium text-text-secondary">
                Auto-Apply
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle last:border-0">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No users found
                </td>
              </tr>
            ) : (
              data?.users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-bg-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {user.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        user.role === "admin" ? "default" : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">
                    {user.application_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">
                    {user.applied_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.auto_apply_active ? (
                      <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border-0">
                        Active
                      </Badge>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

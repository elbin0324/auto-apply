// Railway Function (Bun v1.3 runtime)
//
// Scheduled: 0 6 * * * (daily at 6 AM UTC)
// Calls POST /api/internal/scheduler/fetch to enqueue
// fetch tasks for all active auto-apply users.
//
// Env vars: API_URL, INTERNAL_API_KEY
// Deploy: railway functions push --path ./functions/fetch-cron/index.tsx

const apiUrl = process.env.API_URL;
const apiKey = process.env.INTERNAL_API_KEY;

if (!apiUrl || !apiKey) {
  console.error("Missing API_URL or INTERNAL_API_KEY env vars");
  process.exit(1);
}

const res = await fetch(`${apiUrl}/api/internal/scheduler/fetch`, {
  method: "POST",
  headers: {
    "X-Internal-API-Key": apiKey,
    "Content-Type": "application/json",
  },
});

const body = await res.json();

if (!res.ok) {
  console.error("Fetch cron failed:", res.status, body);
  process.exit(1);
}

console.log("Fetch cron success:", body);

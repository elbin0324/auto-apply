import { supabase } from "./supabase";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    if (response.status === 401) {
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
            ...options.headers,
          },
        });
        if (retryResponse.ok) {
          if (retryResponse.status === 204) return undefined as T;
          return retryResponse.json() as Promise<T>;
        }
      }
    }

    throw new ApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as Record<string, unknown> | undefined;
    if (body && typeof body.detail === "string") return body.detail;
    if (error.status >= 500) return "Something went wrong. Please try again.";
    return error.message;
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Connection lost. Check your internet.";
  }
  return "An unexpected error occurred.";
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body != null ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body != null ? JSON.stringify(body) : undefined,
    });
  },

  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { ...authHeaders },
      body: formData,
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      throw new ApiError(response.status, response.statusText, body);
    }

    return response.json() as Promise<T>;
  },
};

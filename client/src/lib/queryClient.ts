import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Supports two calling conventions:
//   apiRequest(url, options?)
//   apiRequest(method, url, body?)  ← legacy pattern used throughout the codebase
export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions?: string | { method?: string; body?: unknown | FormData; headers?: Record<string, string> },
  bodyArg?: unknown
): Promise<Response> {
  let resolvedUrl: string;
  let resolvedMethod: string;
  let resolvedBody: unknown | FormData | undefined;
  let resolvedHeaders: Record<string, string> | undefined;

  const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
  if (HTTP_METHODS.includes(methodOrUrl.toUpperCase()) && typeof urlOrOptions === "string") {
    // Legacy: apiRequest("POST", "/api/foo", body)
    resolvedMethod = methodOrUrl.toUpperCase();
    resolvedUrl = urlOrOptions;
    resolvedBody = bodyArg;
  } else {
    // Modern: apiRequest("/api/foo", { method, body, headers })
    resolvedUrl = methodOrUrl;
    const opts = urlOrOptions as { method?: string; body?: unknown | FormData; headers?: Record<string, string> } | undefined;
    resolvedMethod = opts?.method?.toUpperCase() ?? "GET";
    resolvedBody = opts?.body;
    resolvedHeaders = opts?.headers;
  }

  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = { ...resolvedHeaders };

  if (resolvedBody && !(resolvedBody instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(resolvedUrl, {
    method: resolvedMethod,
    headers,
    body: resolvedBody instanceof FormData
      ? resolvedBody
      : resolvedBody
        ? JSON.stringify(resolvedBody)
        : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

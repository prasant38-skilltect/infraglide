import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authentication headers if available
  const token = localStorage.getItem("auth_token");
  const sessionId = localStorage.getItem("session_id");

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  if (sessionId) {
    defaultHeaders["X-Session-Id"] = sessionId;
  }

  const res = await fetch(url, {
    // ...options,
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body ? options.body : undefined,
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
    const defaultHeaders: Record<string, string> = {};

    // Add authentication headers if available
    const token = localStorage.getItem("auth_token");
    const sessionId = localStorage.getItem("session_id");

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    if (sessionId) {
      defaultHeaders["X-Session-Id"] = sessionId;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers: defaultHeaders,
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

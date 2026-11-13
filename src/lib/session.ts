import type { Role } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const KEY = "carawin:session";

export interface Session { accessToken: string; user: { id: string; name: string; email: string; role: "STUDENT" | "PARENT" | "ADMIN" } }

export const roleOf = (s: Session) => s.user.role.toLowerCase() as Role;

/** POSTs to the API; throws an Error carrying the server's message. */
async function post(path: string, body?: unknown) {
  let res: Response;
  try {
    res = await fetch(API + path, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Can't reach the server. Is the backend running on port 4000?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.details?.[0]?.message ?? data?.error?.message ?? "Something went wrong. Please try again.");
  return data;
}

// shortcut: the session (15-min access token) lives in localStorage and only gates the UI; the API checks every request itself. Add /auth/refresh once pages call the API.
export function getSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}

/** Signs in, or creates an account when `register` is given. */
export async function signIn(email: string, password: string, register?: { name: string; role: "STUDENT" | "PARENT" }): Promise<Session> {
  const s: Session = await post(register ? "/auth/register" : "/auth/login", { email, password, ...register });
  localStorage.setItem(KEY, JSON.stringify({ accessToken: s.accessToken, user: s.user }));
  return s;
}

export async function signOut() {
  localStorage.removeItem(KEY);
  await post("/auth/logout").catch(() => {}); // clears the refresh cookie; signed out locally either way
}

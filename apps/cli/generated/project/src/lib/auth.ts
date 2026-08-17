export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("aegis_token") || "demo_session_token";
  }
  return "demo_session_token";
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem("aegis_token", token);
}

export function removeToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem("aegis_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export default { getToken, setToken, removeToken, isAuthenticated };

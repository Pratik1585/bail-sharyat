// utils/auth.js

export function saveAuth(data) {
  localStorage.setItem("bail_auth", JSON.stringify(data));
}

export function getAuth() {
  const raw = localStorage.getItem("bail_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("bail_auth");
}

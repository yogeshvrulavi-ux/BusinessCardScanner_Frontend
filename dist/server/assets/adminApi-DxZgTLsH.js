import { c as apiFetch, d as API_BASE_URL } from "./router-BZi1TmQF.js";
async function apiJson(url, init) {
  const res = await apiFetch(`${API_BASE_URL}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json();
}
async function fetchCompanies(page = 1, limit = 50) {
  return apiJson(`/api/companies?page=${page}&limit=${limit}`);
}
async function createCompany(data) {
  return apiJson(
    "/api/companies",
    { method: "POST", body: JSON.stringify(data) }
  );
}
async function deleteCompany(id) {
  return apiJson(`/api/companies/${id}`, {
    method: "DELETE"
  });
}
async function fetchUsers(page = 1, limit = 50) {
  return apiJson(`/api/users?page=${page}&limit=${limit}`);
}
async function createUser(data) {
  return apiJson("/api/users", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
async function updateUser(id, data) {
  return apiJson(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}
async function deleteUser(id) {
  return apiJson(`/api/users/${id}`, {
    method: "DELETE"
  });
}
async function updateUserStatus(id, is_active) {
  return apiJson(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active })
  });
}
async function adminResetPassword(id, new_password) {
  return apiJson(`/api/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password })
  });
}
export {
  adminResetPassword as a,
  fetchUsers as b,
  createUser as c,
  updateUserStatus as d,
  deleteUser as e,
  fetchCompanies as f,
  createCompany as g,
  deleteCompany as h,
  updateUser as u
};

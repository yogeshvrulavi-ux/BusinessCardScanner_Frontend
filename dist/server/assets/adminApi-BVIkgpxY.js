import { d as API_BASE_URL, c as apiFetch } from "./router-CTqOT-Nn.js";
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
async function deleteCompany(id) {
  return apiJson(`/api/companies/${id}`, {
    method: "DELETE"
  });
}
async function fetchUsers(page = 1, limit = 50) {
  return apiJson(`/api/users?page=${page}&limit=${limit}`);
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
async function fetchInvitations(status) {
  const qs = "";
  return apiJson(`/api/invitations${qs}`);
}
async function sendInvitation(data) {
  return apiJson("/api/invitations", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
async function resendInvitation(id) {
  return apiJson(`/api/invitations/${id}/resend`, {
    method: "POST"
  });
}
async function revokeInvitation(id) {
  return apiJson(`/api/invitations/${id}/revoke`, {
    method: "POST"
  });
}
async function validateInvitationToken(token) {
  const res = await fetch(`${API_BASE_URL}/api/invitations/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json();
}
async function acceptInvitation(data) {
  const res = await fetch(`${API_BASE_URL}/api/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json();
}
export {
  adminResetPassword as a,
  updateUserStatus as b,
  acceptInvitation as c,
  deleteUser as d,
  fetchInvitations as e,
  fetchUsers as f,
  revokeInvitation as g,
  fetchCompanies as h,
  deleteCompany as i,
  resendInvitation as r,
  sendInvitation as s,
  updateUser as u,
  validateInvitationToken as v
};

/**
 * Admin API client — typed wrappers around backend company and user management endpoints.
 * All calls use apiFetch which auto-attaches the JWT and handles 401 refresh.
 */

import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Company = {
  id: string;
  company_name: string;
  company_code: string;
  admin_id: string | null;
  admin_name?: string;
  admin_email?: string;
  admin_username?: string;
  user_count?: number;
  address: string;
  phone: string;
  email: string;
  website: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  company_id: string | null;
  admin_id: string | null;
  company_name?: string;
  admin_name?: string;
  admin_email?: string;
  user_count?: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  role: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type CreateCompanyData = {
  company_name: string;
  company_code: string;
  admin_email: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
};

export type UpdateCompanyData = {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status?: string;
};

export type InviteUserData = {
  email: string;
  role: "ADMIN" | "USER";
  company_id?: string | null;
  company_name?: string;
  company_code?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: string;
  company_id: string | null;
  company_name: string;
  company_code: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  invited_by: string;
  status: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  inviter_name?: string;
};

export type UpdateUserData = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Companies                                                          */
/* ------------------------------------------------------------------ */

export async function fetchCompanies(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Company>> {
  return apiJson(`/api/companies?page=${page}&limit=${limit}`);
}

export async function createCompany(data: CreateCompanyData) {
  return apiJson<{
    success: boolean;
    detail: string;
    invitation: Invitation;
    company: { company_name: string; company_code: string; pending: boolean };
  }>("/api/companies", { method: "POST", body: JSON.stringify(data) });
}

export async function updateCompany(id: string, data: UpdateCompanyData) {
  return apiJson<{ success: boolean; message: string }>(`/api/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCompany(id: string) {
  return apiJson<{ success: boolean; message: string }>(`/api/companies/${id}`, {
    method: "DELETE",
  });
}

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

export async function fetchUsers(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<User>> {
  return apiJson(`/api/users?page=${page}&limit=${limit}`);
}

export async function updateUser(id: string, data: UpdateUserData) {
  return apiJson<{ success: boolean; message: string }>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  return apiJson<{ success: boolean; message: string }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export async function updateUserStatus(id: string, is_active: boolean) {
  return apiJson<{ success: boolean; is_active: boolean }>(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

export async function adminResetPassword(id: string, new_password: string) {
  return apiJson<{ success: boolean; message: string }>(`/api/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password }),
  });
}

/* ------------------------------------------------------------------ */
/*  Invitations                                                        */
/* ------------------------------------------------------------------ */

export async function fetchInvitations(status?: string, page = 1, limit = 10) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return apiJson<{ items: Invitation[]; total: number; page: number; limit: number }>(
    `/api/invitations?${params.toString()}`,
  );
}

export async function sendInvitation(data: InviteUserData) {
  return apiJson<Invitation>("/api/invitations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resendInvitation(id: string) {
  return apiJson<{ success: boolean; detail: string }>(`/api/invitations/${id}/resend`, {
    method: "POST",
  });
}

export async function revokeInvitation(id: string) {
  return apiJson<{ success: boolean; detail: string }>(`/api/invitations/${id}/revoke`, {
    method: "POST",
  });
}

export async function validateInvitationToken(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/invitations/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<{
    valid: boolean;
    email: string;
    role: string;
    company_id: string | null;
    company_name: string;
    company_code: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    needs_company: boolean;
    expires_at: string;
  }>;
}

export async function acceptInvitation(data: {
  token: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  password: string;
  confirm_password: string;
  phone?: string;
  username?: string;
  company_name?: string;
  company_code?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<{
    success: boolean;
    detail: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      username: string;
      role: string;
      company_id: string | null;
      company_name: string;
    };
  }>;
}

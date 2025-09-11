/* eslint-disable @typescript-eslint/no-explicit-any */

import axios, { AxiosError, AxiosInstance } from "axios";
import { clearMemoryTokens, getMemoryTokens, setMemoryTokens } from "./tokenMemory";
import { Note, UserProfile } from "../../types";

export function createApiClient(): AxiosInstance {
  const api = axios.create({
    baseURL: "",
    withCredentials: true,
  });

  let isRefreshing = false;
  let pendingQueue: Array<{
    resolve: () => void;
    reject: (err: unknown) => void;
  }> = [];

  const processQueue = (error: unknown) => {
    pendingQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve();
    });
    pendingQueue = [];
  };

  api.interceptors.request.use((config) => {
    const { accessToken } = getMemoryTokens();
    if (accessToken) {
      config.headers = config.headers ?? {};
      (config.headers as any)["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const originalRequest: any = error.config ?? {};
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push({
              resolve: () => resolve(api(originalRequest)),
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        try {
          await refreshTokens();
          processQueue(null);
          return api(originalRequest);
        } catch (refreshErr) {
          const { refreshToken } = getMemoryTokens();
          if (refreshToken) {
            try {
              const tokens = await refreshTokensWithBearer(refreshToken);
              setMemoryTokens(tokens);
              processQueue(null);
              return api(originalRequest);
            } catch (e) {
              processQueue(e);
            }
          } else {
            processQueue(refreshErr);
          }
          clearMemoryTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
  );

  async function refreshTokens(): Promise<void> {
    await api.post(`/auth/refresh`, {});
  }

  async function refreshTokensWithBearer(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await api.post(
      `/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    return res.data as { accessToken: string; refreshToken: string };
  }

  return api;
}

export const api = createApiClient();


export function beginGoogleLogin(): void {
  if (typeof window === "undefined") return;
  window.location.href = "/auth/google";
}

export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  const maybeTokens = res.data as any;
  if (maybeTokens?.accessToken || maybeTokens?.refreshToken) {
    setMemoryTokens({
      accessToken: maybeTokens.accessToken ?? null,
      refreshToken: maybeTokens.refreshToken ?? null,
    });
  }
  return res.data;
}

export async function signup(email: string, password: string) {
  const res = await api.post("/auth/signup", { email, password });
  const maybeTokens = res.data as any;
  if (maybeTokens?.accessToken || maybeTokens?.refreshToken) {
    setMemoryTokens({
      accessToken: maybeTokens.accessToken ?? null,
      refreshToken: maybeTokens.refreshToken ?? null,
    });
  }
  return res.data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearMemoryTokens();
  }
}

export async function getMe() {
  const res = await api.get(`/auth/me`);
  return res.data as UserProfile;
}

export async function deleteAccount() {
  const res = await api.delete(`/user/me`);
  clearMemoryTokens();
  return res.data as { success: boolean };
}



export async function getNoteById(id: string) {
  const res = await api.get(`/note/${id}`);
  return res.data as Note;
} 

export async function getNotesByUserId(userId: string, q?: string) {
  const res = await api.get(`/note/user/${userId}`,{ params: q ? { q } : undefined });
  return res.data as Note[];
}

export async function createNote(initialJson: any, title?: string) {
  const res = await api.post(`/note`, { json: initialJson, title });
  return res.data as Note;
}

export async function updateNote(
  id: string,
  payload: { json?: any; title?: string }
) {
  const res = await api.put(`/note/${id}`, payload);
  return res.data as Note | null;
}

export async function deleteNote(id: string) {
  const res = await api.delete(`/note/${id}`);
  return res.data as { success: boolean };
}



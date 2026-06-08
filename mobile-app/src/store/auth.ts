import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, setAuthToken } from "@/api/client";

export interface User {
  id: string;
  email: string;
  role: "PATIENT" | "NURSE" | "ADMIN";
  firstName: string;
  lastName: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role: "PATIENT" | "NURSE" }) => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const KEY = "auth";

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: true,

  bootstrap: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const { token, user } = JSON.parse(raw);
        setAuthToken(token);
        set({ token, user });
      }
    } catch {}
    set({ loading: false });
  },

  setSession: async (token, user) => {
    setAuthToken(token);
    await SecureStore.setItemAsync(KEY, JSON.stringify({ token, user }));
    set({ token, user });
  },

  login: async (email, password) => {
    const res = await api("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
    await useAuth.getState().setSession(res.data.token, res.data.user);
  },

  register: async (data) => {
    const res = await api("/api/auth/register", { method: "POST", body: data, auth: false });
    await useAuth.getState().setSession(res.data.token, res.data.user);
  },

  logout: async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync(KEY);
    set({ token: null, user: null });
  },
}));

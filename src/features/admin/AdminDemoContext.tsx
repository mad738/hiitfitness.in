"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const STORAGE_KEY = "hiit-admin-demo";

type AdminDemoContextValue = {
  useDemo: boolean;
  setUseDemo: (value: boolean) => void;
};

const AdminDemoContext = createContext<AdminDemoContextValue | null>(null);

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

function writeStored(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
}

export function AdminDemoProvider({ children }: { children: React.ReactNode }) {
  const [useDemo, setUseDemoState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUseDemoState(readStored());
    setMounted(true);
  }, []);

  const setUseDemo = useCallback((value: boolean) => {
    setUseDemoState(value);
    writeStored(value);
  }, []);

  const value: AdminDemoContextValue = mounted
    ? { useDemo, setUseDemo }
    : { useDemo: false, setUseDemo };

  return (
    <AdminDemoContext.Provider value={value}>
      {children}
    </AdminDemoContext.Provider>
  );
}

export function useDemoMode(): boolean {
  const ctx = useContext(AdminDemoContext);
  return ctx?.useDemo ?? false;
}

export function useSetDemoMode(): (value: boolean) => void {
  const ctx = useContext(AdminDemoContext);
  return ctx?.setUseDemo ?? (() => {});
}

export function useAdminDemo(): AdminDemoContextValue {
  const ctx = useContext(AdminDemoContext);
  if (!ctx) {
    return {
      useDemo: false,
      setUseDemo: () => {},
    };
  }
  return ctx;
}

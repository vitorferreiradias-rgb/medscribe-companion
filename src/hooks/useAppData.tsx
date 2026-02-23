import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AppData } from "@/types";
import { initStore, getData, subscribe } from "@/lib/store";

const AppDataContext = createContext<AppData | null>(null);
const AppDataRefreshContext = createContext<() => void>(() => {});

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => initStore());

  useEffect(() => {
    return subscribe(() => setData({ ...getData() }));
  }, []);

  const refresh = useCallback(() => setData({ ...getData() }), []);

  return (
    <AppDataContext.Provider value={data}>
      <AppDataRefreshContext.Provider value={refresh}>
        {children}
      </AppDataRefreshContext.Provider>
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    // Fallback for HMR or context mismatches
    return getData();
  }
  return ctx;
}

export function useRefreshData() {
  return useContext(AppDataRefreshContext);
}

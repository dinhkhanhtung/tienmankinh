import { create } from "zustand";
import { DailyLog, PeriodCycle } from "@/types";

interface LogState {
  cycles: PeriodCycle[];
  dailyLogs: Record<string, DailyLog>; // format key: YYYY-MM-DD
  loadingLogs: boolean;
  setCycles: (cycles: PeriodCycle[]) => void;
  addCycle: (cycle: PeriodCycle) => void;
  updateCycle: (cycleId: string, updates: Partial<PeriodCycle>) => void;
  setDailyLogs: (logs: DailyLog[]) => void;
  setDailyLog: (date: string, log: DailyLog) => void;
  setLoadingLogs: (loading: boolean) => void;
}

export const useLogStore = create<LogState>((set) => ({
  cycles: [],
  dailyLogs: {},
  loadingLogs: false,
  setCycles: (cycles) => set({ cycles }),
  addCycle: (cycle) => set((state) => ({ cycles: [cycle, ...state.cycles] })),
  updateCycle: (cycleId, updates) => set((state) => ({
    cycles: state.cycles.map((c) => c.id === cycleId ? { ...c, ...updates } : c)
  })),
  setDailyLogs: (logs) => set((state) => {
    const logsMap = { ...state.dailyLogs };
    logs.forEach((log) => {
      logsMap[log.date] = log;
    });
    return { dailyLogs: logsMap };
  }),
  setDailyLog: (date, log) => set((state) => ({
    dailyLogs: {
      ...state.dailyLogs,
      [date]: log
    }
  })),
  setLoadingLogs: (loading) => set({ loadingLogs: loading }),
}));

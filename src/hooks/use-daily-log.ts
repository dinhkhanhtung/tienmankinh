"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useLogStore } from "@/store/use-log-store";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { DailyLog, SymptomCategory, SleepData, MoodData } from "@/types";
import { toast } from "sonner";

// Trạng thái log rỗng mặc định
export const DEFAULT_SYMPTOMS: SymptomCategory = {
  hotFlashes: 0,
  nightSweats: 0,
  palpitations: 0,
  insomnia: 0,
  anxiety: 0,
  irritability: 0,
  depression: 0,
  jointPain: 0,
  fatigue: 0,
  weightGain: 0,
  drySkin: 0,
  vaginalDryness: 0,
  lowLibido: 0,
};

export const DEFAULT_SLEEP: SleepData = {
  bedTime: "22:00",
  wakeTime: "06:00",
  awakenings: 0,
  quality: 7,
  totalDuration: 480, // 8 tiếng
};

export const DEFAULT_MOOD: MoodData = {
  level: "neutral",
  note: "",
};

export function useDailyLog() {
  const { user } = useAuthStore();
  const { dailyLogs, setDailyLog } = useLogStore();
  const [loading, setLoading] = useState(false);

  // 1. Tính toán PeriScore dựa trên trọng số triệu chứng
  const calculatePeriScore = (symptoms: SymptomCategory): number => {
    // Trọng số hệ số 2: Bốc hỏa (hotFlashes) và Mất ngủ (insomnia)
    // Các triệu chứng khác hệ số 1
    let rawScore = 0;
    
    // Hệ số 2
    rawScore += symptoms.hotFlashes * 2;
    rawScore += symptoms.insomnia * 2;

    // Hệ số 1 cho các triệu chứng còn lại
    rawScore += symptoms.nightSweats;
    rawScore += symptoms.palpitations;
    rawScore += symptoms.anxiety;
    rawScore += symptoms.irritability;
    rawScore += symptoms.depression;
    rawScore += symptoms.jointPain;
    rawScore += symptoms.fatigue;
    rawScore += symptoms.weightGain;
    rawScore += symptoms.drySkin;
    rawScore += symptoms.vaginalDryness;
    rawScore += symptoms.lowLibido;

    // Tổng điểm thô tối đa: (3 * 2 * 2) + (3 * 11) = 12 + 33 = 45 điểm
    // Quy đổi về thang điểm 100
    const maxRawScore = 45;
    return Math.round((rawScore / maxRawScore) * 100);
  };

  // Phân loại PeriScore
  const getPeriScoreCategory = (score: number) => {
    if (score <= 30) return { label: "Nguy cơ thấp", color: "text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200" };
    if (score <= 60) return { label: "Trung bình", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200" };
    return { label: "Cao", color: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 animate-pulse" };
  };

  // 2. Tính toán tổng thời lượng ngủ từ giờ đi ngủ và thức dậy (phút)
  const calculateSleepDuration = (bedTime: string, wakeTime: string): number => {
    if (!bedTime || !wakeTime) return 0;
    
    const [bedH, bedM] = bedTime.split(":").map(Number);
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);
    
    let bedDate = new Date(2020, 0, 1, bedH, bedM);
    let wakeDate = new Date(2020, 0, 1, wakeH, wakeM);
    
    // Nếu giờ thức dậy nhỏ hơn giờ đi ngủ, tức là đã ngủ qua ngày hôm sau
    if (wakeDate < bedDate) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
    
    const diffMs = wakeDate.getTime() - bedDate.getTime();
    return Math.round(diffMs / (1000 * 60)); // phút
  };

  // 3. Lấy log của ngày cụ thể (từ cache local store hoặc trả về mặc định)
  const getLogForDate = useCallback((date: string): DailyLog => {
    const existingLog = dailyLogs[date];
    if (existingLog) return existingLog;

    // Trả về log trống mặc định nếu chưa ghi log cho ngày này
    return {
      id: date,
      userId: user?.uid || "",
      date,
      symptoms: { ...DEFAULT_SYMPTOMS },
      sleep: { ...DEFAULT_SLEEP },
      mood: { ...DEFAULT_MOOD },
      periScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [dailyLogs, user]);

  // 4. Lưu log vào Firestore và Zustand cache
  const saveLog = useCallback(async (
    date: string, 
    symptoms: SymptomCategory, 
    sleep: SleepData, 
    mood: MoodData
  ) => {
    if (!user) return;
    setLoading(true);

    try {
      const calculatedDuration = calculateSleepDuration(sleep.bedTime, sleep.wakeTime);
      const sleepDataWithDuration = {
        ...sleep,
        totalDuration: calculatedDuration
      };

      const periScore = calculatePeriScore(symptoms);

      const logId = `${user.uid}_${date}`;

      const finalLog: DailyLog = {
        id: logId,
        userId: user.uid,
        date,
        symptoms,
        sleep: sleepDataWithDuration,
        mood,
        periScore,
        createdAt: dailyLogs[date]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Lưu trữ trong Firestore daily_logs/{userId}_{date}
      await setDoc(doc(db, "daily_logs", logId), finalLog);
      
      // Cache vào Zustand store
      setDailyLog(date, finalLog);
      
      toast.success(`Đã lưu nhật ký sức khỏe ngày ${date}.`);
    } catch (error) {
      console.error("Lỗi lưu nhật ký: ", error);
      toast.error("Không thể lưu nhật ký sức khỏe. Vui lòng thử lại.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, dailyLogs, setDailyLog]);

  return {
    loading,
    getLogForDate,
    saveLog,
    calculateSleepDuration,
    getPeriScoreCategory,
  };
}

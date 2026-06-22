"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useLogStore } from "@/store/use-log-store";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { PeriodCycle } from "@/types";
import { toast } from "sonner";

export function useCycles() {
  const { user } = useAuthStore();
  const { cycles, addCycle: storeAddCycle, updateCycle: storeUpdateCycle, setCycles } = useLogStore();
  const [loading, setLoading] = useState(false);

  // Sắp xếp chu kỳ từ mới nhất đến cũ nhất
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // 1. Tính toán chu kỳ trung bình (số ngày giữa các ngày bắt đầu liên tiếp)
  const calculateAverageCycleLength = (): number => {
    if (sortedCycles.length < 2) return 28; // Mặc định nếu chưa đủ dữ liệu

    let totalDays = 0;
    let count = 0;

    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const currentStart = new Date(sortedCycles[i].startDate);
      const nextStart = new Date(sortedCycles[i + 1].startDate);
      const diffTime = currentStart.getTime() - nextStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      // Chỉ tính các chu kỳ hợp lệ thực tế (ví dụ từ 15 đến 90 ngày) để tránh nhiễu dữ liệu lỗi
      if (diffDays >= 15 && diffDays <= 90) {
        totalDays += diffDays;
        count++;
      }
    }

    return count > 0 ? Math.round(totalDays / count) : 28;
  };

  // 2. Tính toán số ngày hành kinh trung bình (hiệu số ngày kết thúc - ngày bắt đầu)
  const calculateAveragePeriodDuration = (): number => {
    const validDurations = sortedCycles
      .map((c) => {
        if (!c.startDate || !c.endDate) return null;
        const diffTime = new Date(c.endDate).getTime() - new Date(c.startDate).getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // Tính cả ngày bắt đầu và kết thúc
      })
      .filter((d): d is number => d !== null && d > 0 && d < 15);

    if (validDurations.length === 0) return 5; // Mặc định 5 ngày
    const sum = validDurations.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / validDurations.length);
  };

  const averageCycleLength = calculateAverageCycleLength();
  const averagePeriodDuration = calculateAveragePeriodDuration();

  // 3. Dự đoán ngày bắt đầu hành kinh tiếp theo
  const predictNextPeriodDate = (): Date | null => {
    if (sortedCycles.length === 0) return null;
    const latestCycle = sortedCycles[0];
    const latestStart = new Date(latestCycle.startDate);
    
    // Cộng thêm số ngày của chu kỳ trung bình
    const nextStart = new Date(latestStart);
    nextStart.setDate(latestStart.getDate() + averageCycleLength);
    return nextStart;
  };

  const nextPeriodDate = predictNextPeriodDate();

  // 4. Kiểm tra xem một chu kỳ có bất thường không
  const checkIsAbnormal = (cycle: PeriodCycle, previousCycle?: PeriodCycle): boolean => {
    if (!cycle.endDate) return false;

    const diffTime = new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime();
    const duration = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Thời gian hành kinh bất thường (quá ngắn < 2 ngày hoặc quá dài > 8 ngày)
    if (duration < 2 || duration > 8) return true;

    if (previousCycle) {
      const currentStart = new Date(cycle.startDate);
      const prevStart = new Date(previousCycle.startDate);
      const length = Math.round((currentStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Khoảng cách chu kỳ bất thường (quá ngắn < 21 ngày hoặc quá dài > 35 ngày)
      if (length < 21 || length > 35) return true;
    }
    
    return false;
  };

  // 5. Thêm một chu kỳ kinh nguyệt mới
  const addPeriod = async (startDate: string, notes?: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const cycleId = `cycle_${Date.now()}`;
      
      // Tìm chu kỳ gần nhất trước đó để tính cycleLength
      let calculatedLength = null;
      if (sortedCycles.length > 0) {
        const latestStart = new Date(sortedCycles[0].startDate);
        const currentStart = new Date(startDate);
        calculatedLength = Math.round((currentStart.getTime() - latestStart.getTime()) / (1000 * 60 * 60 * 24));
      }

      const newCycle: PeriodCycle = {
        id: cycleId,
        userId: user.uid,
        startDate,
        endDate: null,
        duration: null,
        cycleLength: calculatedLength,
        isAbnormal: calculatedLength !== null ? (calculatedLength < 21 || calculatedLength > 35) : false,
        notes: notes || "",
      };

      await setDoc(doc(db, "cycles", cycleId), newCycle);
      storeAddCycle(newCycle);
      toast.success("Đã ghi nhận ngày bắt đầu chu kỳ mới.");
    } catch (error) {
      console.error("Lỗi thêm chu kỳ: ", error);
      toast.error("Không thể ghi nhận chu kỳ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Cập nhật chu kỳ (ví dụ: đánh dấu ngày kết thúc)
  const updatePeriod = async (cycleId: string, endDate: string, notes?: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const cycle = cycles.find((c) => c.id === cycleId);
      if (!cycle) throw new Error("Không tìm thấy chu kỳ.");

      const start = new Date(cycle.startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        toast.error("Ngày kết thúc không thể trước ngày bắt đầu.");
        setLoading(false);
        return;
      }

      const calculatedDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Kiểm tra bất thường
      const isDurationAbnormal = calculatedDuration < 2 || calculatedDuration > 8;
      const isLengthAbnormal = cycle.cycleLength !== null ? (cycle.cycleLength < 21 || cycle.cycleLength > 35) : false;
      const isAbnormal = isDurationAbnormal || isLengthAbnormal;

      const updates: Partial<PeriodCycle> = {
        endDate,
        duration: calculatedDuration,
        isAbnormal,
        notes: notes !== undefined ? notes : cycle.notes,
      };

      await setDoc(doc(db, "cycles", cycleId), { ...cycle, ...updates });
      storeUpdateCycle(cycleId, updates);
      toast.success("Đã cập nhật ngày kết thúc kỳ kinh.");
    } catch (error) {
      console.error("Lỗi cập nhật chu kỳ: ", error);
      toast.error("Không thể cập nhật. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // 7. Xóa chu kỳ
  const deletePeriod = async (cycleId: string) => {
    if (!user) return;
    setLoading(true);

    try {
      await deleteDoc(doc(db, "cycles", cycleId));
      const updated = cycles.filter((c) => c.id !== cycleId);
      setCycles(updated);
      toast.success("Đã xóa chu kỳ kinh nguyệt thành công.");
    } catch (error) {
      console.error("Lỗi xóa chu kỳ: ", error);
      toast.error("Không thể xóa chu kỳ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return {
    sortedCycles,
    averageCycleLength,
    averagePeriodDuration,
    nextPeriodDate,
    loading,
    addPeriod,
    updatePeriod,
    deletePeriod,
  };
}

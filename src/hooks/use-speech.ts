"use client";

import { useState, useEffect, useRef } from "react";

export function useSpeech(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setBrowserSupportsSpeech(true);
        const rec = new SpeechRecognition();
        rec.continuous = false; // Nhận dạng từng câu ngắn
        rec.interimResults = false; // Chỉ trả về kết quả cuối cùng
        rec.lang = "vi-VN"; // Ngôn ngữ tiếng Việt

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (event: any) => {
          console.error("Lỗi Speech Recognition: ", event.error);
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          onTranscript(resultText);
        };

        recognitionRef.current = rec;
      }
    }
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Không thể khởi động ghi âm: ", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Không thể dừng ghi âm: ", err);
      }
    }
  };

  return {
    isListening,
    browserSupportsSpeech,
    startListening,
    stopListening,
  };
}

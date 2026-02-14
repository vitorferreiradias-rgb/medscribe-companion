import { useState, useRef, useCallback, useEffect } from "react";
import { Utterance } from "@/types";

// Extend window for webkit prefix
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognition();
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  onUtterance?: (u: Utterance) => void;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}) {
  const { lang = "pt-BR", onUtterance } = opts;
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startTimeRef = useRef<number>(0);
  const shouldRestartRef = useRef(false);
  const utteranceCountRef = useRef(0);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    setIsListening(false);
    setInterimText("");
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    stop();

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    shouldRestartRef.current = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const tsSec = Math.round((Date.now() - startTimeRef.current) / 1000);
          // Alternate speakers based on utterance count
          const speaker: "medico" | "paciente" = utteranceCountRef.current % 2 === 0 ? "medico" : "paciente";
          utteranceCountRef.current++;
          const u: Utterance = { speaker, text: text.trim(), tsSec };
          setUtterances((prev) => [...prev, u]);
          onUtterance?.(u);
          setInterimText("");
        } else {
          interim += text;
        }
      }
      if (interim) setInterimText(interim);
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" are non-fatal
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("SpeechRecognition error:", event.error);
      stop();
    };

    recognition.onend = () => {
      // Auto-restart if we haven't explicitly stopped
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore if already started
        }
      }
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  }, [lang, stop, onUtterance]);

  const pause = useCallback(() => {
    shouldRestartRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  }, []);

  const resume = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR || !recognitionRef.current) {
      start();
      return;
    }
    shouldRestartRef.current = true;
    try {
      recognitionRef.current.onend = () => {
        if (shouldRestartRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch {}
        }
      };
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      start();
    }
  }, [start]);

  const reset = useCallback(() => {
    stop();
    setUtterances([]);
    utteranceCountRef.current = 0;
    setInterimText("");
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    interimText,
    utterances,
    start,
    stop,
    pause,
    resume,
    reset,
    isSupported: isSpeechRecognitionSupported(),
  };
}

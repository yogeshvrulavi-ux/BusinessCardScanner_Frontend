import { useCallback, useEffect, useRef, useState } from "react";

const NOTES_MAX_LENGTH = 2000;

function createSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function joinDictation(base: string, spoken: string): string {
  const left = base.trimEnd();
  const right = spoken.trimStart();
  if (!left) return right;
  if (!right) return left;
  // Prevent duplicate append when the engine repeats the same final chunk.
  if (left.endsWith(right)) return left;
  if (right.startsWith(left) && right.length > left.length) return right;
  return `${left} ${right}`;
}

function capNotes(text: string): string {
  return text.slice(0, NOTES_MAX_LENGTH);
}

function mapSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "audio-capture":
      return "microphone-unavailable";
    case "network":
      return "network";
    case "aborted":
    case "no-speech":
      return code;
    default:
      return code || "speech-error";
  }
}

async function ensureMicrophonePermission(): Promise<"granted" | "denied" | "unsupported"> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return "granted";
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
      return "denied";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "unsupported";
    }
    return "denied";
  }
}

type UseSpeechToTextOptions = {
  lang?: string;
  maxLength?: number;
  onUnsupported?: () => void;
  onError?: (message: string) => void;
};

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const lang = options.lang ?? "en-IN";
  const maxLength = options.maxLength ?? NOTES_MAX_LENGTH;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const baseTextRef = useRef("");
  const sessionFinalRef = useRef("");
  const lastFinalChunkRef = useRef("");
  const onTextRef = useRef<(text: string) => void>(() => {});
  const startingRef = useRef(false);

  const onUnsupportedRef = useRef(options.onUnsupported);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onUnsupportedRef.current = options.onUnsupported;
    onErrorRef.current = options.onError;
  }, [options.onUnsupported, options.onError]);

  useEffect(() => {
    setSupported(createSpeechRecognition() !== null);
  }, []);

  const publishDisplayText = useCallback((interim = "") => {
    const spoken = joinDictation(sessionFinalRef.current, interim);
    onTextRef.current(capNotes(joinDictation(baseTextRef.current, spoken)).slice(0, maxLength));
  }, [maxLength]);

  const commitSessionToBase = useCallback(() => {
    if (!sessionFinalRef.current.trim()) return;
    baseTextRef.current = capNotes(
      joinDictation(baseTextRef.current, sessionFinalRef.current),
    ).slice(0, maxLength);
    sessionFinalRef.current = "";
    lastFinalChunkRef.current = "";
    onTextRef.current(baseTextRef.current);
  }, [maxLength]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    startingRef.current = false;
    setListening(false);
    commitSessionToBase();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, [commitSessionToBase]);

  const startListening = useCallback(
    async (baseText: string, onText: (text: string) => void) => {
      if (startingRef.current || listeningRef.current) return;
      startingRef.current = true;

      const recognition = createSpeechRecognition();
      if (!recognition) {
        startingRef.current = false;
        onUnsupportedRef.current?.();
        return;
      }

      const permission = await ensureMicrophonePermission();
      if (permission === "denied") {
        startingRef.current = false;
        onErrorRef.current?.("not-allowed");
        return;
      }
      if (permission === "unsupported" && !createSpeechRecognition()) {
        startingRef.current = false;
        onUnsupportedRef.current?.();
        return;
      }

      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }

      recognitionRef.current = recognition;
      baseTextRef.current = baseText;
      sessionFinalRef.current = "";
      lastFinalChunkRef.current = "";
      onTextRef.current = onText;
      listeningRef.current = true;
      setListening(true);
      startingRef.current = false;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      try {
        // Prefer a single alternative to reduce duplicate fragments.
        (recognition as SpeechRecognition & { maxAlternatives?: number }).maxAlternatives = 1;
      } catch {
        /* optional */
      }

      recognition.onresult = (event) => {
        if (!listeningRef.current) return;

        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = (result[0]?.transcript ?? "").trim();
          if (!transcript) continue;

          if (result.isFinal) {
            // Skip exact duplicate finals (common when the engine restarts).
            if (transcript === lastFinalChunkRef.current) continue;
            if (sessionFinalRef.current.endsWith(transcript)) continue;
            lastFinalChunkRef.current = transcript;
            sessionFinalRef.current = joinDictation(sessionFinalRef.current, transcript);
          } else {
            interim = joinDictation(interim, transcript);
          }
        }

        publishDisplayText(interim);
      };

      recognition.onerror = (event) => {
        const mapped = mapSpeechError(event.error);
        if (mapped === "aborted" || mapped === "no-speech") return;
        onErrorRef.current?.(mapped);
        stopListening();
      };

      recognition.onend = () => {
        if (!listeningRef.current) return;
        commitSessionToBase();
        try {
          recognition.start();
        } catch {
          stopListening();
        }
      };

      try {
        recognition.start();
      } catch {
        onErrorRef.current?.("microphone-unavailable");
        stopListening();
      }
    },
    [commitSessionToBase, lang, publishDisplayText, stopListening],
  );

  useEffect(() => () => {
    listeningRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
  }, []);

  const toggleListening = useCallback(
    (baseText: string, onText: (text: string) => void) => {
      if (listeningRef.current) {
        stopListening();
        return;
      }
      void startListening(baseText, onText);
    },
    [startListening, stopListening],
  );

  return {
    listening,
    supported,
    maxLength,
    startListening,
    stopListening,
    toggleListening,
  };
}

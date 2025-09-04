import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  name?: string;
  avatarSrc: string;
  wakeWord?: string;
  apiEndpoint?: string;
  initialGreeting?: string;
};

type Message = { role: "user" | "assistant"; content: string };

export default function OrionAvatar({
  name = "Orion",
  avatarSrc,
  wakeWord = "orion",
  apiEndpoint,
  initialGreeting = "Ready when you are. For the Empire.",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialGreeting },
  ]);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceName, setVoiceName] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const synth = useMemo(() => (typeof window !== "undefined" ? window.speechSynthesis : null), []);

  // TTS
  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => {
      const v = synth.getVoices();
      setVoices(v);
      const preferred = v.find((vv) => /en-GB|en_GB/.test(vv.lang) && /female|fiona|susan|sarah|libby|emily/i.test(vv.name)) || v.find((vv) => /en|gb/i.test(vv.lang));
      if (preferred) setVoiceName(preferred.name);
    };
    loadVoices();
    if (typeof window !== "undefined") {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [synth]);

  const speak = (text: string) => {
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((vv) => vv.name === voiceName);
    if (v) u.voice = v;
    u.rate = 1.02;
    u.pitch = 1.0;
    setSpeaking(true);
    u.onend = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
  };

  // STT
  const recognition = useMemo(() => {
    if (typeof window === "undefined") return null as any;
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "en-GB";
    r.continuous = false;
    r.interimResults = false;
    return r;
  }, []);

  const startListening = () => {
    if (!recognition) return;
    try { setListening(true); recognition.start(); } catch {}
  };
  const stopListening = () => {
    if (!recognition) return;
    try { recognition.stop(); setListening(false); } catch {}
  };

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (e: any) => {
      const transcript = (e.results?.[0]?.[0]?.transcript || "").trim();
      if (wakeWord && !input && !messages.at(-1)?.content?.toLowerCase()?.includes("how can i help")) {
        if (transcript.toLowerCase().includes(wakeWord.toLowerCase())) {
          speak("I'm listening.");
          setMessages((m) => [...m, { role: "assistant", content: "Listening…" }]);
          setListening(false);
          return;
        }
      }
      handleSend(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
  }, [recognition, wakeWord, input, messages]);

  // Chat
  const scrollToBottom = () => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const pushAssistant = (content: string, speakIt = true) => {
    setMessages((m) => [...m, { role: "assistant", content }]);
    if (speakIt) speak(content);
  };

  const runLocalCommands = (text: string): string | null => {
    const q = text.toLowerCase();
    if (q.includes("status report")) return "Empire status nominal. Funnels online. Awaiting next directive.";
    if (q.includes("open dashboard")) { try { window.open("https://empirecontrol.live", "_blank"); } catch {} return "Opening the dashboard."; }
    if (q.includes("for the empire")) return "For the Empire. Profit is Law.";
    return null;
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");

    const local = runLocalCommands(content);
    if (local) { pushAssistant(local); return; }

    if (apiEndpoint) {
      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, { role: "user", content }] }),
        });
        const data = await res.json();
        const reply = (data?.reply || "Done.").toString();
        pushAssistant(reply);
        return;
      } catch (e) {
        pushAssistant("Network error. Using local brain only.", false);
      }
    }
    pushAssistant("Noted. I will handle it.");
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ${listening ? "ring-blue-500 animate-pulse" : speaking ? "ring-emerald-500" : "ring-zinc-800"}`}>
          <img src={avatarSrc} alt={`${name} avatar`} className="w-full h-full object-cover" />
          {speaking && <div className="absolute inset-0 bg-black/20" />}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-zinc-400">Say “{wakeWord}” to wake · Voice: {voiceName || "(system)"}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => (speaking ? synth?.cancel() : speak("On standby."))} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm">{speaking ? "Stop" : "Speak"}</button>
          <button onClick={() => (listening ? stopListening() : startListening())} className={`px-3 py-2 rounded-xl text-sm ${listening ? "bg-blue-600" : "bg-zinc-800 hover:bg-zinc-700"}`}>{listening ? "Listening…" : "Mic"}</button>
        </div>
      </div>

      <div ref={chatRef} className="h-80 overflow-y-auto rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[90%] ${m.role === "assistant" ? "ml-0" : "ml-auto"}`}>
            <div className={`px-3 py-2 rounded-2xl text-sm shadow ${m.role === "assistant" ? "bg-zinc-800" : "bg-emerald-700"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Type to talk to ${name}…`}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
        <button onClick={() => handleSend()} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm">Send</button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">Tip: Wire runLocalCommands() to real actions later (sales, funnels, XRP). For Welsh, set STT lang to \"cy-GB\".</p>
    </div>
  );
}

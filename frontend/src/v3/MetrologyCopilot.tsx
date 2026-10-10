import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, MessageSquare, Send, X, Shield, BookOpen, User, Bot, AlertCircle } from "lucide-react";

export function MetrologyCopilot() {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; clause?: string }>>([
    {
      role: "assistant",
      text: "Namaste! I am your Legal Metrology AI Copilot. Ask me about MPE calculation intervals, high-capacity weighbridge substitution rules, or statutory verification fees under the 2026 amendments.",
      clause: "Legal Metrology Act, 2009"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query;
    setQuery("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/v3/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText })
      });
      if (!res.ok) throw new Error("Failed to reach copilot service.");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.answer, clause: data.statutory_reference }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "Error communicating with Legal Metrology AI Copilot server. Please check your backend connection." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs sm:text-sm shadow-[0_0_35px_rgba(14,165,233,0.4)] border border-cyan-400"
      >
        <Sparkles className="w-4 h-4 text-black" />
        <span className="font-sans font-medium">Metrology Copilot</span>
      </motion.button>

      {/* Slide-Over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Drawer Window */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#0A0A0B] border-l border-white/10 flex flex-col h-full shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#111113]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-[#FAFAFA] text-base">Metrology AI Copilot</h3>
                    <p className="text-xs text-zinc-500 font-mono">Statutory Metrology Advisor · 2026 Rules</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] p-4 rounded-3xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-medium rounded-br-sm"
                          : "bg-[#111113] border border-white/5 text-[#FAFAFA] rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.clause && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{msg.clause}</span>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-[#111113] border border-white/5 px-4 py-3 rounded-2xl w-fit">
                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Legal Metrology statutes...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Preset Quick Prompts */}
              <div className="px-6 py-2.5 bg-[#111113]/60 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  "Class III MPE for 50kg load?",
                  "Weighbridge test substitution rule?",
                  "In-service verification period"
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setQuery(preset)}
                    className="shrink-0 text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:border-cyan-500/40 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-white/5 bg-[#111113]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about MPE, tolerances, or weighbridges..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 sm:px-5 py-3 text-sm text-[#FAFAFA] placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="p-3 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

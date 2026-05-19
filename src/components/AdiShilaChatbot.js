"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, UserCircle, MessageSquare } from "lucide-react";

const initialMessages = [
  {
    role: "assistant",
    text: "Welcome to AdiShila Support! Ask me about shungite products, EMF protection, Vastu, pricing, and shipping. Share your interest and I will help you right away.",
    time: new Date().toISOString(),
  },
];

const quickPrompts = [
  "Tell me about EMF protection",
  "What products do you offer?",
  "Pricing details",
];

const interestOptions = [
  "Kavach Shield OM",
  "Vastu Dosh Pyramid",
  "Rudra-Shila Raksha Mala",
  "Amrit Jal Shuddhi Set",
  "Shila Raksha Pendant OM",
  "General Wholesale Inquiry",
  "EMF Protection Info"
];

export default function AdiShilaChatbot() {
  // --- NEW: WIDGET STATE ---
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'lead'

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  
  const [lead, setLead] = useState({ name: "", email: "", interest: [] });
  const [leadSaved, setLeadSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  const messagesEndRef = useRef(null);

  const canSend = input.trim().length > 0;

  // --- STRICT VALIDATION LOGIC ---
  const validateEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateName = (name) => {
    if (!name) return false;
    return name.trim().length >= 3 && /^[A-Za-z\s]+$/.test(name);
  };

  const isValidName = validateName(lead.name);
  const isValidEmail = validateEmail(lead.email);
  const isValidInterest = Array.isArray(lead.interest) && lead.interest.length > 0; 

  const canSaveLead = isValidName && isValidEmail && isValidInterest && !leadSaved;

  // 1. LOAD FROM LOCAL STORAGE ON MOUNT
  useEffect(() => {
    const storedLead = localStorage.getItem("adishila_lead");
    if (storedLead) {
      try {
        const parsedLead = JSON.parse(storedLead);
        if (parsedLead.name || parsedLead.email || parsedLead.interest) {
          let loadedInterest = parsedLead.interest;
          if (typeof loadedInterest === 'string') {
            loadedInterest = loadedInterest ? loadedInterest.split(", ") : [];
          }
          setTimeout(() => {
            setLead({ ...parsedLead, interest: loadedInterest || [] });
            setLeadSaved(true);
          }, 0);
        }
      } catch (err) {
        console.error("Failed to parse lead from local storage", err);
      }
    }
  }, []); 

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, activeTab]);

  const sendMessageToApi = async (payload) => {
    setError(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let data = null;
        try { data = await response.json(); } catch (err) {}
        throw new Error(data?.error || "Unable to reach the AI service.");
      }

      if (response.body) {
        setMessages((prev) => [...prev, { role: "assistant", text: "", time: new Date().toISOString() }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1] || { role: "assistant", text: "" };
              copy[copy.length - 1] = { ...last, text: (last.text || "") + chunk };
              return copy;
            });
          }
        }
        return null;
      }

      return await response.text();
    } catch (err) {
      console.error(err);
      setError(err.message);
      return "Sorry, I couldn't connect to the AI service. Please try again later.";
    }
  };

  const handleSend = async () => {
    if (!canSend || isLoading) return;

    const userMessage = input.trim();
    const nextMessages = [...messages, { role: "user", text: userMessage, time: new Date().toISOString() }];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const maybeText = await sendMessageToApi({ 
      messages: nextMessages, 
      lead: { ...lead, interest: lead.interest.join(", ") } 
    });
    
    if (typeof maybeText === "string" && maybeText) {
      setMessages((prev) => [...prev, { role: "assistant", text: maybeText, time: new Date().toISOString() }] );
    }
    setIsLoading(false);
  };

  const handleQuickPrompt = async (prompt) => {
    if (isLoading) return;

    const nextMessages = [...messages, { role: "user", text: prompt, time: new Date().toISOString() }];
    setMessages(nextMessages);
    setIsLoading(true);

    const maybeText = await sendMessageToApi({ 
      messages: nextMessages, 
      lead: { ...lead, interest: lead.interest.join(", ") } 
    });
    
    if (typeof maybeText === "string" && maybeText) {
      setMessages((prev) => [...prev, { role: "assistant", text: maybeText, time: new Date().toISOString() }] );
    }
    setIsLoading(false);
  };

  const handleLeadChange = (field, value) => {
    setLead((current) => ({ ...current, [field]: value }));
    setLeadSaved(false); 
  };

  const toggleInterest = (option) => {
    setLeadSaved(false);
    setLead((current) => {
      const currentInterests = Array.isArray(current.interest) ? current.interest : [];
      let newInterests;
      if (currentInterests.includes(option)) {
        newInterests = currentInterests.filter(i => i !== option);
      } else {
        newInterests = [...currentInterests, option];
      }
      return { ...current, interest: newInterests };
    });
  };

  const handleLeadSubmit = (event) => {
    event.preventDefault();
    if (!canSaveLead) return;
    
    const formattedLead = {
      ...lead,
      interest: lead.interest.join(", ")
    };

    localStorage.setItem("adishila_lead", JSON.stringify(formattedLead));

    (async () => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead: formattedLead }),
        });
        if (!res.ok) {
          setLeadSaved(false);
          return;
        }
        setLeadSaved(true);
        showToastMessage("Contact saved successfully!");
        setTimeout(() => setActiveTab("chat"), 1000); // Auto-return to chat
      } catch (err) {
        setLeadSaved(false);
      }
    })();
  };

  const handleClearLead = () => {
    localStorage.removeItem("adishila_lead");
    setLead({ name: "", email: "", interest: [] });
    setLeadSaved(false);
    showToastMessage("Lead cleared successfully");
  };

  const showToastMessage = useCallback((msg, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Toast Notification */}
      {toast && (
        <div className="absolute -top-12 right-0 z-50 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg transition-all dark:bg-white dark:text-zinc-900 whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="mb-4 flex flex-col w-[380px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-8rem)] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          
          {/* Header & Tabs */}
          <div className="flex flex-col bg-zinc-950 text-white p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-lg tracking-tight">AdiShila Support</h2>
                <p className="text-xs text-zinc-400">Usually replies instantly</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "chat" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <button 
                onClick={() => setActiveTab("lead")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "lead" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <UserCircle className="w-3.5 h-3.5" /> Contact Info
              </button>
            </div>
          </div>

          {/* TAB 1: CHAT VIEW */}
          {activeTab === "chat" && (
            <div className="flex flex-col flex-1 overflow-hidden bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                {messages.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={`flex flex-col max-w-[85%] ${item.role === "assistant" ? "self-start" : "self-end"}`}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 ml-1">
                      {item.role === "assistant" ? "AdiShila Bot" : "You"}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
                      item.role === "assistant"
                        ? "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                        : "bg-zinc-950 text-white dark:bg-zinc-800 dark:text-white rounded-tr-sm"
                    }`}>
                      {item.role === "assistant" ? (
                        <div className="leading-relaxed">
                          <ReactMarkdown
                            components={{
                              strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            }}
                          >
                            {item.text}
                          </ReactMarkdown>
                          {index === 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {quickPrompts.map((prompt) => (
                                <button
                                  key={prompt}
                                  onClick={() => handleQuickPrompt(prompt)}
                                  className="border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors text-left"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          )}
                          {item.text && item.text.includes("I'm sorry — I can't assist with that request") && (
                            <button
                              onClick={() => setActiveTab("lead")}
                              className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200"
                            >
                              Leave your contact info
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line leading-relaxed">{item.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="self-start max-w-[85%]">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 ml-1">AdiShila Bot</div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-zinc-100 text-zinc-500 text-sm animate-pulse shadow-sm">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="p-3 bg-white border-t border-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 shrink-0">
                {error && <div className="mb-2 px-3 py-2 rounded-lg bg-rose-50 text-xs text-rose-600 border border-rose-100">{error}</div>}
                <div className="flex items-end gap-2 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask a question..."
                    className="w-full max-h-32 min-h-[44px] resize-none rounded-xl border border-zinc-200 bg-zinc-50 pl-4 pr-12 py-3 text-sm outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 scrollbar-thin"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!canSend || isLoading}
                    className="absolute right-1.5 bottom-1.5 p-2 rounded-lg bg-zinc-950 text-white disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEAD CAPTURE VIEW */}
          {activeTab === "lead" && (
            <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-zinc-950 scrollbar-thin">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Save your details</h3>
                <p className="text-xs text-zinc-500 mt-1">Get custom B2B pricing or follow-up support.</p>
              </div>
              
              <form className="space-y-4" onSubmit={handleLeadSubmit}>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                  <input
                    type="text"
                    value={lead.name}
                    onChange={(e) => handleLeadChange("name", e.target.value)}
                    placeholder="Full name"
                    className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                      lead.name.length > 0 && !isValidName ? "border-rose-300 focus:ring-rose-100" : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  />
                </label>
                
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                  <input
                    type="email"
                    value={lead.email}
                    onChange={(e) => handleLeadChange("email", e.target.value)}
                    placeholder="you@example.com"
                    className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                      lead.email.length > 0 && !isValidEmail ? "border-rose-300 focus:ring-rose-100" : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  />
                </label>

                <div className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Interests
                  <div className={`mt-1.5 flex flex-col gap-2.5 rounded-xl border px-3 py-3 max-h-40 overflow-y-auto ${
                      Array.isArray(lead.interest) && lead.interest.length === 0 && lead.name.length > 0 ? "border-rose-300" : "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}>
                    {interestOptions.map((option) => (
                      <label key={option} className="flex items-start gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-normal">
                        <input
                          type="checkbox"
                          checked={Array.isArray(lead.interest) && lead.interest.includes(option)}
                          onChange={() => toggleInterest(option)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        <span className="leading-tight">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!canSaveLead}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    canSaveLead ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                  }`}
                >
                  {leadSaved ? "Details Saved ✓" : "Save Details"}
                </button>
              </form>

              {(leadSaved || lead.name) && (
                 <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center">
                   <button 
                     onClick={handleClearLead}
                     className="text-xs text-rose-500 hover:text-rose-600 transition font-medium"
                   >
                     Clear my saved information
                   </button>
                 </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="h-14 w-14 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform hover:shadow-zinc-950/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

    </div>
  );
}
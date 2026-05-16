"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const initialMessages = [
  {
    role: "assistant",
    text: "Welcome to AdiShila Support! Ask me about shungite products, EMF protection, Vastu, pricing, shipping, or share your interest and I will help you right away.",
  },
];

const quickPrompts = [
  "Tell me about EMF protection",
  "What products do you offer?",
  "How do I use shungite for Vastu?",
  "Shipping and delivery info",
  "Pricing details",
];

export default function AdiShilaChatbot() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [lead, setLead] = useState({ name: "", email: "", interest: "" });
  const [leadSaved, setLeadSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  const canSend = input.trim().length > 0;
  const canSaveLead = lead.name.trim() && lead.email.trim() && lead.interest.trim();

  // 1. LOAD FROM LOCAL STORAGE ON MOUNT (after hydration)
  useEffect(() => {
    const storedLead = localStorage.getItem("adishila_lead");
    if (storedLead) {
      try {
        const parsedLead = JSON.parse(storedLead);
        // Only load it if there is actual data inside
        if (parsedLead.name || parsedLead.email || parsedLead.interest) {
          setTimeout(() => {
            setLead(parsedLead);
            setLeadSaved(true);
          }, 0);
        }
      } catch (err) {
        console.error("Failed to parse lead from local storage", err);
      }
    }
  }, []); // Empty dependency array: runs once after hydration

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessageToApi = async (payload) => {
    setError(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to reach the AI service.");
      }

      return data.answer;
    } catch (err) {
      console.error(err);
      setError(err.message);
      return "Sorry, I couldn't connect to the AI service. Please try again later.";
    }
  };

  const handleSend = async () => {
    if (!canSend || isLoading) return;

    const userMessage = input.trim();
    const nextMessages = [...messages, { role: "user", text: userMessage }];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const assistantText = await sendMessageToApi({ messages: nextMessages, lead });
    setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
    setIsLoading(false);
  };

  const handleQuickPrompt = async (prompt) => {
    if (isLoading) return;

    const nextMessages = [...messages, { role: "user", text: prompt }];
    setMessages(nextMessages);
    setIsLoading(true);

    const assistantText = await sendMessageToApi({ messages: nextMessages, lead });
    setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
    setIsLoading(false);
  };

  const handleLeadChange = (field, value) => {
    setLead((current) => ({ ...current, [field]: value }));
    setLeadSaved(false); // They changed something, so it's no longer saved
  };

  const handleLeadSubmit = (event) => {
    event.preventDefault();
    if (!canSaveLead) return;
    
    // 2. SAVE TO LOCAL STORAGE ON SUBMIT
    localStorage.setItem("adishila_lead", JSON.stringify(lead));
    setLeadSaved(true);
  };

  const leadPreview = useMemo(
    () => `${lead.name ? `${lead.name} · ` : ""}${lead.email ? `${lead.email} · ` : ""}${lead.interest}`,
    [lead]
  );

  return (
    <section className="adi-mobile-shell mx-auto flex w-full max-w-6xl flex-col gap-8 px-0 py-8 sm:px-6 sm:py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">AdiShila Support</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              AI Customer Support + FAQ Chatbot
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Ask questions about AdiShila shungite products, EMF protection, Vastu, pricing, and shipping. Capture lead info with name, email, and interest all in one place.
            </p>
          </div>
          <div className="rounded-3xl bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            AI-powered responses with product support and lead context
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
        <div className="adi-chat-panel rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col min-h-[820px] md:min-h-[700px] w-full max-w-full">
          <div className="flex flex-col gap-4 flex-1 min-h-80 overflow-hidden">
            <div className="space-y-2 flex-shrink-0">
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Ask your question</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Start a conversation about products, EMF, Vastu, pricing, shipping, or lead capture.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-2 max-h-[22rem] overflow-y-auto pr-1 sm:grid-cols-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Chat</h3>
            <div className="mt-4 space-y-4 overflow-y-auto flex-1 min-h-50 pr-2 pb-2 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent dark:scrollbar-thumb-zinc-700">
              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`rounded-3xl px-4 py-4 shadow-sm ${
                    item.role === "assistant"
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                      : "bg-zinc-950 text-white dark:bg-zinc-800 dark:text-white"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    {item.role === "assistant" ? "AdiShila Bot" : "You"}
                  </div>
                  
                  {/* 3. REACT MARKDOWN IMPLEMENTATION */}
                  {item.role === "assistant" ? (
                    <div className="mt-2 text-sm leading-7 text-zinc-800 dark:text-zinc-200">
                      <ReactMarkdown
                        components={{
                          strong: ({ node, ...props }) => <span className="font-bold text-zinc-950 dark:text-white" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li className="" {...props} />,
                          em: ({ node, ...props }) => <span className="italic" {...props} />
                        }}
                      >
                        {item.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="mt-2 whitespace-pre-line text-sm leading-7">{item.text}</p>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="rounded-3xl bg-zinc-100 px-4 py-4 text-sm text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    AdiShila Bot
                  </div>
                  <p className="mt-2 animate-pulse">Thinking... please wait.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-200 flex-shrink-0">
                {error}
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center flex-shrink-0 border-t border-zinc-100 dark:border-zinc-800">
              <label className="sr-only" htmlFor="chat-input">
                Type your question
              </label>
              <input
                id="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about AdiShila products, EMF, Vastu..."
                className="min-h-[54px] flex-1 rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || isLoading}
                className="inline-flex h-14 w-full items-center justify-center rounded-3xl bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 sm:w-auto"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Lead Capture</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Capture customer details and interest. This section stores the lead locally for quick follow-up.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleLeadSubmit}>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Name
                <input
                  type="text"
                  value={lead.name}
                  onChange={(event) => handleLeadChange("name", event.target.value)}
                  placeholder="Full name"
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-900"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Email
                <input
                  type="email"
                  value={lead.email}
                  onChange={(event) => handleLeadChange("email", event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-900"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Interest
                <input
                  type="text"
                  value={lead.interest}
                  onChange={(event) => handleLeadChange("interest", event.target.value)}
                  placeholder="Product, EMF protection, Vastu..."
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-900"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-3xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Save Lead
              </button>
            </form>

            <div className="rounded-3xl bg-white p-4 text-sm text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-200">
              <p className="font-semibold">Last saved lead</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {leadPreview || "No lead captured yet."}
              </p>
              {leadSaved && (
                <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Lead saved to your browser. The bot will remember you!
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
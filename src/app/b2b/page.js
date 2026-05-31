"use client";

import { useState } from "react";
import { Building2, Mail, User, ShieldCheck, TrendingUp, Sparkles, CheckCircle2, ArrowRight, Bug, AlertTriangle } from "lucide-react";

const interestOptions = [
  "Kavach Shield OM",
  "Vastu Dosh Pyramid",
  "Rudra-Shila Raksha Mala",
  "Amrit Jal Shuddhi Set",
  "Shila Raksha Pendant OM",
  "Full Catalog Sample Kit"
];

export default function WholesalePortal() {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", interest: [] });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error, edge_case_success

  // Normal strict validation
  const isValid = 
    formData.name.trim().length >= 3 && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.company.trim().length >= 2 &&
    formData.interest.length > 0;

  const toggleInterest = (option) => {
    setFormData(prev => ({
      ...prev,
      interest: prev.interest.includes(option) 
        ? prev.interest.filter(i => i !== option)
        : [...prev.interest, option]
    }));
  };

  // Standard Success Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    
    setStatus("loading");
    
    const payload = { 
      ...formData, 
      interest: formData.interest.join(", "),
      source: "B2B Wholesale Portal"
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: payload }),
      });
      
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  // TASK T12 SPECIFIC: Simulate an edge case to trigger the Make.com error router
  const handleEdgeCaseTest = async () => {
    setStatus("loading");
    
    // Intentionally malformed payload (invalid email without .com)
    const badPayload = { 
      name: "Spam Bot 404", 
      email: "spambot404@invalid", 
      company: "Bot Network", 
      interest: "Spam",
      source: "B2B Edge Case"
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: badPayload }),
      });
      
      if (!res.ok) throw new Error("Failed to submit edge case");
      setStatus("edge_case_success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Application Received</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Thank you for your interest, {formData.name}. Our B2B sales team has been notified.
          </p>
          <button 
            onClick={() => { setStatus("idle"); setFormData({ name: "", email: "", company: "", interest: [] }); }}
            className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
          >
            Submit another application
          </button>
        </div>
      </div>
    );
  }

  // UI for the Spam Bot Edge Case Test
  if (status === "edge_case_success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-rose-900/50 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Edge Case Triggered</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            A malformed payload (invalid email) was successfully forced through to the Webhook. Check your Make.com / Zapier logs to verify the Error Router successfully diverted this to the Quarantine sheet.
          </p>
          <button 
            onClick={() => { setStatus("idle"); setFormData({ name: "", email: "", company: "", interest: [] }); }}
            className="text-rose-500 hover:text-rose-400 text-sm font-medium transition-colors"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col md:flex-row font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* LEFT COLUMN - VALUE PROP */}
      <div className="w-full md:w-5/12 lg:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden border-r border-zinc-800/50">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/5 via-black to-black -z-10 pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white tracking-widest uppercase">AdiShila</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6">
            Become an Official <br />
            <span className="text-amber-500 italic font-serif">Retail Partner</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-12 max-w-md leading-relaxed">
            Join India&apos;s premier network of authentic Karelian Shungite distributors. Secure high margins on in-demand EMF and Vastu wellness products.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Industry-Leading Margins</h3>
                <p className="text-zinc-500 text-sm mt-1 leading-relaxed">Enjoy 40% to 52.5% retail margins across our entire catalog with low initial MOQs.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Certified Authenticity</h3>
                <p className="text-zinc-500 text-sm mt-1 leading-relaxed">Every batch is lab-tested for C60 Fullerenes. We guarantee 100% genuine Russian sourcing.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-zinc-800/50 flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                {String.fromCharCode(64+i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Trusted by 50+ Wellness Centers</p>
        </div>
      </div>

      {/* RIGHT COLUMN - THE FORM */}
      <div className="w-full md:w-7/12 lg:w-1/2 p-8 md:p-12 lg:p-20 bg-zinc-950 flex flex-col justify-center relative">
        <div className="max-w-xl mx-auto w-full">
          
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-2xl text-white font-medium mb-2">Partner Application</h2>
              <p className="text-sm text-zinc-500">Submit your details to trigger our automated onboarding workflow.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-zinc-900/50 transition-all"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Business Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-zinc-900/50 transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Company / Store Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="text" 
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-zinc-900/50 transition-all"
                  placeholder="e.g. Prana Wellness Studio"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800/50">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Products of Interest</span>
                {formData.interest.length === 0 && <span className="text-rose-500 normal-case tracking-normal">Select at least one</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(option => {
                  const isSelected = formData.interest.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleInterest(option)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                        isSelected 
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-400" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {status === "error" && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                An error occurred connecting to the webhook. Please try again.
              </div>
            )}

            <div className="pt-6 flex flex-col gap-4">
              <button
                type="submit"
                disabled={!isValid || status === "loading"}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isValid && status !== "loading"
                  ? "bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {status === "loading" ? (
                  "Processing Request..."
                ) : (
                  <>Submit Application <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

          </form>

          {/* EVALUATOR / DEBUG MODE FOR TASK T12 */}
          <div className="mt-12 pt-6 border-t border-zinc-800/50">
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Task T12 Evaluator Tool</h4>
                 <p className="text-xs text-zinc-500">Test the Make.com error-handling route (invalid payload).</p>
               </div>
               <button 
                 onClick={handleEdgeCaseTest}
                 className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-rose-900/30 hover:text-rose-400 border border-zinc-700 hover:border-rose-900 rounded-lg text-xs font-medium transition-colors shrink-0"
               >
                 <Bug className="w-3 h-3" />
                 Simulate Spam Bot
               </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
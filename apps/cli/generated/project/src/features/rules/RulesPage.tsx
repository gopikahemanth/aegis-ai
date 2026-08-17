import React, { useState } from "react";
import Navbar from "../../shared/components/Navbar";

export function RulesPage() {
  const [rules, setRules] = useState([
    { id: "RULE-001", name: "SQL Injection Parameterization", category: "Security", severity: "Critical", enabled: true, desc: "Enforces parameterized SQL queries and flags string concatenation in database operations." },
    { id: "RULE-002", name: "Dynamic Code Evaluation (eval)", category: "Security", severity: "Critical", enabled: true, desc: "Detects dangerous eval() and Function() constructor calls in runtime code paths." },
    { id: "RULE-003", name: "Hardcoded API Keys & Secrets", category: "Compliance", severity: "High", enabled: true, desc: "Scans repository files for hardcoded JWT secrets, API keys, and database passwords." },
    { id: "RULE-004", name: "Unescaped DOM Output (XSS)", category: "Frontend", severity: "Medium", enabled: true, desc: "Flag dangerous innerHTML assignments or unescaped user input rendered to DOM." },
    { id: "RULE-005", name: "Outdated Dependency CVE Checker", category: "Dependency", severity: "Medium", enabled: false, desc: "Audits package.json against known vulnerability advisory registries." }
  ]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-slate-100">Static Analysis Rule Registry</h1>
          <p className="text-sm text-slate-400 mt-1">Configure active AST security rules, adjust severity cutoffs, and customize static pattern matchers.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map(rule => (
            <div key={rule.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-cyan-400">{rule.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rule.severity === "Critical" ? "bg-rose-950 text-rose-400 border border-rose-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                    {rule.severity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{rule.name}</h3>
                <p className="text-xs text-slate-400">{rule.desc}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Category: {rule.category}</span>
                <button 
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${rule.enabled ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"}`}
                >
                  {rule.enabled ? "ACTIVE" : "DISABLED"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RulesPage;

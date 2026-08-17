import React, { useState } from "react";
import Navbar from "../../shared/components/Navbar";

export function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scans] = useState([
    { id: "SCAN-9041", date: "2026-08-15 11:30", target: "auth.middleware.ts", score: 94, findings: 0, status: "Clean" },
    { id: "SCAN-9040", date: "2026-08-15 10:15", target: "paymentController.ts", score: 42, findings: 3, status: "Critical Risk" },
    { id: "SCAN-9039", date: "2026-08-15 08:45", target: "UserProfile.tsx", score: 78, findings: 1, status: "Medium Risk" },
    { id: "SCAN-9038", date: "2026-08-14 15:20", target: "server/index.ts", score: 88, findings: 1, status: "Low Risk" }
  ]);

  const filtered = scans.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.target.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">Security Scan History Audit</h1>
            <p className="text-sm text-slate-400 mt-1">Review historical AST scans, findings breakdown, and export PDF audit reports.</p>
          </div>
          <input 
            type="text" 
            placeholder="Search by Scan ID or Target..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 w-72 focus:outline-none focus:border-cyan-500"
          />
        </header>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Scan ID</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Target Module</th>
                <th className="p-4">Health Score</th>
                <th className="p-4">Findings</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{item.id}</td>
                  <td className="p-4 text-slate-400">{item.date}</td>
                  <td className="p-4 font-semibold text-slate-200">{item.target}</td>
                  <td className={`p-4 font-bold ${item.score > 75 ? "text-emerald-400" : "text-rose-400"}`}>{item.score} / 100</td>
                  <td className="p-4 text-slate-300">{item.findings} Vulnerabilities</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${item.score > 75 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                      📄 PDF Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;

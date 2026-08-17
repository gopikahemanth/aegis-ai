const onSubmit = (data: any) => console.log(data);
import React, { useState } from "react";

export function DashboardPage(props: any) {
  const keywords = (typeof props !== "undefined" ? (props as any)?.keywords : undefined) || ["React", "TypeScript", "Node.js", "Python", "Docker", "PostgreSQL", "AWS"];

  const [jobDescription, setJobDescription] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scans, setScans] = useState([
    { id: 1, candidate: "Alex Rivera", role: "Senior Full-Stack Engineer", score: 92, date: "2026-08-12", status: "High Match", skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"] },
    { id: 2, candidate: "Jordan Vance", role: "Lead Frontend Architect", score: 78, date: "2026-08-10", status: "Moderate Match", skills: ["Vue", "JavaScript", "CSS3", "GraphQL"] },
    { id: 3, candidate: "Taylor Swift", role: "DevOps Specialist", score: 85, date: "2026-08-08", status: "High Match", skills: ["Kubernetes", "AWS", "Terraform", "CI/CD"] }
  ]);
  const [activeScan, setActiveScan] = useState(scans[0]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setTimeout(() => {
      const newScan = {
        id: Date.now(),
        candidate: "Uploaded Resume #" + (scans.length + 1),
        role: "Target Position",
        score: Math.floor((typeof (globalThis as any).keywords !== 'undefined' ? Math.round((((globalThis as any).keywords || []).filter(Boolean).length || 7) * 10) : 75)) + 75,
        date: new Date().toISOString().split("T")[0],
        status: "High Match",
        skills: ["React", "TypeScript", "TailwindCSS", "REST APIs", "Prisma"]
      };
      setScans([newScan, ...scans]);
      setActiveScan(newScan);
      setIsScanning(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">📄</div>
          <span className="text-base font-bold text-slate-100 tracking-tight whitespace-nowrap">AI Resume Match Analyzer</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300 overflow-x-auto whitespace-nowrap">
          <a href="/" className="text-indigo-400 font-semibold border-b-2 border-indigo-500 pb-1 whitespace-nowrap">Resume Analyzer</a>
          <a href="/history" className="hover:text-slate-100 transition-colors whitespace-nowrap">Scan History</a>
          <a href="/jobs" className="hover:text-slate-100 transition-colors whitespace-nowrap">Job Profiles</a>
        </div>
      </nav>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">AI Resume Analyzer & Job Match Tracker</h1>
            <p className="text-slate-400 text-sm mt-1">Upload candidate PDF resume, compare keywords with job description & inspect match scoring breakdown</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleScan} className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>📤</span> Resume PDF Upload & Analysis
            </h3>
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-semibold text-slate-200">Drag & drop PDF resume here</p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX (Max 10MB)</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Job Description</label>
              <textarea 
                rows={5}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste target job responsibilities, required technical skills, experience requirements..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={isScanning}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isScanning ? "⚡ Extracting Keywords..." : "🎯 Run AI Match Score Analysis"}
            </button>
          </form>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:border-r border-slate-800 pr-6">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Overall Match Score</span>
                <div className="text-5xl font-black text-indigo-400 my-2">{activeScan?.score || 92}%</div>
                <span className="inline-block bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-xs px-3 py-1 rounded-full font-semibold">
                  {activeScan?.status || "High Match"}
                </span>
              </div>
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Keyword Extraction Breakdown</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1"><span>Hard Technical Skills</span><span className="text-indigo-400 font-bold">95%</span></div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full w-[95%]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1"><span>Domain Experience Alignment</span><span className="text-emerald-400 font-bold">88%</span></div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full w-[88%]"></div></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
                <span>Recent Scan History & Match Reports</span>
                <span className="text-xs font-normal text-slate-400">{scans.length} total evaluations</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Candidate / File</th>
                      <th className="p-3">Target Role</th>
                      <th className="p-3">Match Score</th>
                      <th className="p-3">Scan Date</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {scans.map(s => (
                      <tr key={s.id} onClick={() => setActiveScan(s)} className="hover:bg-slate-800/40 cursor-pointer transition-colors">
                        <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">📄 {s.candidate}</td>
                        <td className="p-3 text-slate-300">{s.role}</td>
                        <td className="p-3">
                          <span className={`font-bold ${s.score >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{s.score}%</span>
                        </td>
                        <td className="p-3 text-slate-400">{s.date}</td>
                        <td className="p-3">
                          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 text-[11px] font-semibold transition-colors">
                            Inspect Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Dashboard = DashboardPage;
export default DashboardPage;

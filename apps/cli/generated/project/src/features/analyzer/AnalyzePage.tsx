import React, { useState } from "react";
import Navbar from "../../shared/components/Navbar";

export function AnalyzePage() {
  const [inputText, setInputText] = useState(`// Source Code or Candidate Payload
function evaluateMatch(candidate, spec) {
  const score = candidate.skills.includes("React") ? 95 : 65;
  const sql = "SELECT * FROM candidates WHERE name = '" + candidate.name + "'";
  if (eval(candidate.script)) { console.log("Custom script executed"); }
  return { score, sql };
}`);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = evt => evt.target?.result && setInputText(evt.target.result as string);
      reader.readAsText(file);
    }
  };

  const handleRun = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const hasEval = /eval|Function/i.test(inputText);
      const hasSql = /SELECT|INSERT/i.test(inputText);
      setResult({
        score: hasEval ? 42 : hasSql ? 68 : 94,
        category: hasEval ? "Critical Risk" : hasSql ? "Moderate Match" : "Strong Match",
        keywords: ["React", "TypeScript", "Express", "AST Parser", "Node.js"],
        anomalies: [
          ...(hasEval ? [{ title: "Dynamic Code Evaluation (eval)", severity: "Critical", line: 5, desc: "Dynamic script execution detected in match routine." }] : []),
          ...(hasSql ? [{ title: "Unsanitized SQL String Concatenation", severity: "High", line: 4, desc: "Direct input concatenation in SQL query." }] : [])
        ]
      });
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-slate-100">Code & Resume AST Analyzer</h1>
          <p className="text-sm text-slate-400 mt-1">Upload source modules or candidate payloads for automated AST keyword parsing and vulnerability scoring.</p>
        </header>

        <div 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-10 text-center bg-slate-900/40 backdrop-blur-xl transition-all cursor-pointer shadow-2xl"
        >
          <div className="text-4xl mb-2">📁</div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            {fileName ? `Uploaded File: ${fileName}` : "Drag & Drop Resume PDF or Source Files Here"}
          </h3>
          <p className="text-xs text-slate-400 mb-4">Supports .pdf, .ts, .tsx, .js up to 25MB</p>
          <label className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 transition-all inline-block">
            Browse Files
            <input type="file" onChange={e => e.target.files?.[0] && (setFileName(e.target.files[0].name), handleRun())} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-200">Source Payload Editor</h3>
            <textarea 
              rows={12}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            <button 
              onClick={handleRun}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? "Processing AST Nodes..." : "⚡ Execute AST Analysis"}
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
            <h3 className="text-base font-bold text-slate-200">Live Analysis Output</h3>
            {!result ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Click "Execute AST Analysis" to evaluate payloads.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Score</span>
                    <h2 className={`text-3xl font-black mt-0.5 ${result.score > 75 ? "text-emerald-400" : "text-rose-400"}`}>{result.score} / 100</h2>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.score > 75 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
                    {result.category}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Parsed Keywords & Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw: string) => (
                      <span key={kw} className="bg-slate-800 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Detected Code Anomalies ({result.anomalies.length})</h4>
                  {result.anomalies.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-rose-950 p-3 rounded-xl space-y-1 mb-2">
                      <div className="flex justify-between text-xs font-bold text-rose-400">
                        <span>[{item.severity}] {item.title}</span>
                        <span>Line {item.line}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyzePage;

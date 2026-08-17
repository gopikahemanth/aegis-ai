import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../shared/components/Navbar";

export function LoginPage() {
  const [email, setEmail] = useState("admin@aegis-security.io");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      navigate("/");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
              🛡️
            </div>
            <h2 className="text-2xl font-black text-slate-100">Sign In to Aegis</h2>
            <p className="text-xs text-slate-400">Access enterprise vulnerability dashboards and AST rule engines.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating Session..." : "🔐 Authenticate Session"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

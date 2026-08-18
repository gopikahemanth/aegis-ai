const onSubmit = (data: any) => console.log(data);
import React, { useState } from "react";

export function LoginPage(props: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Sign In</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full mb-4 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full mb-6 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded" />
        <button type="submit" className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded">Sign In</button>
      </form>
    </div>
  );
}

export default LoginPage;
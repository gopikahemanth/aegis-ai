import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <form className="p-8 bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-slate-800 rounded border border-slate-700 text-white"
          placeholder="Email"
        />
        <button className="w-full mt-4 bg-indigo-600 text-white py-2 rounded">Sign In</button>
      </form>
    </div>
  );
}
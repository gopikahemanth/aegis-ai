import React, { useState } from 'react';
import { Button, Input, Card } from '../../../design-system';

interface RegisterPageProps {
  onRegister: (email: string, pass: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onRegister(email, password, name);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md flex flex-col gap-6 p-8 bg-slate-900/80 backdrop-blur-xl border-slate-800">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/30">
            🧠
          </div>
          <h1 className="text-xl font-bold text-slate-100">Create Your Account</h1>
          <p className="text-sm text-slate-400">Start your intelligent study journey with Aegis AI.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            placeholder="Alex Johnson"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="alex@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" loading={loading}>
            Create Account
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Already have an account? Sign in
          </button>
        </div>
      </Card>
    </div>
  );
};
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
      <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl font-extrabold mb-6 shadow-2xl">
        404
      </div>
      <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="mt-8">
        <Button variant="primary" onClick={() => navigate('/')}>
          Return to Command Center
        </Button>
      </div>
    </div>
  );
};
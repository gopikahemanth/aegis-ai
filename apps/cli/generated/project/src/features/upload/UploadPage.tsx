import React, { useState } from 'react';
import Layout from '../../shared/components/Layout';
import Spinner from '../../shared/components/Spinner';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Resume scan submitted successfully!');
    }, 1500);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-6">Scan Resume Against Job Description</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">PDF Resume</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Job Description</label>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job requirements here..."
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center">
            {loading ? <Spinner size="sm" label="Analyzing Resume..." /> : 'Analyze Resume'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default UploadPage;

import React, { useState } from 'react';
import { Key, CheckCircle2, XCircle, Search } from 'lucide-react';

interface KeywordMatchListProps {
  foundKeywords: string[];
  missingKeywords: string[];
}

export const KeywordMatchList: React.FC<KeywordMatchListProps> = ({ foundKeywords, missingKeywords }) => {
  const [filter, setFilter] = useState<'all' | 'found' | 'missing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFound = foundKeywords.filter(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMissing = missingKeywords.filter(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider flex items-center space-x-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Job Description Keyword Analysis</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Found: <span className="text-emerald-400 font-semibold">{foundKeywords.length}</span> | Missing: <span className="text-rose-400 font-semibold">{missingKeywords.length}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
            />
          </div>

          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('found')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${filter === 'found' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Found ({filteredFound.length})
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${filter === 'missing' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Missing ({filteredMissing.length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(filter === 'all' || filter === 'found') && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Found Keywords ({filteredFound.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredFound.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No matching found keywords.</p>
              ) : (
                filteredFound.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                    {kw}
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {(filter === 'all' || filter === 'missing') && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <XCircle className="w-4 h-4" />
              <span>Missing Keywords ({filteredMissing.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredMissing.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No missing keywords! Perfect match.</p>
              ) : (
                filteredMissing.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {kw}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
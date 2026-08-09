import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
  matched: string[];
  missing: string[];
}

export const ScanResultCard: React.FC<any> = ({ score, matched, missing }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
  >
    <h3 className="text-lg font-semibold text-slate-900">Match Score: {score}%</h3>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-medium text-emerald-600">Matched ({matched.length})</h4>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {matched.map(kw => <li key={kw}>✓ {kw}</li>)}
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-medium text-amber-600">Missing ({missing.length})</h4>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {missing.map(kw => <li key={kw}>✕ {kw}</li>)}
        </ul>
      </div>
    </div>
  </motion.div>
);
export default ScanResultCard;

export type { Props };

import React from "react";
import { AlertTriangle, ShieldAlert, Check, X, Lock, FileWarning } from "lucide-react";
import type { JobAuthorizationRequest } from "../types/control-plane-ui.js";

export interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorization?: JobAuthorizationRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  isOpen,
  onClose,
  authorization,
  onApprove,
  onReject,
}) => {
  if (!isOpen || !authorization) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-amber-950/40 border-b border-amber-500/30 p-5 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Human Authorization Required
            </h2>
            <p className="text-xs text-amber-300/80">
              A destructive or breaking operation requires explicit confirmation.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Category:</span>
              <span className="font-mono font-bold text-amber-400">
                {authorization.category}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Operation:</span>
              <span className="font-mono text-slate-200 truncate max-w-xs">
                {authorization.operation}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Risk & Impact Assessment
            </label>
            <div className="text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl leading-relaxed">
              {authorization.reason}
            </div>
          </div>

          {authorization.targetFiles && authorization.targetFiles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                <span>Affected Target Files</span>
              </label>
              <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {authorization.targetFiles.map((f) => (
                  <div key={f}>• {f}</div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-800">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>AEGIS guarantees atomic backup and rollback prior to mutation.</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              onReject(authorization.id, "Rejected by user in Authorization Center.");
              onClose();
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Reject Operation</span>
          </button>

          <button
            onClick={() => {
              onApprove(authorization.id);
              onClose();
            }}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Authorize & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const fs = require('fs');
const path = require('path');

// 1. Update interactive-components-templates.ts
const tmplFile = path.resolve(__dirname, '../packages/ai-core/src/design/interactive-components-templates.ts');
let tmplContent = fs.readFileSync(tmplFile, 'utf8');

const updatedToastTemplateFunc = `export function getToastTemplate(): string {
  return \`import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error' | (string & {});

export interface ToastOptions {
  title?: string;
  description?: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
  [key: string]: any;
}

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export type ToastFn = {
  (messageOrOptions: string | ToastOptions, options?: ToastOptions): void;
  success: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  error: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  warning: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  info: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
};

export interface ToastContextValue {
  toasts: ToastMessage[];
  toast: ToastFn;
  showToast: ToastFn;
  success: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  error: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  warning: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  info: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
  addToast: (msgOrObj: any, options?: any) => void;
  removeToast: (id: string) => void;
  [key: string]: any;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((msgOrObj: any, options?: ToastOptions) => {
    const id = \\\`toast_\\\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\\\`;
    let message = '';
    let title: string | undefined;
    let variant: ToastVariant = 'info';
    let durationMs = 4000;

    if (typeof msgOrObj === 'object' && msgOrObj !== null) {
      message = msgOrObj.message || msgOrObj.description || msgOrObj.title || '';
      title = msgOrObj.title;
      variant = msgOrObj.variant || options?.variant || 'info';
      durationMs = msgOrObj.durationMs ?? options?.durationMs ?? 4000;
    } else {
      message = String(msgOrObj || '');
      title = options?.title;
      variant = options?.variant || 'info';
      durationMs = options?.durationMs ?? 4000;
    }

    const newToast: ToastMessage = {
      id,
      message,
      variant,
      title,
      durationMs,
    };

    setToasts(prev => [...prev.slice(-4), newToast]);

    if (newToast.durationMs && newToast.durationMs > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.durationMs);
    }
  }, [removeToast]);

  const toastHelpers: ToastFn = useCallback(() => {
    const fn: any = (msgOrOpt: any, opt?: any) => addToast(msgOrOpt, opt);
    fn.success = (msgOrOpt: any, opt?: any) => {
      if (typeof msgOrOpt === 'object' && msgOrOpt !== null) {
        addToast({ ...msgOrOpt, variant: 'success' }, opt);
      } else {
        addToast(msgOrOpt, { ...opt, variant: 'success' });
      }
    };
    fn.error = (msgOrOpt: any, opt?: any) => {
      if (typeof msgOrOpt === 'object' && msgOrOpt !== null) {
        addToast({ ...msgOrOpt, variant: 'error' }, opt);
      } else {
        addToast(msgOrOpt, { ...opt, variant: 'error' });
      }
    };
    fn.warning = (msgOrOpt: any, opt?: any) => {
      if (typeof msgOrOpt === 'object' && msgOrOpt !== null) {
        addToast({ ...msgOrOpt, variant: 'warning' }, opt);
      } else {
        addToast(msgOrOpt, { ...opt, variant: 'warning' });
      }
    };
    fn.info = (msgOrOpt: any, opt?: any) => {
      if (typeof msgOrOpt === 'object' && msgOrOpt !== null) {
        addToast({ ...msgOrOpt, variant: 'info' }, opt);
      } else {
        addToast(msgOrOpt, { ...opt, variant: 'info' });
      }
    };
    return fn;
  }, [addToast])();

  const contextValue: ToastContextValue = {
    toasts,
    toast: toastHelpers,
    showToast: toastHelpers,
    success: toastHelpers.success,
    error: toastHelpers.error,
    warning: toastHelpers.warning,
    info: toastHelpers.info,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2"
      >
        {toasts.map(t => {
          const variantColor = {
            info: 'border-blue-500 bg-[var(--color-surface)] text-blue-300',
            success: 'border-emerald-500 bg-[var(--color-surface)] text-emerald-300',
            warning: 'border-amber-500 bg-[var(--color-surface)] text-amber-300',
            error: 'border-rose-500 bg-[var(--color-surface)] text-rose-300',
          }[t.variant || 'info'] || 'border-blue-500 bg-[var(--color-surface)] text-blue-300';

          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              data-toast-variant={t.variant}
              className={\\\`pointer-events-auto shadow-2xl border-l-4 rounded-xl p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start justify-between gap-3 text-sm animate-slide-up \\\${variantColor}\\\`}
            >
              <div className="flex-1">
                {t.title && <div className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">{t.title}</div>}
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss toast"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-0.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noop: any = (msg: any) => console.log(\\\`[ToastFallback]\\\`, msg);
    noop.success = noop;
    noop.error = noop;
    noop.warning = noop;
    noop.info = noop;
    return {
      toasts: [],
      toast: noop,
      showToast: noop,
      success: noop,
      error: noop,
      warning: noop,
      info: noop,
      addToast: noop,
      removeToast: () => {},
    };
  }
  return ctx;
};

export default ToastProvider;
\\\`;
}`;

const toastStart = tmplContent.indexOf('export function getToastTemplate(): string {');
const toastEnd = tmplContent.indexOf('export function getNavbarTemplate(): string {');

if (toastStart !== -1 && toastEnd !== -1) {
  tmplContent = tmplContent.substring(0, toastStart) + updatedToastTemplateFunc + '\n\n' + tmplContent.substring(toastEnd);
  fs.writeFileSync(tmplFile, tmplContent, 'utf8');
  console.log('✓ Successfully updated getToastTemplate in interactive-components-templates.ts');
} else {
  console.error('Failed to locate getToastTemplate boundaries');
}

// 2. Add Toast synchronization to FastDeterministicSanitizer
const sanFile = path.resolve(__dirname, '../packages/ai-core/src/governance/fast-sanitizer.ts');
let sanContent = fs.readFileSync(sanFile, 'utf8');

// Ensure import of getToastTemplate
if (!sanContent.includes('getToastTemplate')) {
  sanContent = sanContent.replace(
    'import { NavigationDesignResolver',
    'import { getToastTemplate } from "../design/interactive-components-templates.js";\nimport { NavigationDesignResolver'
  );
  console.log('✓ Added getToastTemplate import to fast-sanitizer.ts');
}

const targetSan = `    // Ensure ShowcaseGrid supports href & flexible item properties`;
const replacementSan = `    // Ensure Toast.tsx supports showToast, direct success/error, and object payloads
    const dsToast = join(root, "src", "design-system", "components", "Toast.tsx");
    if (existsSync(dsToast)) {
      try {
        let tCode = readFileSync(dsToast, "utf8");
        if (!tCode.includes("showToast:") || !tCode.includes("ToastOptions")) {
          writeFileSync(dsToast, getToastTemplate(), "utf8");
          console.log("[FastSanitizer] 🔧 Synchronized design-system/components/Toast.tsx with multi-signature Toast API");
        }
      } catch {}
    }

    // Ensure ShowcaseGrid supports href & flexible item properties`;

if (sanContent.includes(targetSan) && !sanContent.includes('Synchronized design-system/components/Toast.tsx')) {
  sanContent = sanContent.replace(targetSan, replacementSan);
  console.log('✓ Added Toast.tsx synchronization to fast-sanitizer.ts');
}

fs.writeFileSync(sanFile, sanContent, 'utf8');
console.log('Successfully updated both files');

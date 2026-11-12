/**
 * Interactive Component Templates for Aegis Design System
 *
 * Provides production-ready, fully accessible (WCAG AA), responsive (desktop, tablet, mobile),
 * and dependency-free React component code for generation into generated projects.
 */

export function getModalTemplate(): string {
  return `import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) focusable.focus();
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  }[size] || 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={modalRef}
        className={\`card w-full \${sizeClasses} shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-2xl flex flex-col max-h-[90vh] overflow-hidden \${className}\`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)]">
            <div>
              {title && <h3 id="modal-title" className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>}
              {description && <p id="modal-description" className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmText}
        </Button>
      </>
    }
  >
    <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
  </Modal>
);

export default Modal;
`;
}

export function getTabsTemplate(): string {
  return `import React, { useState, useRef, createContext, useContext } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  defaultTab?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (tabId: string) => void;
  onValueChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  className?: string;
  children?: React.ReactNode;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
  variant: 'underline' | 'pills' | 'segmented';
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const TabList: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div role="tablist" className={\`flex items-center gap-2 border-b border-[var(--color-border,#e2e8f0)] pb-1 min-w-max \${className}\`}>
    {children}
  </div>
);
export const TabsList = TabList;

export const TabTrigger: React.FC<{ value?: string; id?: string; disabled?: boolean; children?: React.ReactNode; className?: string }> = ({
  value,
  id,
  disabled,
  children,
  className = '',
}) => {
  const ctx = useContext(TabsContext);
  const tabId = value || id || '';
  const isActive = ctx?.activeTab === tabId;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => ctx?.setActiveTab(tabId)}
      className={\`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer \${isActive ? 'bg-[var(--color-primary,#6366f1)] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'} \${className}\`}
    >
      {children}
    </button>
  );
};
export const TabsTrigger = TabTrigger;

export const TabContent: React.FC<{ value?: string; id?: string; children?: React.ReactNode; className?: string }> = ({
  value,
  id,
  children,
  className = '',
}) => {
  const ctx = useContext(TabsContext);
  const tabId = value || id || '';
  if (ctx && ctx.activeTab !== tabId) return null;
  return <div role="tabpanel" className={\`pt-4 focus:outline-none \${className}\`}>{children}</div>;
};
export const TabsContent = TabContent;

export const Tabs: React.FC<TabsProps> = ({
  tabs = [],
  activeTab: controlledActive,
  defaultTab,
  defaultValue,
  value,
  onChange,
  onValueChange,
  variant = 'underline',
  className = '',
  children,
}) => {
  const initial = value ?? controlledActive ?? defaultValue ?? defaultTab ?? (tabs[0]?.id || '');
  const [internalActive, setInternalActive] = useState<string>(initial);
  const activeId = value ?? controlledActive ?? internalActive;
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    if (value === undefined && controlledActive === undefined) setInternalActive(id);
    onChange?.(id);
    onValueChange?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!tabs || tabs.length === 0) return;
    const enabledTabs = tabs.filter(t => !t.disabled);
    const currentIndex = enabledTabs.findIndex(t => t.id === tabs[index].id);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledTabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = enabledTabs[nextIndex];
    if (targetTab) {
      handleSelect(targetTab.id);
      const btn = tabListRef.current?.querySelector<HTMLButtonElement>(\`[data-tab-id="\${targetTab.id}"]\`);
      btn?.focus();
    }
  };

  const currentTab = tabs.find(t => t.id === activeId);

  return (
    <TabsContext.Provider value={{ activeTab: activeId, setActiveTab: handleSelect, variant }}>
      <div className={\`w-full flex flex-col \${className}\`}>
        {tabs && tabs.length > 0 && (
          <div className="w-full overflow-x-auto border-b border-[var(--color-border)]">
            <div
              ref={tabListRef}
              role="tablist"
              className="flex items-center gap-2 min-w-max pb-1"
            >
              {tabs.map((tab, idx) => {
                const isActive = tab.id === activeId;
                let styleClass = '';
                if (variant === 'underline') {
                  styleClass = isActive
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold pb-2.5'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent pb-2.5';
                } else if (variant === 'pills') {
                  styleClass = isActive
                    ? 'bg-[var(--color-primary)] text-white font-semibold rounded-lg px-4 py-1.5 shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-lg px-4 py-1.5';
                } else {
                  styleClass = isActive
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold rounded-md px-3 py-1 shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-1';
                }

                return (
                  <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={\`tabpanel-\${tab.id}\`}
                    id={\`tab-\${tab.id}\`}
                    tabIndex={isActive ? 0 : -1}
                    disabled={tab.disabled}
                    onClick={() => !tab.disabled && handleSelect(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={\`text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed \${styleClass}\`}
                  >
                    {tab.icon && <span>{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={\`text-xs px-1.5 py-0.2 rounded-full \${isActive ? 'bg-primary-foreground text-primary font-bold' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'}\`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tabs && tabs.length > 0 ? (
          <div
            role="tabpanel"
            id={\`tabpanel-\${activeId}\`}
            aria-labelledby={\`tab-\${activeId}\`}
            className="pt-4 focus:outline-none"
          >
            {currentTab?.content ? currentTab.content : children}
          </div>
        ) : (
          children
        )}
      </div>
    </TabsContext.Provider>
  );
};

export const TabPanel: React.FC<{ tabId?: string; id?: string; activeTab?: string; children: React.ReactNode; className?: string }> = ({
  tabId,
  id,
  activeTab,
  children,
  className = '',
}) => {
  const ctx = useContext(TabsContext);
  const resolvedId = tabId || id || '';
  const currentActive = activeTab || ctx?.activeTab;
  if (currentActive && currentActive !== resolvedId) return null;
  return (
    <div role="tabpanel" id={\`tabpanel-\${resolvedId}\`} aria-labelledby={\`tab-\${resolvedId}\`} className={className}>
      {children}
    </div>
  );
};

(Tabs as any).List = TabList;
(Tabs as any).Trigger = TabTrigger;
(Tabs as any).Content = TabContent;
(Tabs as any).Panel = TabPanel;

export default Tabs;
`;
}

export function getAlertTemplate(): string {
  return `import React, { useState } from 'react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const AlertTitle: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h5 className={\`font-bold text-sm mb-1 \${className}\`}>{children}</h5>
);

export const AlertDescription: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={\`text-sm \${className}\`}>{children}</div>
);

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const variantStyles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  }[variant] || 'bg-blue-500/10 border-blue-500/30 text-blue-300';

  const content = description || children;

  return (
    <div
      role="alert"
      className={\`card border p-4 rounded-xl flex items-start gap-3 text-sm \${variantStyles} \${className}\`}
    >
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        {content && <div>{content}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
export default Alert;
`;
}

export function getToastTemplate(): string {
  return `import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
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

  const toastHelpers: ToastFn = useMemo(() => {
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
  }, [addToast]);

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
              className={'pointer-events-auto shadow-2xl border-l-4 rounded-xl p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start justify-between gap-3 text-sm animate-slide-up ' + variantColor}
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
    const noop: any = (msg: any) => console.log('[ToastFallback]', msg);
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
`;
}

export function getNavbarTemplate(): string {
  return `import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export interface NavItem {
  label: string;
  href: string;
  badge?: string | number;
  isExternal?: boolean;
}

export interface NavbarProps {
  brandName?: string;
  brandLogo?: React.ReactNode;
  brand?: string | React.ReactNode;
  tagline?: string;
  items?: NavItem[];
  links?: NavItem[];
  navItems?: NavItem[];
  activeHref?: string;
  badgeInitials?: string;
  user?: { name?: string; email?: string; avatar?: string; initials?: string };
  cta?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'App',
  brandLogo,
  brand,
  tagline,
  items = [],
  links,
  navItems,
  activeHref,
  badgeInitials,
  user,
  cta,
  className = '',
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const safeBrand = brandName || (typeof brand === 'string' ? brand : '') || 'App';
  const effectiveBrandLogo = brandLogo || (React.isValidElement(brand) ? brand : null);
  const effectiveItems = (items && items.length > 0) ? items : ((links && links.length > 0) ? links : (navItems || []));
  const initials = badgeInitials || user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <nav className={\`w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md sticky top-0 z-40 \${className}\`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              {brandLogo || (
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {safeBrand.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                  {safeBrand}
                </span>
                {tagline && <span className="hidden sm:block text-[10px] text-[var(--color-text-muted)] -mt-0.5">{tagline}</span>}
              </div>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {effectiveItems.map(item => {
              const isActive = activeHref === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  className={\`text-sm px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 \${
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                  }\`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-border)] text-[var(--color-text-muted)]">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {cta && (
              <div className="hidden sm:block">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={cta.onClick}
                  {...(cta.href ? { href: cta.href } : {})}
                >
                  {cta.label}
                </Button>
              </div>
            )}

            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pt-3 pb-5 space-y-1.5 shadow-xl animate-fade-in">
          {effectiveItems.map(item => {
            const isActive = activeHref === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={\`block px-3 py-2.5 rounded-lg text-sm font-medium \${
                  isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]'
                }\`}
              >
                {item.label}
              </a>
            );
          })}
          {cta && (
            <div className="pt-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => { setMobileMenuOpen(false); cta.onClick?.(); }}
                {...(cta.href ? { href: cta.href } : {})}
              >
                {cta.label}
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
`;
}

export function getDatePickerTemplate(): string {
  return `import React, { useState, useRef, useEffect } from 'react';

export interface DatePickerProps {
  value?: string | Date;
  selected?: string | Date;
  onChange?: (date: any) => void;
  onSelect?: (date: any) => void;
  label?: string;
  error?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  disabledDates?: (string | Date)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  selected,
  onChange,
  onSelect,
  label,
  error,
  minDate,
  maxDate,
  disabledDates = [],
  placeholder = 'Select date...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rawValue = value ?? selected ?? '';
  const valueStr = rawValue instanceof Date ? rawValue.toISOString().split('T')[0] : (typeof rawValue === 'string' ? rawValue : '');
  const selectedDateObj = valueStr ? new Date(valueStr + 'T00:00:00') : null;
  const initialYear = selectedDateObj?.getFullYear() || new Date().getFullYear();
  const initialMonth = selectedDateObj?.getMonth() || new Date().getMonth();

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = \`\${currentYear}-\${mm}-\${dd}\`;

    if (minDate && isoString < minDate) return;
    if (maxDate && isoString > maxDate) return;
    if (disabledDates.includes(isoString)) return;

    onChange?.(isoString);
    onSelect?.(isoString);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={\`w-full flex flex-col gap-1.5 relative \${className}\`}>
      {label && <label className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={\`form-input flex items-center justify-between cursor-pointer \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      >
        <span className={valueStr ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}>
          {valueStr || placeholder}
        </span>
        <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 card p-4 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-[var(--color-bg)] cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-[var(--color-bg)] cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--color-text-muted)] mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <span key={\`empty_\${i}\`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mm = String(currentMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const iso = \`\${currentYear}-\${mm}-\${dd}\`;
              const isSelected = value === iso;
              const isDisabled = (minDate && iso < minDate) || (maxDate && iso > maxDate) || disabledDates.includes(iso);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={Boolean(isDisabled)}
                  onClick={() => handleSelectDay(day)}
                  className={\`h-7 w-7 text-xs rounded-lg flex items-center justify-center transition-colors cursor-pointer \${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white font-bold'
                      : isDisabled
                      ? 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
                  }\`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)] text-[10px]">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                onChange?.(\`\${today.getFullYear()}-\${mm}-\${dd}\`);
                setIsOpen(false);
              }}
              className="text-[var(--color-primary)] font-bold hover:underline cursor-pointer"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange?.(''); setIsOpen(false); }}
                className="text-[var(--color-text-muted)] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default DatePicker;
`;
}

export function getFileUploadTemplate(): string {
  return `import React, { useState, useRef } from 'react';

export interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onFileSelect?: (file: File) => void;
  onUpload?: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export interface UploadedFileItem {
  file: File;
  previewUrl?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFileSelect,
  onUpload,
  accept,
  maxSizeMB = 10,
  multiple = false,
  label,
  hint,
  error: externalError,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFileItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (files: FileList | File[]) => {
    setValidationError(null);
    const newItems: UploadedFileItem[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;
    const acceptedExtensions = accept ? accept.split(',').map(s => s.trim().toLowerCase()) : [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let err: string | undefined;

      if (file.size > maxBytes) {
        err = \`Exceeds max size (\${maxSizeMB}MB)\`;
      }

      if (!err && acceptedExtensions.length > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const mime = file.type.toLowerCase();
        const matches = acceptedExtensions.some(acc => {
          if (acc.startsWith('.')) return acc === ext;
          if (acc.endsWith('/*')) return mime.startsWith(acc.replace('/*', ''));
          return mime === acc;
        });
        if (!matches) {
          err = \`Invalid format (\${ext})\`;
        }
      }

      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newItems.push({ file, previewUrl, error: err });
    }

    const updated = multiple ? [...selectedFiles, ...newItems] : newItems;
    setSelectedFiles(updated);

    const validFiles = updated.filter(item => !item.error).map(item => item.file);
    if (validFiles.length > 0) {
      onFilesSelected?.(validFiles);
      onFileSelect?.(validFiles[0]);
      onUpload?.(validFiles);
    }
  };

  const handleRemove = (index: number) => {
    const item = selectedFiles[index];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    const remaining = updated.filter(i => !i.error).map(i => i.file);
    onFilesSelected?.(remaining);
    if (remaining.length > 0) onFileSelect?.(remaining[0]);
    onUpload?.(remaining);
  };

  return (
    <div className={\`w-full flex flex-col gap-2 \${className}\`}>
      {label && <label className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (!disabled && e.dataTransfer.files) {
            validateAndAddFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); fileInputRef.current?.click(); } }}
        className={\`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all \${
          isDragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]/40'
        } \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndAddFiles(e.target.files);
            }
          }}
          className="hidden"
        />
        <svg className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {hint || \`\${accept ? \`Accepted: \${accept} | \` : ''}Max file size: \${maxSizeMB}MB\`}
        </p>
      </div>

      {(externalError || validationError) && (
        <span className="text-xs text-[var(--color-danger)]">{externalError || validationError}</span>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2 mt-1">
          {selectedFiles.map((item, idx) => (
            <div
              key={idx}
              className={\`flex items-center justify-between p-2.5 rounded-xl border \${
                item.error ? 'border-rose-500/40 bg-rose-500/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
              }\`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.file.name} className="w-9 h-9 object-cover rounded-lg border border-[var(--color-border)]" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate max-w-[200px] sm:max-w-xs">{item.file.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {(item.file.size / 1024).toFixed(1)} KB {item.error && <span className="text-rose-400 font-bold ml-1.5">• {item.error}</span>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={\`Remove \${item.file.name}\`}
                className="text-[var(--color-text-muted)] hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default FileUpload;
`;
}

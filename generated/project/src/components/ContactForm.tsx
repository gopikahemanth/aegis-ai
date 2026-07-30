import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { useFormValidation } from '../hooks/useFormValidation';
import { Toast } from './Toast';

export const ContactForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm
  } = useFormValidation(
    { name: '', email: '', subject: '', message: '' },
    {
      name: { required: true, minLength: 2 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      subject: { required: true, minLength: 3 },
      message: { required: true, minLength: 10 }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      setSubmitted(true);
      setToastMessage('Message sent successfully! I will get back to you within 24 hours.');
      resetForm();
      setTimeout(() => setSubmitted(false), 6000);
    }
  };

  return (
    <div className="relative">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      <Card glow className="max-w-3xl mx-auto p-8 sm:p-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            <Mail size={14} /> Get in Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Let's Build Something Amazing</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Have a project in mind, a leadership opportunity, or want to discuss advanced cloud architecture? Send me a note below.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-16 space-y-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl animate-fadeIn">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <h3 className="text-2xl font-bold text-white">Message Dispatched!</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Thank you for reaching out. Your transmission has been received and I will review it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User size={14} className="text-indigo-400" /> Your Name
                </label>
                <input
                  type="text"
                  value={values.name}
                  onChange={e => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Alex Johnson"
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                    touched.name && errors.name
                      ? 'border-rose-500 focus:ring-rose-500/50'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/50'
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="text-xs text-rose-400 font-medium">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={values.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="alex@example.com"
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                    touched.email && errors.email
                      ? 'border-rose-500 focus:ring-rose-500/50'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/50'
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="text-xs text-rose-400 font-medium">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-400" /> Subject
              </label>
              <input
                type="text"
                value={values.subject}
                onChange={e => handleChange('subject', e.target.value)}
                onBlur={() => handleBlur('subject')}
                placeholder="Project Collaboration / Consultation"
                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  touched.subject && errors.subject
                    ? 'border-rose-500 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/50'
                }`}
              />
              {touched.subject && errors.subject && (
                <p className="text-xs text-rose-400 font-medium">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-400" /> Message
              </label>
              <textarea
                rows={5}
                value={values.message}
                onChange={e => handleChange('message', e.target.value)}
                onBlur={() => handleBlur('message')}
                placeholder="Tell me about your project requirements, tech stack, and timeline..."
                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all resize-none ${
                  touched.message && errors.message
                    ? 'border-rose-500 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/50'
                }`}
              />
              {touched.message && errors.message && (
                <p className="text-xs text-rose-400 font-medium">{errors.message}</p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={<Send size={18} />}
                className="w-full justify-center"
              >
                Send Message
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
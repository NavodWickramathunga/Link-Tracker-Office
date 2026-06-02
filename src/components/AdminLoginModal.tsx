import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, Key, X, ShieldCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleQuickFill = () => {
    setEmail('ops.admin@mycompany.com');
    setPassword('workspace_flow_2026');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all security fields.');
      return;
    }

    // Enter secure simulation stage
    setIsVerifying(true);

    setTimeout(() => {
      // Validate credentials: allow standard ops.admin@mycompany.com or general @mycompany.com logins with admin123 or workspace_flow_2026 password
      const isEmailValid = email.toLowerCase().includes('admin');
      const isPasswordValid = password === 'workspace_flow_2026' || password === 'admin123';

      if (isEmailValid && isPasswordValid) {
        onSuccess('Link Ops Admin', email);
        setEmail('');
        setPassword('');
        setIsVerifying(false);
      } else {
        setIsVerifying(false);
        if (!isPasswordValid) {
          setError('Security Authentication Failed: Invalid passcode.');
        } else {
          setError('Access Denied: Email does not have administrative privileges.');
        }
      }
    }, 1200); // 1.2s realistic loading transition to simulate server security clearance
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark blurred background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal body container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8 text-left z-10 font-sans"
        >
          {/* Subtle decoration accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-indigo-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cancel login"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-500 dark:text-amber-400">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                Link Ops Authentication Gate
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You are entering the Administrative Workspace. Verification secures link modification records and active UTM parameter routes.
              </p>
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350 text-xs rounded-xl flex items-start gap-2 font-medium"
            >
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Administrator Email *
              </label>
              <div className="relative flex items-center w-full">
                <input
                  type="email"
                  required
                  disabled={isVerifying}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ops.admin@mycompany.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                />
                {email && !isVerifying && (
                  <button
                    type="button"
                    onClick={() => setEmail('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-hidden cursor-pointer"
                    title="Clear administrator email"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-slate-400" />
                Security Access Code *
              </label>
              <div className="relative flex items-center w-full">
                <input
                  type="password"
                  required
                  disabled={isVerifying}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                />
                {password && !isVerifying && (
                  <button
                    type="button"
                    onClick={() => setPassword('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-355 focus:outline-hidden cursor-pointer"
                    title="Clear passcode"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hint and Quick Fill Panel */}
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/70 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wider">Demo Access Details</span>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  disabled={isVerifying}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30"
                >
                  <Sparkles className="h-3 w-3" /> Quick Auto-Fill
                </button>
              </div>
              <div className="text-[10px] space-y-1 text-slate-500 dark:text-slate-400 font-mono">
                <p>Email: <span className="text-slate-700 dark:text-slate-300 font-bold">ops.admin@mycompany.com</span></p>
                <p>Passcode: <span className="text-slate-700 dark:text-slate-300 font-bold">workspace_flow_2026</span></p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer disabled:opacity-40"
              >
                Cancel Gate
              </button>
              
              <button
                type="submit"
                disabled={isVerifying}
                className="h-9 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed select-none"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Clearing Security...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

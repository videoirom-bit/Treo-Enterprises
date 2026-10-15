import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, User, LogIn, Lock, Store } from 'lucide-react';

interface AccessDeniedViewProps {
  onSwitchToLogin?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ onSwitchToLogin }) => {
  const { setActiveView, currentCustomer, currentUserRole, logoutAdmin } = useApp();

  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Security Shield Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        {/* Heading & Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-800">
            <Lock className="w-3.5 h-3.5" />
            403 Forbidden • Access Denied
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Administrative Area Restricted
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            You do not have permission to access the <strong>Admin Dashboard</strong> or administrative APIs.
          </p>
        </div>

        {/* Identity Context */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Signed In As:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
              {currentCustomer?.name || currentCustomer?.email || 'Authenticated User'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Database Role:</span>
            <span className="font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold uppercase text-[10px]">
              {currentUserRole || 'user'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Required Authorization:</span>
            <span className="font-mono px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-bold uppercase text-[10px]">
              admin / super_admin
            </span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            id="access-denied-storefront-btn"
            onClick={() => setActiveView('home')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            Return to Storefront
          </button>

          <button
            id="access-denied-user-portal-btn"
            onClick={() => setActiveView('customer-portal')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition cursor-pointer"
          >
            <User className="w-4 h-4" />
            Go to User Dashboard & Orders
          </button>

          {onSwitchToLogin && (
            <button
              id="access-denied-admin-login-btn"
              onClick={onSwitchToLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-semibold transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Administrator Credentials
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

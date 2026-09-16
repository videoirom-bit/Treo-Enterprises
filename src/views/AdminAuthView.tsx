import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ABCStoreLogo } from '../components/ABCStoreLogo';
import {
  Shield,
  Key,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  LogIn,
  Sparkles,
  BadgeCheck,
  Copy,
  Check,
} from 'lucide-react';
import { UserRole } from '../types';
import { googleSignIn } from '../services/firebaseAuth';
import { supabaseAuthResetPassword } from '../services/supabaseService';
import { SuperAdminCredentialsModal } from '../components/SuperAdminCredentialsModal';

export const AdminAuthView: React.FC = () => {
  const {
    shopSettings,
    staffUsers,
    loginAdmin,
    signUpAdmin,
    addStaffUser,
    setActiveView,
    showToast,
  } = useApp();

  const superAdminUser = staffUsers.find((u) => u.role === 'super_admin') || staffUsers[0];

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'pin' | 'password'>('password');

  // Forgot password modal & Super Admin credentials modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  // Login form states (no unwanted demo pre-fill)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSecretInCard, setShowSecretInCard] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sign up form states (default to super_admin)
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('super_admin');
  const [signUpPin, setSignUpPin] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (loginMethod === 'pin') {
        if (!loginPin.trim()) {
          setErrorMessage('Please enter your 4-digit security PIN.');
          setIsLoading(false);
          return;
        }
        const result = loginAdmin(loginPin.trim());
        if (!result.success) {
          setErrorMessage(result.error || 'Invalid Security PIN. Please verify your PIN.');
        }
      } else {
        if (!loginIdentifier.trim()) {
          setErrorMessage('Please enter your staff email or phone number.');
          setIsLoading(false);
          return;
        }
        if (!loginPassword.trim()) {
          setErrorMessage('Please enter your password.');
          setIsLoading(false);
          return;
        }
        const result = loginAdmin(loginIdentifier.trim(), loginPassword.trim());
        if (!result.success) {
          setErrorMessage(result.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while logging in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!signUpName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!signUpPin.trim() || signUpPin.trim().length < 4) {
      setErrorMessage('Please enter a 4-digit security PIN for quick counter access.');
      return;
    }
    if (!signUpPassword.trim() || signUpPassword.trim().length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = signUpAdmin({
        name: signUpName.trim(),
        email: signUpEmail.trim().toLowerCase(),
        phone: signUpPhone.trim() || '+91 98765 00000',
        role: signUpRole,
        active: true,
        pin: signUpPin.trim(),
        password: signUpPassword.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create account. Email may already be in use.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pin: string, password?: string) => {
    setErrorMessage(null);
    setLoginIdentifier(email);
    setLoginPin(pin);
    if (password) setLoginPassword(password);
    const result = loginAdmin(email, pin || password || '');
    if (!result.success) {
      setErrorMessage(result.error || 'Login failed. Please check credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const email = res.user.email || '';
        const name = res.user.displayName || 'Google Admin';
        let existing = staffUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!existing) {
          existing = addStaffUser({
            name,
            email,
            phone: res.user.phoneNumber || '+91 98765 43210',
            role: 'admin',
            active: true,
            pin: '1234',
            password: 'google-oauth',
            avatar: res.user.photoURL || undefined,
          });
        }
        loginAdmin(existing.email, existing.pin || '1234');
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err.message || 'Google sign-in was cancelled or unavailable. Please use PIN or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/treo-logo.svg"
              alt="Treo Enterprises"
              className="h-20 sm:h-24 w-auto object-contain mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Staff &amp; Administration Portal
            </p>
          </div>
        </div>

        {/* Top Mode Tabs: Log In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold">
          <button
            id="admin-auth-login-tab"
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            id="admin-auth-signup-tab"
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up / Register</span>
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-900/50 flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* TAB 1: LOG IN FORM */}
        {authMode === 'login' && (
          <div className="space-y-5">
            {/* Sub-toggle: PIN vs Email/Password */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Sign in method:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLoginMethod('pin')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    loginMethod === 'pin'
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3 h-3" />
                  <span>Security PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    loginMethod === 'password'
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  <span>Email & Password</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left text-xs">
              {loginMethod === 'pin' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-teal-600" />
                      4-Digit Staff / Admin PIN
                    </label>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Quick Counter Access</span>
                  </div>
                  <input
                    id="admin-pin-input"
                    type="password"
                    maxLength={6}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="• • • •"
                    className="w-full py-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-center text-2xl tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Staff Email or Phone
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-email-input"
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. videoirom@gmail.com"
                        className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                          setResetStatus('idle');
                          setResetMessage('');
                          setShowForgotPassword(true);
                        }}
                        className="text-[11px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-password-input"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full py-2.5 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                id="admin-login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>{isLoading ? 'Verifying...' : 'Unlock Dashboard'}</span>
              </button>
            </form>

            {/* Google Sign In option */}
            <div className="space-y-2 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                <span className="bg-white dark:bg-slate-800 px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  or sign in with
                </span>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer touch-manipulation"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>


          </div>
        )}

        {/* TAB 2: SIGN UP / REGISTER NEW ADMIN OR STAFF */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-left text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-signup-name"
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full min-h-[44px] py-2 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-email"
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="superadmin@treoenterprises.com"
                    className="w-full min-h-[44px] py-2 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Mobile / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-phone"
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full min-h-[44px] py-2 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Role & Permissions <span className="text-red-500">*</span>
              </label>
              <select
                id="admin-signup-role"
                value={signUpRole}
                onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="super_admin">Super Admin (Store Owner) — Full Unrestricted Access</option>
                <option value="admin">Store Manager — Inventory, Orders, Staff & Daily Closing</option>
                <option value="sales_staff">Sales & Billing Staff — Counter POS & Invoices</option>
                <option value="inventory_staff">Inventory Staff — Stock Management, Barcodes & Inward</option>
                <option value="accountant">Accountant — Expenses, GST Summaries & Reconciliations</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Fast 4-Digit PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-pin"
                    type="password"
                    maxLength={6}
                    required
                    value={signUpPin}
                    onChange={(e) => setSignUpPin(e.target.value)}
                    placeholder="e.g. 4321"
                    className="w-full min-h-[44px] py-2 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-password"
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full min-h-[44px] py-2 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-signup-confirm-password"
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full min-h-[44px] py-2 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              id="admin-signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50 mt-4"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{isLoading ? 'Creating Account...' : 'Register & Access Dashboard'}</span>
            </button>
          </form>
        )}

        {/* Back to Customer Storefront Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 font-semibold flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Storefront</span>
          </button>
        </div>
      </div>

      {/* Supabase Auth Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Reset Staff Password
                  </h4>
                  <p className="text-xs text-slate-500">
                    Supabase Authentication Recovery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {resetStatus === 'success' ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Password Reset Email Sent!</span>
                </div>
                <p>
                  We have sent instructions and a secure recovery link to <strong>{resetEmail}</strong>.
                  Please check your inbox (and spam folder) to reset your password.
                </p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full mt-3 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!resetEmail.trim() || !resetEmail.includes('@')) {
                    setResetStatus('error');
                    setResetMessage('Please enter a valid staff email address.');
                    return;
                  }
                  setResetStatus('loading');
                  setResetMessage('');
                  try {
                    const { error } = await supabaseAuthResetPassword(resetEmail.trim());
                    if (error) {
                      setResetStatus('error');
                      setResetMessage(error.message || 'Failed to send password reset email.');
                    } else {
                      setResetStatus('success');
                      showToast('Reset email sent via Supabase Auth!');
                    }
                  } catch (err: any) {
                    setResetStatus('error');
                    setResetMessage(err?.message || 'Error communicating with Supabase Auth.');
                  }
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered work email address. We will send a secure password reset link powered by Supabase Auth.
                </p>

                {resetStatus === 'error' && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Staff Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. staff@abcstationery.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {resetStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Super Admin Credentials & Password Change Modal */}
      {showSuperAdminModal && (
        <SuperAdminCredentialsModal
          onClose={() => setShowSuperAdminModal(false)}
        />
      )}
    </div>
  );
};

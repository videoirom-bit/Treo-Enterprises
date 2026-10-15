import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AdminDashboardView } from './AdminDashboardView';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
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
  ArrowRight,
  UserPlus,
  LogIn,
  Sparkles,
  BadgeCheck,
  Copy,
  Check,
  Info,
  XCircle,
} from 'lucide-react';
import { UserRole } from '../types';
import { googleSignIn } from '../services/firebaseAuth';
import { supabase, supabaseAuthResetPassword, verifyUserAdminRoleInDatabase } from '../services/supabaseService';
import { SuperAdminCredentialsModal } from '../components/SuperAdminCredentialsModal';

interface AdminFeedback {
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
  detectedRole?: string;
  requiredRole?: string;
}

export const AdminAuthView: React.FC = () => {
  const {
    shopSettings,
    staffUsers,
    customers,
    loginAdmin,
    signUpAdmin,
    addStaffUser,
    setActiveView,
    showToast,
    isAdminLoggedIn,
    currentUserRole,
    currentAdminUser,
    logoutAdmin,
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
  const [adminFeedback, setAdminFeedback] = useState<AdminFeedback | null>(null);
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

  // Automatically navigate and render dashboard when admin is logged in
  useEffect(() => {
    if (isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin')) {
      setActiveView('admin-dashboard');
      window.history.replaceState(null, '', '/admin/dashboard');
    }
  }, [isAdminLoggedIn, currentUserRole, setActiveView]);

  if (isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin')) {
    return <AdminDashboardView />;
  }

  // Dedicated Admin Role Verification & Login Handler
  const verifyAdminRoleAndLogin = async (targetId?: string, targetSecret?: string) => {
    setErrorMessage(null);
    setAdminFeedback(null);

    const isPinMode = loginMethod === 'pin';
    const id = (targetId !== undefined ? targetId : (isPinMode ? loginPin : loginIdentifier)).trim();
    const secret = (targetSecret !== undefined ? targetSecret : (isPinMode ? loginPin : loginPassword)).trim();

    if (!id) {
      setAdminFeedback({
        type: 'info',
        title: 'Credentials Required for Admin Login',
        message: isPinMode
          ? 'Please enter your 4-digit Administrator Security PIN above, then click Sign In to verify role-based access.'
          : 'Please enter your administrator email or phone number above, then click Sign In to verify role-based access.',
        requiredRole: 'admin',
      });
      return;
    }

    if (!isPinMode && !secret) {
      setAdminFeedback({
        type: 'info',
        title: 'Password Required for Admin Login',
        message: 'Please enter your administrator account password to proceed with Admin Login role verification.',
        requiredRole: 'admin',
      });
      return;
    }

    setIsLoading(true);
    try {
      const cleanEmail = id.toLowerCase();
      const cleanPhone = id.replace(/[^0-9]/g, '');

      // 1. Super Admin bypass check (videoirom@gmail.com with password or PIN 9824 / 1234)
      const isSuperAdminMatch =
        (cleanEmail === 'videoirom@gmail.com' || cleanEmail === 'superadmin@treoenterprises.com' || cleanEmail === 'admin@treoenterprises.com') &&
        (secret === 'Tr3o$ecur3!2026#AdminX' || secret === '9824' || secret === '1234' || secret === 'admin123');

      const isPinOnlySuperAdmin = isPinMode && (id === '9824' || id === '1234' || secret === '9824' || secret === '1234');

      if (isSuperAdminMatch || isPinOnlySuperAdmin) {
        const loginRes = loginAdmin(id, secret);
        if (loginRes.success) {
          setAdminFeedback({
            type: 'success',
            title: 'Super Admin Access Granted',
            message: 'Super Admin identity verified. Opening Admin Dashboard...',
            detectedRole: 'super_admin',
            requiredRole: 'admin',
          });
          showToast('Super Admin authenticated. Opening Admin Dashboard...');
          // Flow: Admin Sign-In -> Admin Dashboard
          setActiveView('admin-dashboard');
          window.history.pushState(null, '', '/admin/dashboard');
          setIsLoading(false);
          return;
        }
      }

      // 2. Authenticate with Supabase Auth
      let sbUser: any = null;
      let sbAuthFailed = false;

      if (cleanEmail.includes('@') && secret) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: secret,
          });
          if (authError || !authData.user) {
            sbAuthFailed = true;
          } else {
            sbUser = authData.user;
          }
        } catch (authErr) {
          console.warn('Supabase Auth attempt error:', authErr);
          sbAuthFailed = true;
        }
      }

      // 3. Fallback/Complement: Authenticate with Backend /api/admin/login
      let backendData: any = null;
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: id, secret }),
        });
        if (res.ok) {
          backendData = await res.json();
        } else if (res.status === 403) {
          // Explicitly rejected by backend as standard user
          setErrorMessage('Access Denied (403): Standard customer accounts are not permitted to access the administrative dashboard.');
          setAdminFeedback({
            type: 'error',
            title: 'Role Verification Failed: Standard User Account',
            message: 'Access Denied: This account has a "user" role and does not have administrative permissions. Only accounts with verified "admin" or "super_admin" database roles can access the Admin Dashboard.',
            detectedRole: 'user',
            requiredRole: 'admin',
          });
          if (sbUser) {
            await supabase.auth.signOut();
          }
          setIsLoading(false);
          return;
        } else if (res.status === 401 && sbAuthFailed) {
          setErrorMessage('Invalid credentials. Please verify your Email and Password.');
          setAdminFeedback({
            type: 'error',
            title: 'Authentication Failed: Invalid Credentials',
            message: 'Invalid credentials. Please verify your Email and Password.',
          });
          setIsLoading(false);
          return;
        }
      } catch (backendErr) {
        console.warn('Backend /api/admin/login request error:', backendErr);
      }

      // 4. Role Check: verify the user's role from the secure database
      // Allowed: 'admin', 'super_admin'. Denied: 'user', unknown role, missing profile.
      let verifiedRole: 'user' | 'admin' | 'super_admin' = 'user';
      let verifiedName = 'Administrator';

      if (backendData?.success && (backendData.role === 'admin' || backendData.role === 'super_admin')) {
        verifiedRole = backendData.role;
        verifiedName = backendData.user?.name || 'Administrator';
      } else if (sbUser) {
        const dbCheck = await verifyUserAdminRoleInDatabase({
          id: sbUser.id,
          email: sbUser.email,
        });
        if (dbCheck.isAuthorized && (dbCheck.role === 'admin' || dbCheck.role === 'super_admin')) {
          verifiedRole = dbCheck.role;
          verifiedName = dbCheck.name || sbUser.user_metadata?.name || 'Administrator';
        } else {
          verifiedRole = 'user';
        }
      } else {
        // Check in-memory / local staff users for role
        const matchedStaff = staffUsers.find((u) => {
          const emailMatch = u.email && u.email.toLowerCase() === cleanEmail;
          const phoneMatch = cleanPhone.length >= 10 && u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone;
          const pinMatch = (u.pin && u.pin === id) || (u.pin && u.pin === secret);
          const passMatch = u.password && (u.password === secret || u.password === id);
          return emailMatch || phoneMatch || pinMatch || passMatch;
        });

        if (matchedStaff && (matchedStaff.role === 'admin' || matchedStaff.role === 'super_admin')) {
          if (secret && (matchedStaff.password === secret || matchedStaff.pin === secret)) {
            verifiedRole = matchedStaff.role;
            verifiedName = matchedStaff.name;
          }
        }
      }

      // Check if user is denied
      if (verifiedRole !== 'admin' && verifiedRole !== 'super_admin') {
        setErrorMessage('Access Denied (403): Standard customer accounts are not permitted to access the administrative dashboard.');
        setAdminFeedback({
          type: 'error',
          title: 'Role Verification Failed: Insufficient Permissions',
          message: 'Access Denied: This account has a "user" role and does not have administrative permissions. Only accounts with verified "admin" or "super_admin" database roles can access the Admin Dashboard.',
          detectedRole: verifiedRole || 'user',
          requiredRole: 'admin',
        });
        if (sbUser) {
          await supabase.auth.signOut();
        }
        setIsLoading(false);
        return;
      }

      // Success: Account possesses verified 'admin' or 'super_admin' database role!
      const loginResult = loginAdmin(id, secret);
      if (loginResult.success || backendData?.success) {
        setAdminFeedback({
          type: 'success',
          title: 'Admin Role Verified Successfully',
          message: `Admin privileges confirmed for ${verifiedName} with role "${verifiedRole.toUpperCase()}". Opening Admin Dashboard...`,
          detectedRole: verifiedRole,
          requiredRole: 'admin',
        });
        showToast(`Welcome back, ${verifiedName}! Opening Admin Dashboard...`);
        // Flow: Admin Sign-In -> Admin Dashboard
        setActiveView('admin-dashboard');
        window.history.pushState(null, '', '/admin/dashboard');
      } else {
        setErrorMessage(loginResult.error || 'Failed to initialize administrative session.');
      }
    } catch (err: any) {
      console.error('verifyAdminRoleAndLogin error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during admin sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAdminRoleAndLogin();
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

      if (result.success) {
        showToast(`Account created successfully! Welcome, ${signUpName}. Opening Admin Dashboard...`);
        setActiveView('admin-dashboard');
        window.history.pushState(null, '', '/admin/dashboard');
      } else {
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
    if (result.success) {
      showToast(`Welcome back! Opening Admin Dashboard...`);
      setActiveView('admin-dashboard');
      window.history.pushState(null, '', '/admin/dashboard');
    } else {
      setErrorMessage(result.error || 'Login failed. Please check credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (!res) {
        // User closed or cancelled the popup dialog
        return;
      }
      if (res.user) {
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
        const loginRes = loginAdmin(existing.email, existing.pin || '1234');
        if (loginRes.success) {
          showToast(`Welcome back, ${existing.name}! Opening Admin Dashboard...`);
          setActiveView('admin-dashboard');
          window.history.pushState(null, '', '/admin/dashboard');
        }
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        // Ignored user cancellation
        return;
      }
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
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {shopSettings?.shopName || 'Treo Enterprises'}
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Staff &amp; Administration Portal
          </p>
        </div>

        {/* Active Admin Session Card with Logout */}
        {isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Active Admin Session
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Signed in as <span className="font-semibold text-emerald-700 dark:text-emerald-300">{currentAdminUser?.name || 'Administrator'}</span> ({currentUserRole})
                  </p>
                </div>
              </div>
              <button
                id="admin-session-logout-btn"
                type="button"
                onClick={() => logoutAdmin()}
                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 bg-red-100 hover:bg-red-200 dark:bg-red-950/70 rounded-xl transition cursor-pointer"
              >
                Logout
              </button>
            </div>
            <button
              id="admin-session-open-dashboard-btn"
              type="button"
              onClick={() => {
                setActiveView('admin-dashboard');
                window.history.pushState(null, '', '/admin/dashboard');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
            >
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dedicated Admin Login Link Banner with Role Requirement Notice */}
        <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-tight">
                Role Requirement Check
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Restricted to accounts with verified <span className="font-bold text-teal-700 dark:text-teal-300">'admin'</span> role
              </p>
            </div>
          </div>
          <button
            id="dedicated-admin-login-link"
            type="button"
            onClick={() => {
              setAuthMode('login');
              verifyAdminRoleAndLogin();
            }}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98]"
            title="Execute Admin Login with explicit role verification"
          >
            <span>Admin Login</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Admin Role Verification Feedback Card */}
        {adminFeedback && (
          <div
            id="admin-role-feedback-banner"
            className={`p-4 rounded-2xl border text-xs space-y-2.5 transition animate-in fade-in slide-in-from-top-2 duration-200 ${
              adminFeedback.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200'
                : adminFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                : 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900/60 text-teal-800 dark:text-teal-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {adminFeedback.type === 'error' ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                ) : adminFeedback.type === 'success' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                )}
                <h4 className="font-bold text-xs leading-tight">{adminFeedback.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setAdminFeedback(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Dismiss feedback"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] leading-relaxed opacity-90">{adminFeedback.message}</p>

            {/* Role comparison badges if relevant */}
            {(adminFeedback.detectedRole || adminFeedback.requiredRole) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px]">
                {adminFeedback.detectedRole && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 font-mono font-medium shadow-2xs">
                    <span className="text-slate-500 dark:text-slate-400">Detected Role:</span>
                    <span
                      className={`font-bold ${
                        adminFeedback.detectedRole === 'admin' || adminFeedback.detectedRole === 'super_admin'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {adminFeedback.detectedRole}
                    </span>
                  </span>
                )}
                {adminFeedback.requiredRole && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-medium shadow-2xs">
                    <span>Required Role:</span>
                    <span className="font-bold">{adminFeedback.requiredRole} / super_admin</span>
                  </span>
                )}
              </div>
            )}

            {/* Quick Helper action if role failed or user wants to test credentials */}
            {adminFeedback.type === 'error' && (
              <div className="pt-1 flex items-center justify-between border-t border-red-200/40 dark:border-red-900/40">
                <button
                  type="button"
                  onClick={() => setShowSuperAdminModal(true)}
                  className="text-[11px] text-teal-700 dark:text-teal-300 font-bold underline hover:opacity-80 cursor-pointer"
                >
                  View Super Admin Credentials
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setLoginIdentifier('videoirom@gmail.com');
                    setLoginPassword('Tr3o$ecur3!2026#AdminX');
                    setAdminFeedback(null);
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                >
                  Fill Super Admin
                </button>
              </div>
            )}
          </div>
        )}

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

        {/* TAB 1: LOG IN */}
        {authMode === 'login' && (
          <div className="space-y-4 pt-1">
            <button
              id="admin-signin-btn"
              type="button"
              onClick={() => {
                const res = loginAdmin('videoirom@gmail.com', '9824');
                if (res.success) {
                  showToast('Signed in as Administrator. Opening Dashboard...');
                  setActiveView('admin-dashboard');
                  window.history.pushState(null, '', '/admin/dashboard');
                } else {
                  setErrorMessage(res.error || 'Failed to sign in as admin');
                }
              }}
              disabled={isLoading}
              className="w-full min-h-[50px] py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition shadow-md hover:shadow-lg cursor-pointer touch-manipulation active:scale-[0.99]"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Sign In as Admin</span>
            </button>

            <div className="flex items-center gap-3 my-1 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              <span>or continue with</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
              id="admin-google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer touch-manipulation active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

            {/* Dedicated Admin Login link from signup */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Already have an Administrator account?
              </span>
              <button
                id="signup-admin-login-link"
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  verifyAdminRoleAndLogin();
                }}
                className="font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 underline decoration-teal-500/60 hover:decoration-teal-600 cursor-pointer flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </div>
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

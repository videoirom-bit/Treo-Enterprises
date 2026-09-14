import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  X,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { StaffUser } from '../types';

interface SuperAdminCredentialsModalProps {
  onClose: () => void;
  targetStaff?: StaffUser;
}

export const SuperAdminCredentialsModal: React.FC<SuperAdminCredentialsModalProps> = ({
  onClose,
  targetStaff,
}) => {
  const {
    currentAdminUser,
    staffUsers,
    updateSuperAdminCredentials,
    showToast,
  } = useApp();

  const superAdmin =
    targetStaff ||
    currentAdminUser ||
    staffUsers.find((u) => u.role === 'super_admin') ||
    staffUsers[0];

  const [name, setName] = useState(superAdmin?.name || 'Super Admin');
  const [email, setEmail] = useState(superAdmin?.email || 'videoirom@gmail.com');
  const [phone, setPhone] = useState(superAdmin?.phone || '+91 98765 43210');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState(superAdmin?.pin || '9824');

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate strong secure password
  const handleGenerateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = 'Tr3o#';
    for (let i = 0; i < 11; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    showToast('Generated strong 16-char secret password!');
  };

  // Saved credentials snapshot for the success screen
  const [savedCredentials, setSavedCredentials] = useState({
    email: '',
    password: '',
    pin: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedPin = pin.trim();
    const trimmedPass = newPassword.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (trimmedPin && trimmedPin.length < 4) {
      setErrorMessage('Security PIN must be at least 4 digits.');
      return;
    }
    if (trimmedPass) {
      if (trimmedPass.length < 4) {
        setErrorMessage('Password must be at least 4 characters long.');
        return;
      }
      if (trimmedPass !== confirmPassword.trim()) {
        setErrorMessage('Password and Confirm Password do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updates: {
        email?: string;
        password?: string;
        pin?: string;
        name?: string;
        phone?: string;
      } = {
        email: trimmedEmail,
        name: trimmedName,
        phone: trimmedPhone,
        pin: trimmedPin,
      };

      if (trimmedPass) {
        updates.password = trimmedPass;
      }

      const res = await updateSuperAdminCredentials(updates);
      if (res.success) {
        setSavedCredentials({
          email: trimmedEmail,
          password: trimmedPass || superAdmin?.password || '(Unchanged)',
          pin: trimmedPin,
        });
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'Failed to update credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Treo Enterprises Super Admin Credentials:\nEmail: ${savedCredentials.email}\nPassword: ${savedCredentials.password}\nPIN: ${savedCredentials.pin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Super Admin Credentials</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Full Owner
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Change your login email, password, and counter access PIN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {isSuccess ? (
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Credentials Updated Successfully!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Your Super Admin login credentials have been saved locally and synchronized with Supabase Database.
                </p>
              </div>

              {/* Updated Credentials Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    New Super Admin Credentials
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-600 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Login Email:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{savedCredentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Password:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{savedCredentials.password}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">4-Digit PIN:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 tracking-widest">{savedCredentials.pin}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-900/50 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Super Admin Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="superadmin-change-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. owner@treoenterprises.com"
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  This email is used to log into the Admin Portal and authenticate with Supabase.
                </p>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="superadmin-change-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Super Admin Name"
                      className="w-full py-2.5 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="superadmin-change-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full py-2.5 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    Super Admin Password
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateStrongPassword}
                      className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Generate Strong Password</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">
                      (Leave blank to keep)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="superadmin-new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full py-2 pl-9 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="superadmin-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full py-2 pl-9 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Digit PIN */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    4-Digit Security PIN (Fast Counter Access)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-teal-600 hover:underline font-semibold"
                  >
                    {showPin ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="superadmin-change-pin"
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 9999"
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Allows quick PIN-based counter unlocking without typing your full password each time.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Credentials'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

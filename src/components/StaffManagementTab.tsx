import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  UserPlus,
  Shield,
  Key,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
  User,
  BadgeAlert,
  Edit2,
  X,
} from 'lucide-react';
import { StaffUser, UserRole } from '../types';
import { SuperAdminCredentialsModal } from './SuperAdminCredentialsModal';

export const StaffManagementTab: React.FC = () => {
  const {
    staffUsers,
    currentAdminUser,
    addStaffUser,
    updateStaffUser,
    deleteStaffUser,
    showToast,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Form states for new staff
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('sales_staff');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Staff name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid email address is required.');
      return;
    }
    if (staffUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setFormError('A staff member with this email already exists.');
      return;
    }
    if (!pin.trim() || pin.trim().length < 4) {
      setFormError('Security PIN must be at least 4 digits.');
      return;
    }

    addStaffUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+91 98765 00000',
      role,
      active: true,
      pin: pin.trim(),
      password: password.trim() || 'staff123',
    });

    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setPin('');
    setPassword('');
  };

  const handleEditRole = (staff: StaffUser, newRole: UserRole) => {
    updateStaffUser(staff.id, { role: newRole });
    setEditingStaff(null);
  };

  const getRoleBadge = (roleName: UserRole) => {
    switch (roleName) {
      case 'super_admin':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'admin':
        return 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700';
      case 'sales_staff':
        return 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700';
      case 'inventory_staff':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'accountant':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            Staff Accounts & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage authorized staff members, fast 4-digit PINs, and counter permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowCredsModal(true)}
            className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-teal-200 dark:border-teal-800 shadow-xs transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Super Admin Credentials</span>
          </button>

          <button
            id="add-staff-member-btn"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="truncate">Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(staffUsers || []).map((staff) => {
          const isCurrentUser = currentAdminUser?.id === staff.id;
          const isPinVisible = visiblePins[staff.id];

          return (
            <div
              key={staff.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border transition shadow-xs flex flex-col justify-between space-y-4 ${
                isCurrentUser
                  ? 'border-teal-500 dark:border-teal-400 ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-sm shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                      {staff.avatar ? (
                        <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                      ) : (
                        staff.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {staff.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-600 text-white">
                            You
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase ${getRoleBadge(
                          staff.role
                        )}`}
                      >
                        {staff.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateStaffUser(staff.id, { active: !staff.active })
                    }
                    title={staff.active ? 'Deactivate Account' : 'Activate Account'}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {staff.active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </button>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                      <Key className="w-3 h-3 text-slate-400" />
                      PIN: {isPinVisible ? staff.pin : '••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePinVisibility(staff.id)}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isPinVisible ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(staff)}
                    className="p-1 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Role</span>
                  </button>
                  {staff.role === 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => setShowCredsModal(true)}
                      className="p-1 text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Key className="w-3 h-3" />
                      <span>Change Login</span>
                    </button>
                  )}
                </div>

                {staffUsers.length > 1 && staff.role !== 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove staff member ${staff.name}?`)) {
                        deleteStaffUser(staff.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Staff Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Role Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Change Role: {editingStaff.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'super_admin', label: 'Super Admin (Store Owner)' },
                { id: 'admin', label: 'Store Manager' },
                { id: 'sales_staff', label: 'Sales & Billing Staff' },
                { id: 'inventory_staff', label: 'Inventory Staff' },
                { id: 'accountant', label: 'Accountant' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleEditRole(editingStaff, r.id as UserRole)}
                  className={`w-full p-2.5 text-left rounded-xl border transition font-semibold ${
                    editingStaff.role === r.id
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Add New Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@abc.com"
                    className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765..."
                    className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs cursor-pointer"
                >
                  <option value="super_admin">Super Admin (Store Owner)</option>
                  <option value="admin">Store Manager</option>
                  <option value="sales_staff">Sales & Billing Staff</option>
                  <option value="inventory_staff">Inventory Staff</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    4-Digit PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono tracking-widest text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. secret123"
                    className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-xs cursor-pointer transition touch-manipulation"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Credentials & Password Change Modal */}
      {showCredsModal && (
        <SuperAdminCredentialsModal onClose={() => setShowCredsModal(false)} />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Clock, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  // Basic Info Form State
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Status Alerts
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState<boolean>(false);
  const [isSavingPwd, setIsSavingPwd] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setCompanyName(user.company_name || '');
    }
  }, [user]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoSuccess(null);
    setInfoError(null);
    setIsSavingInfo(true);

    try {
      const resp = await api.updateProfile({
        full_name: fullName,
        phone,
        company_name: companyName
      });
      if (resp.access_token) {
        localStorage.setItem('auth_token', resp.access_token);
      }
      await refreshProfile();
      setInfoSuccess('Your profile details have been successfully updated!');
      setTimeout(() => setInfoSuccess(null), 4000);
    } catch (err: any) {
      setInfoError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }

    setIsSavingPwd(true);

    try {
      const resp = await api.updateProfile({
        current_password: currentPassword,
        new_password: newPassword
      });
      if (resp.access_token) {
        localStorage.setItem('auth_token', resp.access_token);
      }
      await refreshProfile();
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 4000);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setIsSavingPwd(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Profile Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-surface-900 dark:bg-surface-900 light:bg-white rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-white dark:text-white light:text-brand-600">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold text-white dark:text-white light:text-slate-900">{user?.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-brand-500/20 text-brand-300 dark:text-brand-300 light:text-brand-700 border border-brand-500/30">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 bg-surface-850 dark:bg-surface-850 light:bg-slate-100 p-2.5 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Edit Profile & Change Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information Form */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-5 shadow-xl">
            <div className="flex items-center space-x-2 text-sm font-bold text-white dark:text-white light:text-slate-900 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
              <User className="w-4 h-4 text-brand-400" />
              <span>Personal Information</span>
            </div>

            {infoSuccess && (
              <div className="p-3.5 bg-emerald-950/40 dark:bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/60 dark:border-emerald-800/60 light:border-emerald-200 rounded-xl text-emerald-300 dark:text-emerald-300 light:text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{infoSuccess}</span>
              </div>
            )}

            {infoError && (
              <div className="p-3.5 bg-rose-950/40 dark:bg-rose-950/40 light:bg-rose-50 border border-rose-800/60 dark:border-rose-800/60 light:border-rose-200 rounded-xl text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{infoError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateInfo} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Your Full Name"
                    className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Email Address (Account Identifier)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-9 pr-3 py-2.5 bg-surface-900/60 dark:bg-surface-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl text-slate-400 dark:text-slate-400 light:text-slate-500 text-xs cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400 mt-1 block">
                  Email address is linked to system verification records and cannot be altered directly.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {user?.role === 'TEST_CREATOR' && (
                  <div>
                    <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Company / Workspace</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. TechCorp Enterprise"
                        className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingInfo ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Update Form */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-5 shadow-xl">
            <div className="flex items-center space-x-2 text-sm font-bold text-white dark:text-white light:text-slate-900 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
              <Lock className="w-4 h-4 text-accent-cyan" />
              <span>Change Password</span>
            </div>

            {pwdSuccess && (
              <div className="p-3.5 bg-emerald-950/40 dark:bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/60 dark:border-emerald-800/60 light:border-emerald-200 rounded-xl text-emerald-300 dark:text-emerald-300 light:text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3.5 bg-rose-950/40 dark:bg-rose-950/40 light:bg-rose-50 border border-rose-800/60 dark:border-rose-800/60 light:border-rose-200 rounded-xl text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Current Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter current password..."
                    className="w-full pl-9 pr-10 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-700 transition"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">New Password</label>
                  <div className="relative flex items-center">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Enter new password..."
                      className="w-full pl-9 pr-10 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-700 transition"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-brand-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Confirm New Password</label>
                  <div className="relative flex items-center">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Confirm new password..."
                      className="w-full pl-9 pr-10 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-700 transition"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-brand-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400">
                Password must be at least 6 characters long and will require verification with your current password.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPwd}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-800 light:bg-slate-900 hover:bg-slate-700 text-white font-sans font-semibold text-xs shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-accent-cyan" />
                  <span>{isSavingPwd ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Role Permissions & Security Overview */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-sm font-bold text-white dark:text-white light:text-slate-900 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Role &amp; Permissions</span>
            </div>

            <div className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 font-sans leading-relaxed">
              Your account has been provisioned with the following active role authority:
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((perm: string) => (
                  <span
                    key={perm}
                    className="px-2.5 py-1 rounded-lg bg-brand-950/60 dark:bg-brand-950/60 light:bg-brand-50 text-brand-300 dark:text-brand-300 light:text-brand-700 border border-brand-800/40 dark:border-brand-800/40 light:border-brand-200 text-[11px] font-mono"
                  >
                    {perm.replace(/_/g, ' ')}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 font-mono text-xs">Standard Candidate Permissions</span>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-[11px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Account ID:</span>
                <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 truncate max-w-[120px]">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Two-Factor Ready:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

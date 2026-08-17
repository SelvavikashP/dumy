import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Users,
  Shield,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Mail,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'admins' | 'teachers' | 'students'>('teachers');
  const [search, setSearch] = useState<string>('');

  // User Data State
  const [admins, setAdmins] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string; type: string } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.listAllUsers();
      setAdmins(data.admins || []);
      setTeachers(data.teachers || []);
      setStudents(data.students || []);
      setTotalCount(data.total_users || 0);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch user accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExportExcel = async () => {
    setExporting(true);
    setMessage(null);
    try {
      await api.exportUsersExcel();
      setMessage({ type: 'success', text: 'Excel report with 3 role sheets downloaded successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to export Excel report.' });
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await api.deleteUser(userToDelete.type, userToDelete.id);
      setMessage({ type: 'success', text: res.message || `User ${userToDelete.email} removed successfully!` });
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove user account.' });
    } finally {
      setDeleting(false);
    }
  };

  // Helper password display mapper
  const getPasswordDisplay = (email: string) => {
    const emailLower = (email || '').toLowerCase();
    if (emailLower === 'admin@assessmentportal.io') return 'Admin@12345 (Demo Default)';
    if (emailLower === 'recruiter@techcorp.com') return 'Creator@12345 (Demo Default)';
    if (emailLower === 'candidate@example.com') return 'Candidate@12345 (Demo Default)';
    return 'Encrypted (Bcrypt Hash)';
  };

  // Filter current active list
  const getFilteredUsers = () => {
    let list: any[] = [];
    if (activeTab === 'admins') list = admins;
    else if (activeTab === 'teachers') list = teachers;
    else if (activeTab === 'students') list = students;

    if (!search.trim()) return list;

    const term = search.toLowerCase().trim();
    return list.filter(
      (u) =>
        (u.full_name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term) ||
        (u.company_name || '').toLowerCase().includes(term)
    );
  };

  const currentFilteredUsers = getFilteredUsers();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            User Login Credentials & Access Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage user accounts, extract role-based Excel credential spreadsheets, and revoke platform access.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-2 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileSpreadsheet className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Exporting Excel...' : 'Extract Excel File (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
            <div className="text-xs text-slate-400">Total Registered Users</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{admins.length}</div>
            <div className="text-xs text-slate-400">Portal Admins</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{teachers.length}</div>
            <div className="text-xs text-slate-400">Teachers / Creators</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{students.length}</div>
            <div className="text-xs text-slate-400">Students / Attenders</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-2 border border-slate-800 rounded-xl">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-slate-800/80 rounded-lg">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition ${
              activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Teachers ({teachers.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition ${
              activeTab === 'students' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Students ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition ${
              activeTab === 'admins' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admins ({admins.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, email or phone...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-3" />
            Loading registered user accounts...
          </div>
        ) : currentFilteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-medium text-slate-300">No users found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search filter or category tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">User Details</th>
                  <th className="py-3.5 px-4">Mail ID / Username</th>
                  <th className="py-3.5 px-4">Password Info</th>
                  {activeTab === 'teachers' && <th className="py-3.5 px-4">Company</th>}
                  {activeTab !== 'admins' && <th className="py-3.5 px-4">Phone</th>}
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {currentFilteredUsers.map((user) => {
                  const pwdLabel = getPasswordDisplay(user.email);
                  const isDemo = pwdLabel.includes('Demo');

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">{user.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-200">{user.email}</td>

                      {/* Password Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className={isDemo ? 'text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded' : 'text-slate-400'}>
                            {pwdLabel}
                          </span>
                        </div>
                      </td>

                      {/* Company (Teachers only) */}
                      {activeTab === 'teachers' && <td className="py-3.5 px-4 text-slate-300">{user.company_name || 'Default'}</td>}

                      {/* Phone (Teachers & Students) */}
                      {activeTab !== 'admins' && <td className="py-3.5 px-4 text-slate-400 font-mono">{user.phone || 'N/A'}</td>}

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/60">
                            <UserX className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            setUserToDelete({
                              id: user.id,
                              name: user.full_name,
                              email: user.email,
                              type: activeTab
                            })
                          }
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs flex items-center gap-1.5 ml-auto transition"
                          title="Remove user account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Confirm Account Deletion</h3>
                <p className="text-xs text-slate-400">This action will remove user access from the platform.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
              <div>
                <span className="text-slate-500 font-semibold">User: </span>
                <span className="font-bold text-slate-100">{userToDelete.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Mail ID: </span>
                <span className="font-mono text-cyan-400">{userToDelete.email}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Role: </span>
                <span className="uppercase text-purple-400 font-semibold">{userToDelete.type}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete this user account? All associated login privileges will be revoked immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg shadow-lg shadow-rose-900/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm & Remove User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

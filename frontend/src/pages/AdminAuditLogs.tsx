import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { History, Shield, Search, Filter } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');

  const loadLogs = async () => {
    try {
      const data = await api.listAuditLogs(100, actionFilter || undefined);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 font-semibold">
            <History className="w-4 h-4" />
            <span>Immutable Compliance Trail</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Audit Logs</h1>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white dark:bg-surface-850 text-slate-900 dark:text-slate-200 rounded-xl px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 font-mono focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="">All Action Types</option>
            <option value="PORTAL_ADMIN_INITIALIZED">Admin Initialized</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="CREATOR_CREATED">Creator Created</option>
            <option value="ASSESSMENT_CREATED">Assessment Created</option>
            <option value="ASSESSMENT_PUBLISHED">Assessment Published</option>
            <option value="ATTEMPT_STARTED">Attempt Started</option>
            <option value="ATTEMPT_COMPLETED">Attempt Completed</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-surface-850/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Initiator Role</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-700 dark:text-brand-300">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        {log.user_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {log.target_type} ({log.target_id?.substring(0, 8) || 'N/A'})
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

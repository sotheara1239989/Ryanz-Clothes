import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Calendar 
} from 'lucide-react';
import { listenToUsers, updateUserRole } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToUsers(
      (allUsers) => {
        setUsers(allUsers);
        setLoading(false);
      },
      (err) => {
        console.error("Users stream error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRoleToggle = async (userId, currentRole, userName) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      await updateUserRole(userId, newRole);
      showToast(`User "${userName || userId}" role updated to "${newRole}" in Firestore!`, "success");
    } catch (err) {
      console.error("Error updating user role:", err);
      showToast("Failed to update user role.", "error");
    }
  };

  const filteredUsers = users.filter(u => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      const matchPhone = u.phone?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Registered Users & Customers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage profiles and role assignments saved to Firestore <code className="text-emerald-400 font-mono">users/</code>
          </p>
        </div>

        <div className="text-xs font-bold bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-slate-300">
          Total Users: <span className="text-emerald-400">{users.length}</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Syncing users from Cloud Firestore..." />
      ) : filteredUsers.length > 0 ? (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Registered On</th>
                  <th className="py-4 px-6">Current Role</th>
                  <th className="py-4 px-6 text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredUsers.map((user) => {
                  const isAdminUser = user.role === 'admin';

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{user.name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">UID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-slate-300">
                        {user.email || 'No email provided'}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 text-slate-400">
                        {user.phone || '—'}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-6 text-slate-400">
                        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active'}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isAdminUser
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {isAdminUser ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <User className="w-3 h-3" />}
                          <span className="capitalize">{user.role || 'customer'}</span>
                        </span>
                      </td>

                      {/* Role Toggle Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleRoleToggle(user.id, user.role, user.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isAdminUser
                              ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-950 border border-rose-900/50'
                              : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950 border border-emerald-900/50'
                          }`}
                        >
                          {isAdminUser ? 'Demote to Customer' : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 rounded-3xl p-12 border border-slate-800 text-center text-slate-400 text-xs">
          No users registered in Firestore yet.
        </div>
      )}

    </div>
  );
};

export default AdminUsers;

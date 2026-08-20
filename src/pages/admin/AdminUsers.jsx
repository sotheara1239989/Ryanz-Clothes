import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  User 
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
      showToast(`User "${userName || userId}" role updated to "${newRole}".`, "success");
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

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const customerCount = users.filter(u => u.role !== 'admin').length;
  const phoneCount = users.filter(u => Boolean(u.phone)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Registered accounts, contact details, and role permissions
          </p>
        </div>

        <div className="text-xs font-semibold bg-white px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 shadow-xs">
          Total Customers: <span className="text-gray-900 font-bold">{users.length}</span>
        </div>
      </div>

      {/* Customers Quick Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-500 font-medium">User Directory</span>
          <span className="font-bold text-gray-900">{totalUsers} accounts</span>
        </div>
        <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200/80 shadow-xs flex items-center justify-between">
          <span className="text-purple-800 font-medium">Administrator Staff</span>
          <span className="font-bold text-purple-900">{adminCount} admins</span>
        </div>
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-600 font-medium">Shopper Accounts</span>
          <span className="font-bold text-gray-900">{customerCount} customers</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <span className="text-emerald-800 font-medium">Phone on File</span>
          <span className="font-bold text-emerald-900">{phoneCount} verified</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Loading customer directory..." />
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Phone</th>
                  <th className="py-3.5 px-5">Registered</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const dateStr = u.createdAt?.seconds 
                    ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
                    : 'Recent';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{u.name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">UID: {u.id?.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-gray-600">
                        {u.email || 'No email provided'}
                      </td>

                      <td className="py-3.5 px-5 text-gray-600">
                        {u.phone || '—'}
                      </td>

                      <td className="py-3.5 px-5 text-gray-500">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isAdmin 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isAdmin ? <ShieldCheck className="w-3 h-3 text-purple-600" /> : <User className="w-3 h-3 text-gray-500" />}
                          <span className="capitalize">{u.role || 'Customer'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role, u.name)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            isAdmin
                              ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                              : 'bg-black hover:bg-gray-800 text-white border-transparent'
                          }`}
                        >
                          {isAdmin ? 'Demote to Customer' : 'Make Admin'}
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-xs shadow-xs">
          No customer accounts found.
        </div>
      )}

    </div>
  );
};

export default AdminUsers;

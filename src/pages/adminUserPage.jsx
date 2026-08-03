import { useState, useEffect } from "react";
import { useAuth } from "../App2";

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const Backend_API_URL = import.meta.env.VITE_BACKEND_URL ;

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${Backend_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await fetch(`${Backend_API_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err) {
      console.error('Role update failed:', err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">User Administration</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage user roles and credentials
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-400 text-sm">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-500 text-sm">
          No registered users found.
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (Visible on small screens < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => (
              <div 
                key={u._id} 
                className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Username</p>
                    <p className="font-semibold text-slate-100 text-base mt-0.5">{u.username}</p>
                  </div>
                  <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs text-indigo-300 font-medium">
                    {u.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
                  <div>
                    <p className="text-slate-400">Password</p>
                    <p className="font-mono text-amber-400 font-medium truncate mt-0.5">
                      {u.plainPassword || '••••••••'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-center">
                    <p className="text-slate-400 mb-1">Change Role</p>
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (Visible on md screens and up) */}
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase text-xs">
                <tr>
                  <th className="p-4">Username</th>
                  <th className="p-4">Password (Plain text)</th>
                  <th className="p-4">Current Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-medium text-white">{u.username}</td>
                    <td className="p-4 font-mono text-amber-400">{u.plainPassword || '••••••••'}</td>
                    <td className="p-4">
                      <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs text-indigo-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Student">Set to Student</option>
                        <option value="Teacher">Set to Teacher</option>
                        <option value="Admin">Set to Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAuth } from "../App2";

export function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'reports'
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Report Filters
  const [selectedDate, setSelectedDate] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");

  const { token } = useAuth();
  const Backend_API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${Backend_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${Backend_API_URL}/api/admin/print-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (err) {
      console.error("Fetch reports error:", err);
    }
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([fetchUsers(), fetchReports()]).finally(() => setLoading(false));
    }
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    // Optimistic UI update
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch(`${Backend_API_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Role update failed:", err);
      fetchUsers();
    }
  };

  // Safe report filtering with local date parsing
  const filteredReports = reports.filter((rec) => {
    const matchesTeacher = teacherFilter
      ? rec.uploadedBy?.toLowerCase().includes(teacherFilter.toLowerCase())
      : true;

    let matchesDate = true;
    if (selectedDate && rec.printedAt) {
      try {
        const d = new Date(rec.printedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const localFormattedDate = `${year}-${month}-${day}`;
        matchesDate = localFormattedDate === selectedDate;
      } catch {
        matchesDate = false;
      }
    }

    return matchesTeacher && matchesDate;
  });

  const totalCopiesPrinted = filteredReports.reduce(
    (acc, curr) => acc + (Number(curr.copies) || 1),
    0
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-7xl mx-auto">
      {/* Header & Navbar Tabs */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Admin Control Panel</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage system access and review end-of-day print operations
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition ${
              activeTab === "users"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            User Administration
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition ${
              activeTab === "reports"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Print Logs & Reports
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-400 text-sm">
          Loading system data...
        </div>
      ) : activeTab === "users" ? (
        /* USER MANAGEMENT SECTION */
        <>
          {users.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-500 text-sm">
              No registered users found.
            </div>
          ) : (
            <>
              {/* Mobile Users View */}
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
                          {u.plainPassword || "••••••••"}
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

              {/* Desktop Users Table */}
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
                        <td className="p-4 font-mono text-amber-400">{u.plainPassword || "••••••••"}</td>
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
        </>
      ) : (
        /* PRINT REPORTS & LOGS SECTION */
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
              <p className="text-xs text-slate-400 uppercase font-medium">Total Print Jobs Executed</p>
              <p className="text-2xl font-bold text-white mt-1">{filteredReports.length}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
              <p className="text-xs text-slate-400 uppercase font-medium">Total Copies Printed</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{totalCopiesPrinted}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
              <p className="text-xs text-slate-400 uppercase font-medium">Filter Status</p>
              <p className="text-sm font-semibold text-emerald-400 mt-1">
                {selectedDate || teacherFilter ? "Filtered View" : "Showing All Time"}
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-300 block mb-1">Filter by Teacher</label>
              <input
                type="text"
                placeholder="Search teacher name..."
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-300 block mb-1">Filter by Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {(selectedDate || teacherFilter) && (
              <button
                onClick={() => {
                  setSelectedDate("");
                  setTeacherFilter("");
                }}
                className="self-end px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-md transition"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Report Display */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-500 text-sm">
              No historical print logs found for selected filters.
            </div>
          ) : (
            <>
              {/* Mobile Reports View */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredReports.map((rec) => {
                  const displayName = rec.customName || rec.title || rec.fileName || "Untitled Print Job";
                  return (
                    <div
                      key={rec._id}
                      className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-indigo-300 text-sm">
                          {rec.uploadedBy || rec.user || "Unknown User"}
                        </span>
                        <span className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded text-xs font-semibold">
                          {rec.copies || 1} {Number(rec.copies) === 1 ? "copy" : "copies"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{displayName}</p>
                        {rec.fileName && rec.fileName !== displayName && (
                          <p className="text-slate-400 font-mono text-xs truncate">{rec.fileName}</p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 text-right text-xs text-slate-400">
                        {rec.printedAt ? new Date(rec.printedAt).toLocaleString() : "N/A"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Reports Table */}
              <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase text-xs">
                    <tr>
                      <th className="p-4">Teacher / User</th>
                      <th className="p-4">User Provided Label</th>
                      <th className="p-4">Original Filename</th>
                      <th className="p-4 text-center">Copies</th>
                      <th className="p-4 text-right">Printed / Deleted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredReports.map((rec) => {
                      const displayName = rec.customName || rec.title || rec.fileName || "Untitled Print Job";
                      return (
                        <tr key={rec._id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="p-4 font-semibold text-indigo-300">
                            {rec.uploadedBy || rec.user || "Unknown User"}
                          </td>
                          <td className="p-4 font-medium text-white">{displayName}</td>
                          <td className="p-4 text-slate-400 font-mono text-xs">{rec.fileName || "N/A"}</td>
                          <td className="p-4 text-center">
                            <span className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded text-xs font-semibold">
                              {rec.copies || 1}
                            </span>
                          </td>
                          <td className="p-4 text-right text-xs text-slate-400">
                            {rec.printedAt ? new Date(rec.printedAt).toLocaleString() : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

















// import { useState, useEffect } from "react";
// import { useAuth } from "../App2";

// export function AdminUsersPage() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { token } = useAuth();
//   const Backend_API_URL = import.meta.env.VITE_BACKEND_URL ;

//   const fetchUsers = async () => {
//     try {
//       const res = await fetch(`${Backend_API_URL}/api/admin/users`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (Array.isArray(data)) setUsers(data);
//     } catch (err) {
//       console.error('Fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) {
//       fetchUsers();
//     }
//   }, [token]);

//   const handleRoleChange = async (userId, newRole) => {
//     try {
//       await fetch(`${Backend_API_URL}/api/admin/users/${userId}/role`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ role: newRole }),
//       });
//       fetchUsers();
//     } catch (err) {
//       console.error('Role update failed:', err);
//     }
//   };

//   return (
//     <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="flex justify-between items-center border-b border-slate-800 pb-4">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-bold text-slate-100">User Administration</h1>
//           <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
//             Manage user roles and credentials
//           </p>
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-400 text-sm">
//           Loading users...
//         </div>
//       ) : users.length === 0 ? (
//         <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-500 text-sm">
//           No registered users found.
//         </div>
//       ) : (
//         <>
//           {/* Mobile Card Layout (Visible on small screens < md) */}
//           <div className="grid grid-cols-1 gap-3 md:hidden">
//             {users.map((u) => (
//               <div 
//                 key={u._id} 
//                 className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-md"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Username</p>
//                     <p className="font-semibold text-slate-100 text-base mt-0.5">{u.username}</p>
//                   </div>
//                   <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs text-indigo-300 font-medium">
//                     {u.role}
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
//                   <div>
//                     <p className="text-slate-400">Password</p>
//                     <p className="font-mono text-amber-400 font-medium truncate mt-0.5">
//                       {u.plainPassword || '••••••••'}
//                     </p>
//                   </div>
                  
//                   <div className="flex flex-col items-end justify-center">
//                     <p className="text-slate-400 mb-1">Change Role</p>
//                     <select 
//                       value={u.role} 
//                       onChange={(e) => handleRoleChange(u._id, e.target.value)}
//                       className="bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
//                     >
//                       <option value="Student">Student</option>
//                       <option value="Teacher">Teacher</option>
//                       <option value="Admin">Admin</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Desktop Table Layout (Visible on md screens and up) */}
//           <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
//             <table className="w-full text-left text-sm text-slate-300">
//               <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase text-xs">
//                 <tr>
//                   <th className="p-4">Username</th>
//                   <th className="p-4">Password (Plain text)</th>
//                   <th className="p-4">Current Role</th>
//                   <th className="p-4 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-700">
//                 {users.map((u) => (
//                   <tr key={u._id} className="hover:bg-slate-700/50 transition-colors">
//                     <td className="p-4 font-medium text-white">{u.username}</td>
//                     <td className="p-4 font-mono text-amber-400">{u.plainPassword || '••••••••'}</td>
//                     <td className="p-4">
//                       <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs text-indigo-300">
//                         {u.role}
//                       </span>
//                     </td>
//                     <td className="p-4 text-right">
//                       <select 
//                         value={u.role} 
//                         onChange={(e) => handleRoleChange(u._id, e.target.value)}
//                         className="bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
//                       >
//                         <option value="Student">Set to Student</option>
//                         <option value="Teacher">Set to Teacher</option>
//                         <option value="Admin">Set to Admin</option>
//                       </select>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
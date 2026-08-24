import React, { useState, useEffect } from 'react';
import { useAuth } from '../App2';

export function FilesPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState('');
  const [copies, setCopies] = useState(1);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { user, token } = useAuth();

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const canUpload = ['Admin', 'Teacher'].includes(user?.role);
  const canDelete = user?.role === 'Admin';

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !customName.trim()) return;

    const formData = new FormData();
    // ✅ CRITICAL FIX: Append text fields FIRST so Busboy parses metadata before stream completes
    formData.append('customName', customName.trim());
    formData.append('copies', copies);
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        setCustomName('');
        setCopies(1);
        e.target.reset();
        fetchFiles();
      } else {
        const errData = await res.json();
        alert(`Upload failed: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to print and delete this file?')) return;

    try {
      const res = await fetch(`${API_URL}/api/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const errData = await res.json();
        alert(`Delete failed: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between xl:justify-start sm:items-center xl:items-start border-b border-slate-800 pb-4 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Printer Storage Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Logged in as <strong className="text-indigo-400">{user?.username}</strong> ({user?.role})
          </p>
        </div>
      </div>

      {/* Upload Form (Admin & Teacher Only) */}
      {canUpload ? (
        <form 
          onSubmit={handleUpload} 
          className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 flex flex-col gap-4 shadow-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Field 1: File Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Select File *</label>
              <input 
                type="file" 
                required
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="block w-full text-xs sm:text-sm text-slate-400 
                           file:mr-3 file:py-2 file:px-3 
                           file:rounded-md file:border-0 file:text-xs 
                           file:font-semibold file:bg-indigo-600 file:text-white 
                           hover:file:bg-indigo-500 cursor-pointer overflow-hidden"
              />
            </div>

            {/* Field 2: Required Custom Display Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">File Name *</label>
              <input 
                type="text" 
                required
                placeholder="Enter file label..." 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Field 3: Number of Copies */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Number of Copies</label>
              <input 
                type="number" 
                min="1" 
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!selectedFile || !customName.trim() || uploading}
            className="w-full sm:w-auto self-end bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-md text-sm font-medium transition shrink-0"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 p-3 sm:p-4 rounded-lg text-slate-400 text-xs sm:text-sm text-center">
          ℹ️ Your role <strong className="text-amber-400">({user?.role})</strong> allows view access only. Uploading requires Teacher or Admin privileges.
        </div>
      )}

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-500 text-sm">
          No files uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {files.map((file) => {
            const fileUrl = `${API_URL}/api/files/${file._id}?token=${token}`;
            const isImage = file.metadata?.contentType?.startsWith('image/');
            const isVideo = file.metadata?.contentType?.startsWith('video/');
            const displayName = file.metadata?.customName || file.filename;

            return (
              <div 
                key={file._id} 
                className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between shadow-md hover:border-slate-600 transition"
              >
                <div>
                  {/* File Label / Custom Name Header */}
                  <h3 className="font-semibold text-indigo-300 text-base truncate" title={displayName}>
                    📝 Label: {displayName}
                  </h3>
                  
                  {/* Technical Meta Details */}
                  <div className="mt-2 text-xs text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                    <p className="truncate"><strong className="text-slate-300">File:</strong> {file.filename}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span><strong className="text-slate-300">Copies:</strong> <span className="text-emerald-400 font-bold">{file.metadata?.copies || 1}</span></span>
                      <span><strong className="text-slate-300">Size:</strong> {(file.length / 1024).toFixed(1)} KB</span>
                    </div>
                    {file.metadata?.uploadedBy && (
                      <p className="pt-1 border-t border-slate-800 text-[11px] text-slate-500">
                        Uploaded by: <span className="text-slate-400">{file.metadata.uploadedBy}</span>
                      </p>
                    )}
                  </div>

                  {/* Image Preview */}
                  {isImage && (
                    <div className="mt-3 bg-slate-900 rounded-lg overflow-hidden h-36 flex items-center justify-center border border-slate-700/50">
                      <img 
                        src={fileUrl} 
                        alt={file.filename} 
                        className="max-h-full max-w-full object-contain" 
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Video Stream Preview */}
                  {isVideo && (
                    <div className="mt-3 bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
                      <video controls className="w-full h-36 object-cover">
                        <source src={fileUrl} type={file.metadata?.contentType} />
                      </video>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 text-center text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 py-2 px-3 rounded-md transition font-medium truncate"
                  >
                    View / Download
                  </a>

                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(file._id)} 
                      className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-2 px-3 rounded-md transition font-medium shrink-0"
                    >
                      Print & Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
















// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../App2';

// export function FilesPage() {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [files, setFiles] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const { user, token } = useAuth();

//   // Load Vite env variable with fallback to localhost
//   const API_URL = import.meta.env.VITE_BACKEND_URL ;
  

//   // Permissions based on user roles
//   const canUpload = ['Admin', 'Teacher'].includes(user?.role);
//   const canDelete = user?.role === 'Admin';

//   const fetchFiles = async () => {
//     try {
//       const res = await fetch(`${API_URL}/api/files`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (Array.isArray(data)) setFiles(data);
//     } catch (err) {
//       console.error('Failed to fetch files:', err);
//     }
//   };

//   useEffect(() => {
//     if (token) {
//       fetchFiles();
//     }
//   }, [token]);

//   const handleUpload = async (e) => {
//     e.preventDefault();
//     if (!selectedFile) return;

//     const formData = new FormData();
//     formData.append('file', selectedFile);

//     setUploading(true);
//     try {
//       const res = await fetch(`${API_URL}/api/upload`, {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       if (res.ok) {
//         setSelectedFile(null);
//         e.target.reset();
//         fetchFiles();
//       } else {
//         const errData = await res.json();
//         alert(`Upload failed: ${errData.error || 'Server error'}`);
//       }
//     } catch (err) {
//       console.error('Upload error:', err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this file?')) return;

//     try {
//       const res = await fetch(`${API_URL}/api/files/${id}`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.ok) {
//         fetchFiles();
//       } else {
//         const errData = await res.json();
//         alert(`Delete failed: ${errData.error || 'Server error'}`);
//       }
//     } catch (err) {
//       console.error('Delete error:', err);
//     }
//   };

//   return (
//     <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row  sm:justify-between xl:justify-start sm:items-center xl:items-start border-b border-slate-800 pb-4 gap-2">
//         <div>
//           <img src="./src/assets/IMG_2436.PNG" className='w-[80px] h-[90px]' alt="" srcset="" />
//           <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Printer Storage Directory</h1>
//           <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
//             Logged in as <strong className="text-indigo-400">{user?.username}</strong> ({user?.role})
//           </p>
//         </div>
//       </div>

//       {/* Upload Form (Admin & Teacher Only) */}
//       {canUpload ? (
//         <form 
//           onSubmit={handleUpload} 
//           className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center shadow-lg"
//         >
//           <input 
//             type="file" 
//             onChange={(e) => setSelectedFile(e.target.files[0])}
//             className="block w-full text-xs sm:text-sm text-slate-400 
//                        file:mr-3 sm:file:mr-4 file:py-2 file:px-3 sm:file:py-2.5 sm:file:px-4 
//                        file:rounded-md file:border-0 file:text-xs sm:file:text-sm 
//                        file:font-semibold file:bg-indigo-600 file:text-white 
//                        hover:file:bg-indigo-500 cursor-pointer overflow-hidden"
//           />
//           <button 
//             type="submit" 
//             disabled={!selectedFile || uploading}
//             className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-md text-sm font-medium transition shrink-0"
//           >
//             {uploading ? 'Uploading...' : 'Upload File'}
//           </button>
//         </form>
//       ) : (
//         <div className="bg-slate-800/50 border border-slate-700/50 p-3 sm:p-4 rounded-lg text-slate-400 text-xs sm:text-sm text-center">
//           ℹ️ Your role <strong className="text-amber-400">({user?.role})</strong> allows view access only. Uploading requires Teacher or Admin privileges.
//         </div>
//       )}

//       {/* Files Grid */}
//       {files.length === 0 ? (
//         <div className="text-center py-10 sm:py-12 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-500 text-sm">
//           No files uploaded yet.
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
//           {files.map((file) => {
//             const fileUrl = `${API_URL}/api/files/${file._id}?token=${token}`;
//             const isImage = file.metadata?.contentType?.startsWith('image/');
//             const isVideo = file.metadata?.contentType?.startsWith('video/');

//             return (
//               <div 
//                 key={file._id} 
//                 className="bg-slate-800 border border-slate-700 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between shadow-md hover:border-slate-600 transition"
//               >
//                 <div>
//                   <p className="font-semibold text-slate-200 text-sm sm:text-base truncate" title={file.filename}>
//                     {file.filename}
//                   </p>
                  
//                   <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex justify-between gap-2">
//                     <span className="shrink-0">
//                       Size: {(file.length / (1024 * 1024) >= 1) 
//                         ? `${(file.length / (1024 * 1024)).toFixed(2)} MB` 
//                         : `${(file.length / 1024).toFixed(2)} KB`}
//                     </span>
//                     {file.metadata?.uploadedBy && (
//                       <span className="truncate">By: {file.metadata.uploadedBy}</span>
//                     )}
//                   </div>

//                   {/* Image Preview */}
//                   {isImage && (
//                     <div className="mt-3 bg-slate-900 rounded-lg overflow-hidden h-36 sm:h-40 flex items-center justify-center border border-slate-700/50">
//                       <img 
//                         src={fileUrl} 
//                         alt={file.filename} 
//                         className="max-h-full max-w-full object-contain" 
//                         loading="lazy"
//                       />
//                     </div>
//                   )}

//                   {/* Video Stream Preview */}
//                   {isVideo && (
//                     <div className="mt-3 bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
//                       <video controls className="w-full h-36 sm:h-40 object-cover">
//                         <source src={fileUrl} type={file.metadata?.contentType} />
//                         Your browser does not support video playback.
//                       </video>
//                     </div>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
//                   <a 
//                     href={fileUrl} 
//                     target="_blank" 
//                     rel="noreferrer" 
//                     className="flex-1 text-center text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 py-2 sm:py-1.5 px-3 rounded-md transition font-medium truncate"
//                   >
//                     View / Download
//                   </a>

//                   {canDelete && (
//                     <button 
//                       onClick={() => handleDelete(file._id)} 
//                       className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-2 sm:py-1.5 px-3 rounded-md transition font-medium shrink-0"
//                     >
//                       Delete
//                     </button>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }
















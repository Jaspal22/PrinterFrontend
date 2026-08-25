import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/logInPage';
import { RegisterPage } from './pages/registerPage';
import { FilesPage } from './pages/uploadPage';
import { AdminUsersPage } from './pages/adminUserPage';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 sm:p-6 sm:px-8">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route 
                path="/files" 
                element={
                  <ProtectedRoute>
                    <FilesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } 
              />

              <Route path="*" element={<Navigate to="/files" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

// Navigation Bar
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-800 border-b border-slate-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        {/* Brand Logo */}
        <Link 
          to="/files" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex flex-row items-center justify-items-center text-lg sm:text-xl font-bold text-indigo-400 tracking-wide hover:text-indigo-300 transition"
        >
          <img src="./src/assets/IMG_2436.PNG" className='w-[50px] h-[50px]' alt="" srcset="" />
          <span className='font-serif text-green-800'>SSS</span> Printing Portal
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            to="/files" 
            className={`text-sm font-medium transition ${
              isActive('/files') ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            File Storage
          </Link>

          {user.role === 'Admin' && (
            <Link 
              to="/admin/users" 
              className={`text-sm font-medium transition ${
                isActive('/admin/users') ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              User Management
            </Link>
          )}
        </div>

        {/* Desktop User Info & Logout Button */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-xs sm:text-sm bg-slate-900 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700">
            {user.username} <strong className="text-indigo-400">({user.role})</strong>
          </span>
          <button 
            onClick={handleLogout}
            className="bg-red-600/80 hover:bg-red-600 text-white text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-md transition active:scale-95"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700/60 px-4 pt-3 pb-5 space-y-3">
          {/* User Profile Badge */}
          <div className="pb-2 border-b border-slate-700/60">
            <span className="text-xs bg-slate-900 px-3 py-1 rounded-full text-slate-300 border border-slate-700 inline-block">
              Logged in as <strong className="text-indigo-400">{user.username}</strong> ({user.role})
            </span>
          </div>

          {/* Mobile Links */}
          <div className="flex flex-col space-y-2">
            <Link 
              to="/files" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/files') ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              📁 File Storage
            </Link>

            {user.role === 'Admin' && (
              <Link 
                to="/admin/users" 
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/admin/users') ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                👥 User Management
              </Link>
            )}
          </div>

          {/* Mobile Logout Button */}
          <div className="pt-2 border-t border-slate-700/60">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-md transition text-center active:scale-[0.99]"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/files" replace />;
  }

  return children;
}

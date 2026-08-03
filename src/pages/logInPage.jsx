import { useState } from "react";
import { useAuth } from "../App2";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const Backend_API_URL = import.meta.env.VITE_BACKEND_URL ;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${Backend_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      login(data.user, data.token);
      navigate('/files');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 sm:mt-16 px-4">
      <div className="bg-slate-800 p-5 sm:p-8 rounded-xl border border-slate-700 shadow-2xl">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-indigo-400 mb-5 sm:mb-6">
          Account Login
        </h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-xs sm:text-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
              Username
            </label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2.5 text-base sm:text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2.5 text-base sm:text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-2.5 rounded-md transition mt-2 text-sm sm:text-base active:scale-[0.99]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs sm:text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline font-medium inline-block py-1">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
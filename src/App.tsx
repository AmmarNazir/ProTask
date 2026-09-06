import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Database,
  User as UserIcon,
  Lock,
  Mail,
  RefreshCw,
  LogOut,
  Sparkles,
  Kanban,
  X,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useKanbanStore } from './store/kanbanStore.js';
import { LiveBoard } from './components/LiveBoard.js';
import { BoardDrawer } from './components/BoardDrawer.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { API_BASE } from './types.js';

interface HealthData {
  status: string;
  database: {
    status: string;
    connected: boolean;
    totalUsers: number;
    totalBoards?: number;
    totalColumns?: number;
    totalTasks?: number;
  };
  timestamp: string;
}

export default function App() {
  const {
    token,
    currentUser,
    setAuth,
    logout,
    boards,
    fetchBoards,
    fetchUserStats,
    userStats,
    activeBoard,
    error,
    clearError,
  } = useKanbanStore();

  // Drawers & Modals
  const [showBoardDrawer, setShowBoardDrawer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Auth modal / view state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex@kanban.dev');
  const [password, setPassword] = useState('Secret123!');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Health / Database check
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/health`);
      if (!res.ok) {
        setHealth({
          status: 'Online',
          database: { status: 'Static Preview', connected: true, totalUsers: 1, totalBoards: 1, totalTasks: 5 },
        });
        return;
      }
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        status: 'Online',
        database: { status: 'Static Preview', connected: true, totalUsers: 1, totalBoards: 1, totalTasks: 5 },
      });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    if (token) {
      fetchBoards();
      fetchUserStats();
    }
  }, [token]);

  // One-click quick login for seamless demo exploration
  const handleQuickDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      let res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex@kanban.dev', password: 'Secret123!' }),
      });
      
      let data: any = null;
      if (res.ok) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (!data || !data.success) {
        res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Alex Rivera', email: 'alex@kanban.dev', password: 'Secret123!' }),
        });
        if (res.ok) {
          try {
            data = await res.json();
          } catch {
            data = null;
          }
        }
      }

      if (data && data.success && data.token && data.user) {
        setAuth(data.token, data.user);
        fetchHealth();
        setShowAuthModal(false);
      } else {
        // Fallback demo credentials for static preview / GitHub Pages
        const demoUser = {
          id: 'demo-user-gh',
          name: 'Alex Rivera (Demo)',
          email: 'alex@kanban.dev',
          createdAt: new Date().toISOString(),
        };
        const demoToken = 'demo-jwt-gh-pages';
        setAuth(demoToken, demoUser);
        setShowAuthModal(false);
      }
    } catch {
      // Fallback for static GitHub Pages demo
      const demoUser = {
        id: 'demo-user-gh',
        name: 'Alex Rivera (Demo)',
        email: 'alex@kanban.dev',
        createdAt: new Date().toISOString(),
      };
      setAuth('demo-jwt-gh-pages', demoUser);
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = 'Registration failed';
        try {
          const json = JSON.parse(text);
          errMsg = json.message || errMsg;
        } catch {
          errMsg = 'Server endpoint unavailable on static hosting. Use Demo Login or set VITE_API_URL.';
        }
        setAuthError(errMsg);
        return;
      }
      const data = await res.json();

      if (data.success && data.token && data.user) {
        setAuth(data.token, data.user);
        fetchHealth();
        setShowAuthModal(false);
      } else {
        setAuthError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = 'Login failed';
        try {
          const json = JSON.parse(text);
          errMsg = json.message || errMsg;
        } catch {
          errMsg = 'Server endpoint unavailable on static hosting. Use Demo Login or set VITE_API_URL.';
        }
        setAuthError(errMsg);
        return;
      }
      const data = await res.json();

      if (data.success && data.token && data.user) {
        setAuth(data.token, data.user);
        fetchHealth();
        setShowAuthModal(false);
      } else {
        setAuthError(data.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Left Navigation Rail Sidebar */}
      <aside className="w-16 shrink-0 bg-[#0d0d0f] border-r border-zinc-800/50 hidden md:flex flex-col items-center py-6 gap-7 z-20">
        {/* ProTask Radiant Logo Icon (Click to open board switcher drawer) */}
        <button
          onClick={() => {
            if (token) setShowBoardDrawer(true);
          }}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.45)] hover:scale-105 transition-transform cursor-pointer"
          title="ProTask (Click to Switch Boards)"
        >
          <CheckSquare className="w-5 h-5 text-white stroke-[2.5]" />
        </button>

        {/* Navigation Actions */}
        <nav className="flex flex-col gap-3 items-center">
          {/* Board Switcher Drawer Toggle Button */}
          <button
            id="nav-btn-board-drawer"
            onClick={() => {
              if (!token) setShowAuthModal(true);
              else setShowBoardDrawer((prev) => !prev);
            }}
            className={`p-2.5 rounded-xl transition-all cursor-pointer relative group ${
              showBoardDrawer
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-zinc-800 text-indigo-400 hover:bg-zinc-700 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
            }`}
            title="Open Board Switcher Drawer"
          >
            <Kanban className="w-5 h-5" />
            {token && boards.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-[#0d0d0f]">
                {boards.length}
              </span>
            )}
          </button>

          {/* Refresh Database Health */}
          <button
            onClick={() => {
              fetchHealth();
              if (token) fetchUserStats();
            }}
            className="p-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
            title="Refresh Database Connection"
          >
            <Database className="w-5 h-5" />
          </button>
        </nav>

        {/* User Profile Avatar at Bottom of Sidebar */}
        <div className="mt-auto flex flex-col items-center gap-3">
          {currentUser ? (
            <button
              id="sidebar-user-profile-btn"
              onClick={() => setShowProfileModal(true)}
              className="group relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-transform hover:scale-105 cursor-pointer"
              title={`Signed in as ${currentUser.name} (Click to open Profile & Metrics)`}
            >
              <span>{currentUser.name.slice(0, 2).toUpperCase()}</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0d0f]" />
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-indigo-600 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Sign In to ProTask"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-screen">
        {/* Atmospheric Subtle Indigo Radial Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,transparent_50%)] opacity-50 pointer-events-none" />

        {/* App Header */}
        <header className="h-16 flex items-center justify-between px-3 sm:px-6 md:px-8 border-b border-zinc-800/50 backdrop-blur-md z-10 bg-[#09090b]/80 sticky top-0">
          {/* Brand Name & Tagline & Board Switcher Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                onClick={() => {
                  if (token) setShowBoardDrawer(true);
                }}
                className="w-8 h-8 rounded-lg bg-indigo-600 flex md:hidden items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer shrink-0"
                title="ProTask (Click to Switch Boards)"
              >
                <CheckSquare className="w-4 h-4 text-white stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-base font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  <span>ProTask</span>
                  {/* Hide Kanban tag on mobile, show on tablet and desktop */}
                  <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
                    Kanban
                  </span>
                </h1>
              </div>
            </div>

            {/* Active Board Switcher Pill: Hidden on mobile and tablet (hidden lg:flex), shown on desktop */}
            {token && activeBoard && (
              <button
                onClick={() => setShowBoardDrawer(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 text-xs font-medium text-zinc-200 transition-all cursor-pointer shadow-sm ml-2 group shrink-0"
                title="Click to Switch or Create Boards"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="truncate max-w-[140px] sm:max-w-[200px] font-semibold">
                  {activeBoard.title}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </button>
            )}
          </div>

          {/* Right Header: Database status & User Session */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
            {/* Database Live State Pill: Hidden on mobile (<sm), visible on tablet (sm/md) and desktop */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-300 shrink-0">
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
              </div>
              <span className="hidden md:inline text-zinc-400">Database:</span>
              <strong className="text-emerald-400 font-medium">{health?.database?.status || 'Online'}</strong>
              {token ? (
                <span className="text-zinc-400 hidden xl:inline">
                  ({(userStats?.totalBoards ?? boards.length)} {(userStats?.totalBoards ?? boards.length) === 1 ? 'board' : 'boards'} • {(userStats?.totalTasks ?? 0)} {(userStats?.totalTasks ?? 0) === 1 ? 'task' : 'tasks'})
                </span>
              ) : (
                <span className="text-zinc-500 hidden xl:inline">
                  (Online)
                </span>
              )}
              <button
                onClick={() => {
                  fetchHealth();
                  if (token) fetchUserStats();
                }}
                disabled={healthLoading}
                className="text-zinc-500 hover:text-zinc-200 transition-colors ml-1 cursor-pointer"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-zinc-800 hidden md:block" />

            {/* Session status / User profile / Logout */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Clicking User Card opens User Profile Modal - show profile avatar AND name across mobile, tablet, and desktop */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
                  title="Open Profile & Productivity Statistics"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-700 to-indigo-500 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-zinc-200 leading-tight max-w-[90px] sm:max-w-[130px] truncate">
                      {currentUser.name}
                    </div>
                    <div className="hidden sm:block text-[10px] text-zinc-500 font-mono leading-tight truncate max-w-[120px]">
                      {currentUser.email}
                    </div>
                  </div>
                </button>

                {/* Direct Sign Out Button */}
                <button
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickDemoLogin}
                  disabled={authLoading}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo</span>
                </button>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-950/40 border-b border-rose-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-rose-200 p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Application Body */}
        <main className="flex-1 px-6 sm:px-8 py-6 max-w-7xl w-full mx-auto space-y-6 z-10 overflow-x-hidden">
          {token ? (
            <LiveBoard />
          ) : (
            /* Clean, Focused Welcome & Authentication Screen */
            <div className="py-12 max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                  <CheckSquare className="w-6 h-6 text-indigo-400 stroke-[2.5]" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">Welcome to ProTask</h2>
                <p className="text-xs text-zinc-400">
                  Organize, prioritize, and track your tasks with real-time drag-and-drop boards.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
                {/* 1-Click Quick Demo Access */}
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2.5 text-center">
                  <p className="text-xs text-zinc-300">
                    Want to test the board immediately without registering?
                  </p>
                  <button
                    onClick={handleQuickDemoLogin}
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(79,70,229,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Explore with 1-Click Demo Account</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-zinc-800 w-full" />
                  <span className="bg-[#121216] px-3 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold absolute">
                    or your account
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className={`py-1.5 rounded-lg font-medium transition-all ${
                      authMode === 'login'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className={`py-1.5 rounded-lg font-medium transition-all ${
                      authMode === 'register'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={authMode === 'login' ? handleLogin : handleRegister}
                  className="space-y-4"
                >
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Alex Rivera"
                        className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@company.com"
                        className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-[0_0_20px_rgba(79,70,229,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{authMode === 'login' ? 'Sign In to ProTask' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Auth Modal (if user opens it while in app) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d0f] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                {authMode === 'login' ? 'Sign In to ProTask' : 'Create an Account'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form
              onSubmit={authMode === 'login' ? handleLogin : handleRegister}
              className="space-y-3.5"
            >
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-all cursor-pointer"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Instant 1-Click Demo Login
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError(null);
                  }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  {authMode === 'login'
                    ? "Don't have an account? Create one"
                    : 'Already have an account? Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Board Switcher Drawer */}
      <BoardDrawer
        isOpen={showBoardDrawer}
        onClose={() => setShowBoardDrawer(false)}
      />

      {/* User Profile & Task Productivity Metrics Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}

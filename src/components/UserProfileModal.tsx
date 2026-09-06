import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  Save,
  Edit2,
  Columns3,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useKanbanStore } from '../store/kanbanStore.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    userStats,
    fetchUserStats,
    updateProfile,
    logout,
    boards,
    isActionLoading,
  } = useKanbanStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserStats();
      if (currentUser) {
        setName(currentUser.name);
        setEmail(currentUser.email);
      }
      setIsEditing(false);
      setSaveSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email cannot be blank.');
      return;
    }

    const success = await updateProfile(name.trim(), email.trim());
    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMsg('Failed to update profile. Email might be in use.');
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
  };

  const totalBoardsCount = userStats?.totalBoards ?? boards.length;
  const totalTasksCount = userStats?.totalTasks ?? 0;
  const completedCount = userStats?.completedTasks ?? 0;
  const pendingCount = userStats?.pendingTasks ?? 0;
  const highPriorityCount = userStats?.highPriorityTasks ?? 0;

  const completionRate =
    totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-[#0e0e12] border border-zinc-800/90 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Avatar banner */}
        <div className="relative bg-gradient-to-r from-indigo-950/60 to-zinc-900/60 border-b border-zinc-800/80 px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 border-2 border-indigo-400/40 flex items-center justify-center text-lg font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.35)] shrink-0">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-zinc-100 truncate">
                {currentUser.name}
              </h2>
              <p className="text-xs text-zinc-400 font-mono truncate">{currentUser.email}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1">
                <Calendar className="w-3 h-3 text-zinc-600" />
                <span>
                  Member since{' '}
                  {currentUser.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '2026'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Details / Edit Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Account Details
              </span>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(currentUser.name);
                    setEmail(currentUser.email);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-[#121216] border border-zinc-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#121216] border border-zinc-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isActionLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-500">Name</div>
                  <div className="font-medium text-zinc-200 truncate mt-0.5">{currentUser.name}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-500">Email</div>
                  <div className="font-mono text-zinc-300 truncate mt-0.5 text-[11px]">{currentUser.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Productivity & Task Performance Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Productivity & Tasks
              </span>
              <span className="text-xs text-emerald-400 font-medium font-mono">
                {completionRate}% Complete
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Completed Tasks */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-bold text-emerald-300">{completedCount}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Completed</div>
              </div>

              {/* Pending Tasks */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-center">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-1">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-bold text-amber-300">{pendingCount}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">In Progress</div>
              </div>

              {/* High Priority Tasks */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-center">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-bold text-rose-300">{highPriorityCount}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Urgent</div>
              </div>
            </div>

            {/* Total Boards & Tasks Bar */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Total Workspaces:</span>
                <strong className="text-zinc-100">{totalBoardsCount} boards</strong>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 font-mono">
                <Columns3 className="w-3.5 h-3.5 text-zinc-500" />
                <span>{totalTasksCount} total tasks</span>
              </div>
            </div>
          </div>

          {/* Dedicated Sign Out Button */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 hover:border-rose-700 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out of ProTask</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Admin access check
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            The Admin Console is restricted to authorized store administrators. Please sign in with an authorized admin account to continue.
          </p>

          <div className="space-y-3">
            <Link
              to="/login"
              state={{ from: location }}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Admin Account</span>
            </Link>

            <Link
              to="/"
              className="block text-xs font-medium text-slate-500 hover:text-slate-900 pt-2"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // General auth check
  if (!currentUser && !adminOnly) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

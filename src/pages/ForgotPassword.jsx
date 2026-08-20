import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await resetPassword(email.trim());
      setSubmitted(true);
      showToast("Password reset link sent! Check your inbox.", "success");
    } catch (err) {
      console.error("Password reset error:", err);
      let msg = "Failed to send password reset email.";
      if (err.code === 'auth/user-not-found') {
        msg = "No account found with this email address.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Please enter a valid email address.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
        
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group mb-1">
            <img 
              src="/logo.png" 
              alt="Ryanz Clothes Logo" 
              className="w-10 h-10 rounded-lg shadow-xs mx-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-xs text-gray-500">
            Enter your email and we'll send you a secure link to reset your account password
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-gray-900">Email Dispatched!</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              We've sent a password recovery link to <strong className="text-gray-900">{email}</strong>. Please check your inbox and click the link to choose a new password.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block w-full py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-xs"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center"
            >
              <span>{loading ? 'Sending link...' : 'Send Password Reset Link'}</span>
            </button>

            <div className="pt-2 text-center text-xs text-gray-500">
              Remember your password?{' '}
              <Link to="/login" className="font-semibold text-black hover:underline">
                Back to Sign In &rarr;
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

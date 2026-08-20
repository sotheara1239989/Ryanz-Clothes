import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
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
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-extrabold text-xl mx-auto shadow-md">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-xs text-slate-500">
            Enter your email and we'll send you a secure link to reset your account password
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                We've sent a password reset link to <strong className="text-slate-900">{email}</strong>. Please check your inbox and spam folder.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                Didn't receive email? Try again
              </button>

              <Link
                to="/login"
                className="w-full py-3 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="yourname@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-950 hover:bg-black disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-950 font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;

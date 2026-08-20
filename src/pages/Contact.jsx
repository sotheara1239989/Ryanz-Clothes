import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useToast } from '../context/ToastContext';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Save inquiry to Firestore inquiries collection
      await addDoc(collection(db, 'inquiries'), {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || 'General Customer Inquiry',
        message: message.trim(),
        status: 'unread',
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
      showToast("Thank you! Your message has been sent to our concierge team.", "success");
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      setError("Failed to send message. Please try again or email us directly.");
      showToast("Failed to send message.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>24/7 CUSTOMER CONCIERGE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Contact Ryanz Clothes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Have questions about an order, sizing fit, or custom inquiries? Our team is here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Information Column */}
          <div className="lg:col-span-5 space-y-6 bg-slate-950 rounded-3xl p-8 text-white border border-slate-800 shadow-xl">
            <h2 className="text-xl font-extrabold text-white">Get in Touch</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We provide round-the-clock email and ticket support for all order queries, tracking updates, and sizing consultations.
            </p>

            <div className="space-y-5 pt-4 text-xs">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-800">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Customer Support Email</span>
                  <div className="text-white font-bold mt-0.5">support@ryanzclothes.com</div>
                  <div className="text-slate-500 text-[11px]">Average response under 2 hours</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center shrink-0 border border-slate-800">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Headquarters &amp; Flagship</span>
                  <div className="text-white font-bold mt-0.5">Phnom Penh, Cambodia</div>
                  <div className="text-slate-500 text-[11px]">Royal University of Phnom Penh (RUPP)</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 border border-slate-800">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Operating Hours</span>
                  <div className="text-white font-bold mt-0.5">Monday &ndash; Sunday</div>
                  <div className="text-slate-500 text-[11px]">8:00 AM &ndash; 10:00 PM (GMT+7)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl space-y-6">
            <h2 className="text-xl font-extrabold text-slate-950">Send Us a Direct Message</h2>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {submitted ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Inquiry Sent Successfully!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong className="text-slate-900">{name}</strong>. Our customer concierge has received your ticket and will reply to <strong className="text-slate-900">{email}</strong> shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                  }}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Alex Chen"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="alex@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Sizing Advice / Order #1234 Query"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="How can our customer concierge team assist you today?..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-950 hover:bg-black disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending Inquiry...' : 'Submit Message'}</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;

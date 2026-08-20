import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
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
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Customer Concierge
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Have a question about sizing, order tracking, returns, or wholesale? Reach out to our concierge team and we'll reply promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-950">Direct Channels</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">Email Support</span>
                    <strong className="text-slate-900 text-sm font-semibold">support@ryanzclothes.com</strong>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">Phone &amp; Telegram</span>
                    <strong className="text-slate-900 text-sm font-semibold">+855 (0) 12 345 678</strong>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">Storefront &amp; Studio</span>
                    <span className="text-slate-800 font-medium">Russian Federation Blvd, Phnom Penh, Cambodia</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white">Concierge Hours</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monday – Saturday: 8:00 AM – 9:00 PM (GMT+7)<br />
                Sunday: 10:00 AM – 6:00 PM (GMT+7)
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-medium">
                &bull; Orders and dropshipping fulfillments run 24/7 automatically.
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Inquiry Received!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. We have logged your request in our direct support system and will follow up with you via email shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                    className="mt-4 px-6 py-2.5 bg-slate-950 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-950 mb-1">Send a Message</h3>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-slate-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Sizing inquiry or order tracking question"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we assist you with your order?"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-slate-950 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;

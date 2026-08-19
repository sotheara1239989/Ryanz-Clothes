import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Save, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Profile = () => {
  const { currentUser, userProfile, updateProfileData, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [saving, setSaving] = useState(false);

  // Sync form state when userProfile loads from Firestore
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        street: userProfile.address?.street || '',
        city: userProfile.address?.city || '',
        state: userProfile.address?.state || '',
        zipCode: userProfile.address?.zipCode || '',
        country: userProfile.address?.country || 'United States'
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfileData({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          country: formData.country.trim()
        }
      });
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Profile save error:", err);
      showToast("Failed to save profile. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-md shrink-0">
            {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {userProfile?.name || 'Customer Account'}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {currentUser?.email}
            </p>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-700" />
              <span>Personal Information</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your account details and default shipping address
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-slate-700" />
              <span>Default Shipping Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="123 Streetwear Blvd"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Zip / Postal Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="10001"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-slate-950 hover:bg-black disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Profile;

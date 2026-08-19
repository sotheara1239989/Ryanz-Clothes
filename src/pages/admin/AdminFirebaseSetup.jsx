import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Activity, 
  Copy, 
  Check 
} from 'lucide-react';
import { 
  getActiveFirebaseConfig, 
  isFirebaseConfigured, 
  saveCustomFirebaseConfig, 
  clearCustomFirebaseConfig, 
  testFirestoreConnection 
} from '../../firebase/config';
import { useToast } from '../../context/ToastContext';

export const AdminFirebaseSetup = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const [rawJsonInput, setRawJsonInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const active = getActiveFirebaseConfig();
    setConfig(active);
  }, []);

  const handleJsonPaste = (e) => {
    const raw = e.target.value;
    setRawJsonInput(raw);

    try {
      // Try parsing if user pasted standard JS/JSON config object
      let cleaned = raw;
      if (raw.includes('const firebaseConfig =')) {
        cleaned = raw.replace(/const firebaseConfig =/, '').replace(/;$/, '').trim();
      }
      // Replace unquoted keys
      cleaned = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
      // Fix trailing commas
      cleaned = cleaned.replace(/,(\s*})/g, '$1');

      const parsed = JSON.parse(cleaned);
      if (parsed.apiKey) {
        setConfig({
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || '',
          projectId: parsed.projectId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || ''
        });
        showToast("Extracted Firebase credentials from pasted config!", "success");
      }
    } catch {
      // Allow manual input if parsing fails
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      showToast("API Key and Project ID are required.", "error");
      return;
    }

    try {
      saveCustomFirebaseConfig(config);
      showToast("Firebase configuration saved! Application reloaded.", "success");
    } catch (err) {
      showToast("Failed to save configuration.", "error");
    }
  };

  const handleClear = () => {
    if (window.confirm("Reset to default environment configuration?")) {
      clearCustomFirebaseConfig();
      showToast("Reset to default .env config.", "info");
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const result = await testFirestoreConnection();
      setTestResult(result);
      if (result.success) {
        showToast("Firestore connection verified successfully!", "success");
      } else {
        showToast("Firestore test failed: " + result.error, "error");
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      showToast("Connection test failed.", "error");
    } finally {
      setTestingConnection(false);
    }
  };

  const envString = `VITE_FIREBASE_API_KEY=${config.apiKey || ''}
VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain || ''}
VITE_FIREBASE_PROJECT_ID=${config.projectId || ''}
VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket || ''}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId || ''}
VITE_FIREBASE_APP_ID=${config.appId || ''}`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envString);
    setCopiedEnv(true);
    showToast("Copied .env format to clipboard!", "success");
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400 mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Cloud Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Firebase Connection & Setup
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
          Connect your store to your Google Firebase project to enable live Cloud Firestore database synchronization, Firebase Authentication, and Firebase Cloud Storage for product images.
        </p>
      </div>

      {/* Connection Status Banner */}
      <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isFirebaseConfigured
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isFirebaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isFirebaseConfigured ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {isFirebaseConfigured ? 'Firebase Configured' : 'Firebase Needs Project Credentials'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Project ID: <code className="text-white font-mono">{config.projectId || 'Not Connected'}</code>
            </p>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testingConnection}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
        >
          <Activity className={`w-4 h-4 ${testingConnection ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          <span>{testingConnection ? 'Testing Ping...' : 'Test Live Firestore Ping'}</span>
        </button>
      </div>

      {/* Test Result Display */}
      {testResult && (
        <div className={`p-4 rounded-2xl border text-xs ${
          testResult.success 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          <div className="font-bold flex items-center gap-2">
            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{testResult.success ? 'Live Firestore Connection Verified!' : 'Connection Test Failed'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {testResult.success 
              ? `Successfully pinged document at _connection_test/ping on project "${testResult.projectId}".`
              : testResult.error}
          </p>
        </div>
      )}

      {/* Setup Guide Steps */}
      <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>3-Step Firebase Quick Setup</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px]">1</span>
            <h4 className="font-bold text-white">Create Firebase Project</h4>
            <p className="text-slate-400 text-[11px]">
              Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Firebase Console</a>, create a project, and add a Web App.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px]">2</span>
            <h4 className="font-bold text-white">Enable Firestore & Auth</h4>
            <p className="text-slate-400 text-[11px]">
              In Firebase Console: Enable <strong>Cloud Firestore</strong> (Test mode), <strong>Authentication</strong> (Email/Password), and <strong>Storage</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px]">3</span>
            <h4 className="font-bold text-white">Paste Credentials Below</h4>
            <p className="text-slate-400 text-[11px]">
              Copy the <code className="text-emerald-400 font-mono">firebaseConfig</code> object from Project Settings and paste it below or in your <code className="text-emerald-400 font-mono">.env</code> file.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white">Firebase Project Credentials</h3>

        {/* Raw JS Paste Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Quick Paste: Paste your entire <code className="text-emerald-400 font-mono">firebaseConfig = &#123; ... &#125;</code> object here
          </label>
          <textarea
            rows="3"
            value={rawJsonInput}
            onChange={handleJsonPaste}
            placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app",\n  storageBucket: "my-app.appspot.com",\n  messagingSenderId: "123...",\n  appId: "1:123..."\n};`}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Individual Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">API Key (apiKey) *</label>
            <input
              type="text"
              required
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Project ID (projectId) *</label>
            <input
              type="text"
              required
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              placeholder="my-streetwear-store"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Auth Domain (authDomain)</label>
            <input
              type="text"
              value={config.authDomain}
              onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
              placeholder="my-streetwear-store.firebaseapp.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Storage Bucket (storageBucket)</label>
            <input
              type="text"
              value={config.storageBucket}
              onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
              placeholder="my-streetwear-store.appspot.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Messaging Sender ID (messagingSenderId)</label>
            <input
              type="text"
              value={config.messagingSenderId}
              onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
              placeholder="123456789012"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">App ID (appId)</label>
            <input
              type="text"
              value={config.appId}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              placeholder="1:123456789012:web:abcdef"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyEnv}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            {copiedEnv ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>Copy as .env File Content</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded-xl border border-slate-800 transition-all"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect Firebase</span>
            </button>
          </div>
        </div>
      </form>

    </div>
  );
};

export default AdminFirebaseSetup;

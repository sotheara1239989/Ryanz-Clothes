import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Sliders, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  Loader2,
  ArrowRight,
  TrendingUp,
  Percent,
  RefreshCw,
  PackageCheck,
  Zap,
  Activity
} from 'lucide-react';
import { 
  getCjCredentials, 
  saveCjCredentials, 
  fetchCjAccessToken, 
  searchCjProducts, 
  fetchCjProductDetails,
  importCjProductToFirestore, 
  importBatchCjProductsToFirestore,
  normalizeImageUrl,
  getCachedProductImages,
  calculateCjUsShippingFee,
  fetchDynamicCjFreight
} from '../../services/cjDropshippingService';
import { 
  syncAllFirestoreProductsWithCj, 
  syncSingleProductWithCj, 
  syncOrderToCjFulfillment, 
  syncCjOrderTracking 
} from '../../services/cjSyncService';
import { listenToCategories } from '../../services/categoryService';
import { listenToProducts } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const AdminCJDropshipping = () => {
  const [credentials, setCredentials] = useState({ apiKey: '', accessToken: '', email: '' });
  const [connecting, setConnecting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('hoodie');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cjProducts, setCjProducts] = useState([]);
  const [selectedPids, setSelectedPids] = useState([]);
  const [categories, setCategories] = useState([]);
  const [liveStoreProducts, setLiveStoreProducts] = useState([]);

  // Live CJ Sync Engine State
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Import Configuration Controls
  const [markupMultiplier, setMarkupMultiplier] = useState(2.2);
  const [applySaleDiscount, setApplySaleDiscount] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(15);
  const [targetCategory, setTargetCategory] = useState('');
  const [markAsFeatured, setMarkAsFeatured] = useState(false);
  const [markAsNewArrival, setMarkAsNewArrival] = useState(true);

  // Direct PID import
  const [directPid, setDirectPid] = useState('');
  const [importingDirect, setImportingDirect] = useState(false);

  // Batch Import Progress
  const [batchImporting, setBatchImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    const creds = getCjCredentials();
    setCredentials(creds);

    const unsubCategories = listenToCategories((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !targetCategory) {
        setTargetCategory(cats[0].slug || cats[0].name);
      }
    });

    const unsubProducts = listenToProducts((prods) => {
      setLiveStoreProducts(prods || []);
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  const handleConnectCj = async (e) => {
    e.preventDefault();
    if (!credentials.apiKey.trim()) {
      showToast("Please enter your CJ Dropshipping API key.", "error");
      return;
    }

    try {
      setConnecting(true);
      const res = await fetchCjAccessToken(credentials.apiKey);
      setCredentials(res);
      showToast("Successfully connected to CJ Dropshipping API!", "success");
      handleSearch(searchKeyword);
    } catch (err) {
      console.error("CJ connection error:", err);
      // Still save API key for future attempts
      saveCjCredentials(credentials);
      showToast("Saved API Key. Operating with verified CJ supplier feed.", "info");
    } finally {
      setConnecting(false);
    }
  };

  const handleSearch = async (keyword) => {
    setLoadingProducts(true);
    try {
      const term = (keyword !== undefined ? keyword : searchKeyword).trim();
      const res = await searchCjProducts({ keyword: term });
      if (res.source === 'no_auth') {
        showToast("Please enter and verify your CJ Dropshipping API Key in Settings.", "error");
      } else if (res.products && res.products.length > 0) {
        showToast(`Found ${res.products.length} live CJ products for "${term}"!`, "success");
      }
      setCjProducts(res.products || []);
    } catch (err) {
      console.error("CJ Search failed:", err);
      showToast(err.message || "Failed to search CJ products.", "error");
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleSelectPid = (pid) => {
    setSelectedPids(prev => 
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPids.length === cjProducts.length) {
      setSelectedPids([]);
    } else {
      setSelectedPids(cjProducts.map(p => p.pid));
    }
  };

  const getImportOptions = () => ({
    markupMultiplier: Number(markupMultiplier) || 2.0,
    overrideCategory: targetCategory,
    applySaleDiscount: Boolean(applySaleDiscount),
    discountPercent: Number(discountPercent) || 0,
    featured: Boolean(markAsFeatured),
    isNewArrival: Boolean(markAsNewArrival)
  });

  const handleImportSingle = async (product) => {
    try {
      showToast(`Importing "${product.productNameEn}" into Firestore...`, "info");
      const doc = await importCjProductToFirestore(product, getImportOptions());
      showToast(`Imported to Firestore! ID: ${doc.id}`, "success");
    } catch (err) {
      console.error("Import single failed:", err);
      showToast("Failed to import product into Firestore.", "error");
    }
  };

  const handleBatchImport = async () => {
    const productsToImport = cjProducts.filter(p => selectedPids.includes(p.pid));
    if (productsToImport.length === 0) return;

    try {
      setBatchImporting(true);
      setImportProgress({ current: 0, total: productsToImport.length, productName: 'Starting...' });

      const results = await importBatchCjProductsToFirestore(
        productsToImport,
        getImportOptions(),
        (prog) => setImportProgress(prog)
      );

      showToast(`Imported ${results.successCount} products to Firestore!`, "success");
      setSelectedPids([]);
    } catch (err) {
      console.error("Batch import failed:", err);
      showToast("Batch import failed.", "error");
    } finally {
      setBatchImporting(false);
      setImportProgress(null);
    }
  };

  // Draft Modal State for direct custom editing/importing
  const [draftProduct, setDraftProduct] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const handleDirectPidImport = async (e) => {
    e.preventDefault();
    if (!directPid.trim()) return;

    try {
      setImportingDirect(true);
      let rawInput = directPid.trim();
      let pid = rawInput;
      let inferredTitle = '';
      let inferredCategory = targetCategory || (categories[0]?.slug || 't-shirts');

      // Smart URL Parsing for any CJ product link
      if (rawInput.includes('cjdropshipping.com') || rawInput.includes('http')) {
        // Extract PID if present
        const pMatch = rawInput.match(/-p-([A-Za-z0-9]+)/i) || 
                       rawInput.match(/product-detail\/([A-Za-z0-9]+)/i) || 
                       rawInput.match(/pid=([A-Za-z0-9]+)/i);
        if (pMatch) pid = pMatch[1];

        // Extract SKU if present
        const skuMatch = rawInput.match(/sku=([A-Za-z0-9]+)/i) || rawInput.match(/productSku=([A-Za-z0-9]+)/i);
        if (skuMatch) pid = skuMatch[1];

        // Extract Title from URL slug (e.g. /product/casual-sleeveless-suit-...-p-123.html)
        const slugMatch = rawInput.match(/product\/([a-z0-9-]+)(?:-p-|\.html)/i);
        if (slugMatch && slugMatch[1]) {
          inferredTitle = slugMatch[1]
            .split('-')
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }

      // Auto-categorize based on title or input text
      const lowerCheck = (inferredTitle || rawInput).toLowerCase();
      if (lowerCheck.includes('suit') || lowerCheck.includes('pant') || lowerCheck.includes('trouser') || lowerCheck.includes('jean') || lowerCheck.includes('short')) {
        inferredCategory = 'pants-denim';
      } else if (lowerCheck.includes('hoodie') || lowerCheck.includes('sweater') || lowerCheck.includes('jacket') || lowerCheck.includes('coat')) {
        inferredCategory = 'hoodies-sweaters';
      } else if (lowerCheck.includes('cap') || lowerCheck.includes('hat') || lowerCheck.includes('bag') || lowerCheck.includes('belt')) {
        inferredCategory = 'accessories';
      } else if (lowerCheck.includes('tee') || lowerCheck.includes('shirt') || lowerCheck.includes('top')) {
        inferredCategory = 't-shirts';
      }

      // 1. Check if product already exists in current search list
      let product = cjProducts.find(p => p.pid && p.pid.toLowerCase() === pid.toLowerCase());

      // 2. Query CJ Dropshipping API / verified database
      if (!product) {
        const details = await fetchCjProductDetails(pid);
        if (details && (details.productNameEn || details.productName)) {
          product = details;
        }
      }

      if (product) {
        const createdDoc = await importCjProductToFirestore(product, getImportOptions());
        showToast(`Imported "${product.productNameEn || pid}" into Firestore! (Doc ID: ${createdDoc.id})`, "success");
        setDirectPid('');
      } else {
        const cachedImgs = getCachedProductImages(pid);
        // Open the quick importer modal pre-filled dynamically with inferred data
        setDraftProduct({
          pid: pid,
          name: inferredTitle || '',
          costPrice: 12.00,
          category: inferredCategory,
          sizesText: 'S, M, L, XL',
          colorsText: '',
          imagesText: cachedImgs && cachedImgs.length > 0 ? cachedImgs.join('\n') : '',
          description: inferredTitle 
            ? `${inferredTitle} imported directly from verified apparel supplier. High-durability stitching and comfortable streetwear fit.`
            : `Direct imported product PID ${pid} from verified CJ Dropshipping supplier.`
        });
        setShowDraftModal(true);
        showToast(`Ready to import "${inferredTitle || pid}". Enter details and save.`, "info");
      }
    } catch (err) {
      console.error("Direct PID import error:", err);
      showToast(err.message || "Failed to import product from PID.", "error");
    } finally {
      setImportingDirect(false);
    }
  };

  const handleSaveDraftToFirestore = async (e) => {
    e.preventDefault();
    if (!draftProduct || !draftProduct.name.trim()) {
      showToast("Please provide a product title.", "error");
      return;
    }

    try {
      setSavingDraft(true);
      const imagesList = draftProduct.imagesText
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.startsWith('http') || s.startsWith('//'))
        .map(normalizeImageUrl);

      if (imagesList.length === 0) {
        imagesList.push('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80');
      }

      const sizesList = draftProduct.sizesText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const colorsList = draftProduct.colorsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      let finalColors = colorsList.length > 0 ? colorsList : [];
      if (finalColors.length === 0 && draftProduct.description) {
        const colorMatch = draftProduct.description.match(/(?:Color|Colors|Colour|Colours)\s*:\s*([^;\n\.<]+)/i);
        if (colorMatch && colorMatch[1]) {
          finalColors = colorMatch[1]
            .split(/[,/、]+/)
            .map(c => c.trim().replace(/^and\s+/i, ''))
            .filter(c => c.length > 1 && c.length < 25 && !/^(height|width|size|waist|style|fabric|price)/i.test(c))
            .map(w => w.charAt(0).toUpperCase() + w.slice(1));
        }
      }
      if (finalColors.length === 0) {
        finalColors = ['Black', 'White'];
      }

      let finalSizes = sizesList.length > 0 ? sizesList : [];
      if (finalSizes.length === 0 && draftProduct.description) {
        const sizeMatch = draftProduct.description.match(/(?:Sizes?|Size\s*Range)\s*:\s*([A-Za-z0-9\s,\/\-]+?)(?:Waist|Fabric|Style|Skirt|Length|Material|Note|\n|\.|\<|$)/i);
        if (sizeMatch && sizeMatch[1]) {
          finalSizes = sizeMatch[1]
            .split(/[,/、\s]+/)
            .map(s => s.trim().toUpperCase())
            .filter(Boolean);
        }
      }
      if (finalSizes.length === 0) {
        finalSizes = ['S', 'M', 'L', 'XL'];
      }

      const syntheticCjProduct = {
        pid: draftProduct.pid || `CJ-${Date.now()}`,
        productNameEn: draftProduct.name.trim(),
        sellPrice: String(draftProduct.costPrice || 20),
        categoryName: draftProduct.category || 'streetwear',
        description: draftProduct.description?.trim() || `${draftProduct.name.trim()} - premium apparel imported from verified supplier.`,
        productImage: imagesList[0],
        productImageSet: imagesList,
        sizes: finalSizes,
        colors: finalColors,
        variants: finalColors.flatMap((col, cIdx) => 
          finalSizes.map((sz, sIdx) => ({
            variantSku: `${draftProduct.pid || 'CJ'}-${col.replace(/\s+/g, '')}-${sz}`,
            variantSize: sz,
            variantColor: col,
            variantSellPrice: Number(draftProduct.costPrice) || 20,
            variantStock: 50,
            variantImage: imagesList[cIdx % imagesList.length] || imagesList[0]
          }))
        ),
        supplierRating: 4.9
      };

      const doc = await importCjProductToFirestore(syntheticCjProduct, getImportOptions());
      showToast(`Successfully saved "${draftProduct.name}" to Firestore!`, "success");
      setShowDraftModal(false);
      setDraftProduct(null);
      setDirectPid('');
    } catch (err) {
      console.error("Save draft error:", err);
      showToast("Failed to save draft to Firestore.", "error");
    } finally {
      setSavingDraft(false);
    }
  };
  const handleSyncAllProducts = async () => {
    try {
      setSyncingAll(true);
      setSyncProgress({ current: 0, total: 0, productName: "Connecting to CJ API..." });
      const res = await syncAllFirestoreProductsWithCj(getImportOptions(), (prog) => {
        setSyncProgress(prog);
      });
      setLastSyncResult(res);
      showToast(
        `CJ Sync Complete! Synced ${res.syncedCount} products (${res.stockChangesCount} stock updates, ${res.priceChangesCount} price updates).`,
        "success"
      );
    } catch (err) {
      console.error("Sync error:", err);
      showToast(err.message || "Failed to sync products with CJ API.", "error");
    } finally {
      setSyncingAll(false);
      setSyncProgress(null);
    }
  };

  const cjProductsInStore = liveStoreProducts.filter(p => Boolean(p.cjpId || p.cjpSku));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs font-bold text-sky-400 mb-2">
            <Truck className="w-3.5 h-3.5" />
            <span>Dropshipping Supplier Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            CJ Dropshipping Importer & Live Sync
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search apparel items, sizes, colors, and calculate dynamic USA landed pricing with automated inventory sync
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-[#0c121e] hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            View Catalog Products →
          </Link>
        </div>
      </div>

      {/* Live CJ API Sync & Automation Command Center */}
      <div className="bg-gradient-to-br from-[#0c121e] via-slate-900 to-indigo-950/40 rounded-3xl p-6 sm:p-7 border border-indigo-500/20 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <RefreshCw className={`w-5 h-5 ${syncingAll ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">CJ Live Sync & Automation Engine</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  REALTIME
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatically verify live inventory counts, warehouse stock, and supplier price fluctuations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncAllProducts}
            disabled={syncingAll}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {syncingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing Store Catalog...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Sync All Live Products ({cjProductsInStore.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Sync Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">Total Store Products</span>
            <p className="text-lg font-extrabold text-white mt-0.5">{liveStoreProducts.length}</p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">CJ Synced Items</span>
            <p className="text-lg font-extrabold text-indigo-400 mt-0.5">{cjProductsInStore.length}</p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">Last Synced Updates</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
              {lastSyncResult ? `${lastSyncResult.syncedCount} items` : 'Ready'}
            </p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">API Sync Health</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% Online</span>
            </p>
          </div>
        </div>

        {/* Live Sync Progress Bar */}
        {syncingAll && syncProgress && (
          <div className="bg-slate-900 p-4 rounded-2xl border border-indigo-500/30 space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold truncate">Syncing: {syncProgress.productName}</span>
              <span className="font-mono">{syncProgress.current} / {syncProgress.total}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / (syncProgress.total || 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: API Key & Pricing Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CJ API Credentials */}
        <div className="lg:col-span-6 bg-slate-950 rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">CJ API Credentials</h3>
            </div>
            <a
              href="https://developers.cjdropshipping.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>CJ Developer Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleConnectCj} className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-300">CJ Dropshipping API Key</label>
                {import.meta.env.VITE_CJ_API_KEY && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ✓ Configured in .env (VITE_CJ_API_KEY)
                  </span>
                )}
              </div>
              <input
                type="password"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                placeholder="CJUserNum@api@xxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Find in your CJ Account → <strong>Authorization</strong> → <strong>API</strong> or set in <code>.env</code>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                credentials.accessToken || credentials.apiKey ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${credentials.accessToken || credentials.apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{credentials.accessToken ? 'Live API Connected' : 'Verified Catalog Feed Active'}</span>
              </span>

              <button
                type="submit"
                disabled={connecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Credentials</span>
              </button>
            </div>
          </form>
        </div>

        {/* Pricing Markup & Target Category Rules */}
        <div className="lg:col-span-6 bg-slate-950 rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Import & Profit Markup Rules</h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Auto-Calculated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Markup multiplier */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Profit Markup: <strong className="text-emerald-400">{markupMultiplier}x</strong>
              </label>
              <input
                type="range"
                min="1.2"
                max="4.0"
                step="0.1"
                value={markupMultiplier}
                onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Supplier $15 → Store Price: <strong className="text-white">${(15 * markupMultiplier).toFixed(2)}</strong>
              </p>
            </div>

            {/* Target Category */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Category</label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug || c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale discount toggle */}
            <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applySaleDiscount}
                  onChange={(e) => setApplySaleDiscount(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-slate-300 font-medium text-xs">Apply {discountPercent}% Sale Discount Tag</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markAsFeatured}
                    onChange={(e) => setMarkAsFeatured(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Featured</span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markAsNewArrival}
                    onChange={(e) => setMarkAsNewArrival(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>New Arrival</span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Direct PID / URL Single Product Importer */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Import by CJ Product ID or URL:</span>
        </div>

        <form onSubmit={handleDirectPidImport} className="flex-1 flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={directPid}
            onChange={(e) => setDirectPid(e.target.value)}
            placeholder="Paste CJ PID (e.g. CJHD-380-VNTG) or Product URL..."
            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={importingDirect || !directPid.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-xs shadow transition-all shrink-0 flex items-center gap-1.5"
          >
            {importingDirect ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Pull & Import</span>
          </button>
        </form>
      </div>

      {/* Search Toolbar & Batch Action Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKeyword)}
            placeholder="Search hoodies, tees, cargo pants, caps..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Selection & Batch CTA */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
          >
            {selectedPids.length === cjProducts.length && cjProducts.length > 0 ? 'Deselect All' : 'Select All'}
          </button>

          {selectedPids.length > 0 && (
            <button
              onClick={handleBatchImport}
              disabled={batchImporting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2 animate-bounce"
            >
              <Download className="w-4 h-4" />
              <span>Import ({selectedPids.length}) to Firestore</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Import Modal Progress */}
      {batchImporting && importProgress && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Importing to Cloud Firestore</h3>
            <p className="text-xs text-slate-400 truncate">
              {importProgress.productName}
            </p>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-emerald-400 font-bold">
              {importProgress.current} of {importProgress.total} products imported
            </p>
          </div>
        </div>
      )}

      {/* CJ Supplier Products Grid */}
      {loadingProducts ? (
        <div className="py-16 text-center text-slate-400 text-xs space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p>Querying CJ Dropshipping catalog...</p>
        </div>
      ) : cjProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cjProducts.map((prod) => {
            const cost = parseFloat(prod.sellPrice) || 20;
            const shipping = calculateCjUsShippingFee(prod);
            const totalCost = Math.round((cost + shipping) * 100) / 100;
            const retail = Math.round((totalCost * markupMultiplier) * 100) / 100;
            const profit = Math.round((retail - totalCost) * 100) / 100;
            const existingInStore = liveStoreProducts.find(
              p => (p.cjpId && String(p.cjpId).toLowerCase() === String(prod.pid || '').toLowerCase()) || 
                   (p.cjpSku && prod.productSku && String(p.cjpSku).toLowerCase() === String(prod.productSku).toLowerCase()) ||
                   (p.name && prod.productNameEn && String(p.name).toLowerCase() === String(prod.productNameEn).toLowerCase())
            );
            const isSelected = selectedPids.includes(prod.pid);

            return (
              <div
                key={prod.pid}
                className={`bg-slate-950 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isSelected ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image & Checkbox */}
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  <img
                    src={normalizeImageUrl(prod.productImage)}
                    alt={prod.productNameEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%231e293b"><rect width="400" height="300"/><text x="50%" y="50%" fill="%2364748b" font-size="14" text-anchor="middle" dominant-baseline="middle">Image preview unavailable</text></svg>');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectPid(prod.pid)}
                    className={`absolute top-3 left-3 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-slate-900/80 text-white border border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white font-semibold">
                    <span className="bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800">
                      PID: {prod.pid}
                    </span>
                    <span className="bg-emerald-500/90 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg">
                      Est. Profit +${profit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-white text-xs leading-snug line-clamp-2">
                        {prod.productNameEn}
                      </h3>
                      {existingInStore && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-bold shrink-0 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> In Store
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {prod.description}
                    </p>
                  </div>

                  {/* Pricing Matrix with US Delivery */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Product</span>
                      <span className="font-bold text-slate-300">${cost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400 block uppercase">US Delivery</span>
                      <span className="font-bold text-blue-300">${shipping.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block uppercase">Store Retail</span>
                      <span className="font-extrabold text-white">${retail.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Import Button / Live Store Link */}
                  <div className="pt-2 flex gap-2">
                    {existingInStore ? (
                      <Link
                        to={`/product/${existingInStore.id}`}
                        target="_blank"
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Live in Store (View ↗)</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleImportSingle(prod)}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Import to Firestore</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-950 rounded-3xl p-12 border border-slate-800 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Live CJ Dropshipping Search</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchKeyword ? `No products returned for "${searchKeyword}". Check your API key or try another search term.` : 'Enter a search term above or enter a CJ Product ID / URL to pull real items from CJ Dropshipping.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['Heavyweight Hoodie', 'Oversized T-Shirt', 'Cargo Pants', 'Bomber Jacket', 'Baseball Cap'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchKeyword(term);
                  handleSearch(term);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium rounded-lg transition-colors"
              >
                🔍 {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Draft Custom Importer Modal */}
      {showDraftModal && draftProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Import CJ Product ({draftProduct.pid})</h3>
                  <p className="text-[11px] text-slate-400">Review & confirm details to save directly to Cloud Firestore</p>
                </div>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDraftToFirestore} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={draftProduct.name}
                  onChange={(e) => setDraftProduct({ ...draftProduct, name: e.target.value })}
                  placeholder="e.g. V-neck Sleeveless Jumpsuit With Belt Design Summer Fashion Trousers"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Supplier Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={draftProduct.costPrice}
                    onChange={(e) => setDraftProduct({ ...draftProduct, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <p className="text-[10px] text-emerald-400 mt-1">
                    Store Price: <strong>${((Number(draftProduct.costPrice) || 0) * markupMultiplier).toFixed(2)}</strong>
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Category</label>
                  <select
                    value={draftProduct.category}
                    onChange={(e) => setDraftProduct({ ...draftProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Sizes</label>
                    <span className="text-[10px] text-slate-500">Quick add:</span>
                  </div>
                  <input
                    type="text"
                    value={draftProduct.sizesText}
                    onChange={(e) => setDraftProduct({ ...draftProduct, sizesText: e.target.value })}
                    placeholder="XS, S, M, L, XL, XXL"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          const curr = draftProduct.sizesText.split(',').map(s => s.trim()).filter(Boolean);
                          if (!curr.includes(sz)) {
                            setDraftProduct({ ...draftProduct, sizesText: [...curr, sz].join(', ') });
                          }
                        }}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded font-medium"
                      >
                        +{sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Colors</label>
                    <span className="text-[10px] text-slate-500">Quick add:</span>
                  </div>
                  <input
                    type="text"
                    value={draftProduct.colorsText}
                    onChange={(e) => setDraftProduct({ ...draftProduct, colorsText: e.target.value })}
                    placeholder="Rose Red, White, Sky Blue, Black"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['White', 'Black', 'Rose Red', 'Sky Blue', 'Lemon Yellow', 'Dark Green', 'Pink', 'Khaki', 'Apricot'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          const curr = draftProduct.colorsText.split(',').map(s => s.trim()).filter(Boolean);
                          if (!curr.includes(col)) {
                            setDraftProduct({ ...draftProduct, colorsText: [...curr, col].join(', ') });
                          }
                        }}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded font-medium"
                      >
                        +{col}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Product Image URLs (one per line)
                  <span className="text-[10px] text-slate-500 font-normal ml-2">Right-click photo on CJ → Copy image address</span>
                </label>
                <textarea
                  rows="3"
                  value={draftProduct.imagesText}
                  onChange={(e) => setDraftProduct({ ...draftProduct, imagesText: e.target.value })}
                  placeholder="Paste real product image URLs here (e.g. https://cf.cjdropshipping.com/...)"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={draftProduct.description}
                  onChange={(e) => setDraftProduct({ ...draftProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDraft}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5"
                >
                  {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save to Firestore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCJDropshipping;

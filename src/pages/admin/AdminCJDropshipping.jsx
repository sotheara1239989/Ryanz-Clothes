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
      showToast("✓ Successfully connected to CJ Dropshipping API & generated live access token!", "success");
      handleSearch(searchKeyword);
    } catch (err) {
      console.error("CJ connection error:", err);
      // Still save API key for future attempts
      saveCjCredentials(credentials);
      showToast(`CJ API Notice: ${err.message || 'Could not authenticate. Verify your CJ API Key in CJ Developer Portal.'}`, "error");
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            CJ Dropshipping
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Search apparel items, calculate retail pricing, and import products into Firestore
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncAllProducts}
            disabled={syncingAll}
            className="px-3.5 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>{syncingAll ? 'Syncing...' : `Sync All (${cjProductsInStore.length})`}</span>
          </button>
        </div>
      </div>

      {/* Pricing Markup & Target Category Rules */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Pricing &amp; Category Rules</h3>
          </div>
          <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
            Auto-Applied on Import
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Markup Multiplier: <strong className="text-gray-900">{markupMultiplier}x</strong>
            </label>
            <input
              type="range"
              min="1.2"
              max="4.0"
              step="0.1"
              value={markupMultiplier}
              onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Supplier $15 &rarr; Store Price: <strong className="text-gray-900">${(15 * markupMultiplier).toFixed(2)}</strong>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Target Category</label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black text-xs cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug || c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applySaleDiscount}
                onChange={(e) => setApplySaleDiscount(e.target.checked)}
                className="accent-black w-4 h-4"
              />
              <span className="text-gray-700 font-medium text-xs">Apply {discountPercent}% Sale Discount Tag</span>
            </label>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markAsFeatured}
                  onChange={(e) => setMarkAsFeatured(e.target.checked)}
                  className="accent-black w-4 h-4"
                />
                <span>Featured</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markAsNewArrival}
                  onChange={(e) => setMarkAsNewArrival(e.target.checked)}
                  className="accent-black w-4 h-4"
                />
                <span>New Arrival</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Direct PID / URL Single Product Importer */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-800">Direct PID / URL Import:</span>
        </div>

        <form onSubmit={handleDirectPidImport} className="flex-1 flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={directPid}
            onChange={(e) => setDirectPid(e.target.value)}
            placeholder="Paste CJ PID or Product URL..."
            className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
          <button
            type="submit"
            disabled={importingDirect || !directPid.trim()}
            className="px-3.5 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            {importingDirect ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Pull &amp; Import</span>
          </button>
        </form>
      </div>

      {/* Search Toolbar & Batch Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKeyword)}
            placeholder="Search hoodies, tees, cargo pants..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Selection & Batch CTA */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
          >
            {selectedPids.length === cjProducts.length && cjProducts.length > 0 ? 'Deselect All' : 'Select All'}
          </button>

          {selectedPids.length > 0 && (
            <button
              onClick={handleBatchImport}
              disabled={batchImporting}
              className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import ({selectedPids.length}) to Firestore</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Import Modal Progress */}
      {batchImporting && importProgress && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full text-center space-y-3 shadow-2xl">
            <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">Importing Products</h3>
            <p className="text-xs text-gray-500 truncate">
              {importProgress.productName}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-700 font-semibold">
              {importProgress.current} of {importProgress.total} products imported
            </p>
          </div>
        </div>
      )}

      {/* CJ Supplier Products Grid */}
      {loadingProducts ? (
        <div className="py-12 text-center text-gray-400 text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-black mx-auto" />
          <p>Querying CJ Dropshipping catalog...</p>
        </div>
      ) : cjProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs ${
                  isSelected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Image & Checkbox */}
                <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                  <img
                    src={normalizeImageUrl(prod.productImage)}
                    alt={prod.productNameEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23f1f5f9"><rect width="400" height="300"/><text x="50%" y="50%" fill="%2394a3b8" font-size="14" text-anchor="middle" dominant-baseline="middle">Preview unavailable</text></svg>');
                    }}
                  />

                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectPid(prod.pid)}
                    className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected ? 'bg-black text-white shadow-xs' : 'bg-white/90 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold">
                    <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded text-gray-800 border border-gray-200">
                      PID: {prod.pid}
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded">
                      +${profit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">
                        {prod.productNameEn}
                      </h3>
                      {existingInStore && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold shrink-0 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> In Store
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">
                      {prod.description}
                    </p>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Supplier</span>
                      <span className="font-semibold text-gray-700">${cost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">US Ship</span>
                      <span className="font-semibold text-gray-700">${shipping.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Store Price</span>
                      <span className="font-bold text-gray-900">${retail.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Import Button */}
                  <div className="pt-1 flex gap-2">
                    {existingInStore ? (
                      <Link
                        to={`/product/${existingInStore.id}`}
                        target="_blank"
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>View in Store &rarr;</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleImportSingle(prod)}
                        className="flex-1 py-2 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Import to Store</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center max-w-xl mx-auto space-y-3 shadow-xs">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Search CJ Dropshipping Catalog</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchKeyword ? `No products returned for "${searchKeyword}". Check your query or search again.` : 'Enter a search term above to discover and import apparel.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {['Heavyweight Hoodie', 'Oversized T-Shirt', 'Cargo Pants', 'Bomber Jacket', 'Baseball Cap'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchKeyword(term);
                  handleSearch(term);
                }}
                className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-medium rounded-md transition-colors"
              >
                {term}
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

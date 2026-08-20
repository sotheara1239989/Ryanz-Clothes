import { addProduct } from './productService';

const CJ_STORAGE_KEY = 'ryanz_cj_credentials';
export const CJ_API_BASE = typeof window !== 'undefined' && window.location?.origin
  ? '/cj-api'
  : 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Helper to throttle sequential requests to respect CJ's rate limits
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Centralized Rate Limiting Request Queue for CJ Dropshipping API
 * Guarantees a minimum 1000ms delay between consecutive requests to prevent HTTP 429 errors.
 */
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1000; // Strict 1000ms rate limit
let requestQueue = Promise.resolve();

export const cjFetch = (endpoint, options = {}) => {
  return new Promise((resolve, reject) => {
    requestQueue = requestQueue
      .then(async () => {
        const now = Date.now();
        const timeSinceLast = now - lastRequestTime;
        if (timeSinceLast < RATE_LIMIT_DELAY) {
          await sleep(RATE_LIMIT_DELAY - timeSinceLast);
        }
        lastRequestTime = Date.now();

        const url = endpoint.startsWith('http') || endpoint.startsWith('/cj-api')
          ? endpoint
          : `${CJ_API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

        return fetch(url, options);
      })
      .then(resolve)
      .catch(reject);
  });
};

/**
 * Universal CJ Image Normalizer
 * Strategy:
 *   1. img.cjdropshipping.com (DEAD CDN) → remap to cf.cjdropshipping.com
 *   2. cf.cjdropshipping.com → keep as-is
 *   3. cdn.shopify.com / other CDNs → keep as-is
 *   4. Protocol-relative // URLs → prefix with https:
 *   5. null/empty → placeholder
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
  }

  let trimmed = url.trim();

  // Protocol-relative URLs
  if (trimmed.startsWith('//')) {
    trimmed = 'https:' + trimmed;
  }

  // Dead CDN: remap any img.cjdropshipping.com link to cf.cjdropshipping.com
  if (/img\.cjdropshipping\.com/i.test(trimmed)) {
    const uuidMatch = trimmed.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
      return `https://cf.cjdropshipping.com/quick/product/${uuidMatch[1]}.jpg`;
    }
    return trimmed.replace(/img\.cjdropshipping\.com/i, 'cf.cjdropshipping.com');
  }

  return trimmed;
};

const IMAGE_CACHE_KEY = 'ryanz_cj_image_cache';

export const getCachedProductImages = (idOrSku) => {
  if (!idOrSku || typeof idOrSku !== 'string') return null;
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const found = cache[idOrSku.toLowerCase().trim()];
    return Array.isArray(found) && found.length > 0 ? found : null;
  } catch {
    return null;
  }
};

export const cacheProductImages = (idOrSku, images) => {
  if (!idOrSku || !Array.isArray(images) || images.length === 0) return;
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const normalized = images.map(normalizeImageUrl).filter(Boolean);
    if (normalized.length > 0) {
      cache[String(idOrSku).toLowerCase().trim()] = normalized;
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.warn("Could not save image cache:", e);
  }
};

export const STANDARD_SIZES = new Set([
  'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL', '4XL', 'XXXXL', '5XL',
  'ONE SIZE', 'FREE SIZE', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44'
]);

export const KNOWN_COLORS = [
  'rose red', 'sky blue', 'navy blue', 'dark green', 'rose pink', 'lemon yellow',
  'dark grey', 'dark gray', 'hot pink', 'light blue', 'army green', 'off white',
  'olive', 'rust', 'sage', 'mocha', 'taupe', 'charcoal', 'teal', 'mint', 'camel',
  'mustard', 'coral', 'lilac', 'emerald', 'ivory', 'copper', 'maroon', 'burgundy',
  'wine', 'white', 'black', 'red', 'blue', 'navy', 'pink', 'yellow', 'green', 'khaki',
  'grey', 'gray', 'apricot', 'beige', 'cream', 'brown', 'coffee', 'orange',
  'purple', 'lavender', 'gold', 'silver', 'floral', 'multicolor'
];

export const isAuthenticColor = (str) => {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  if (!s || s === 'default' || s === 'standard' || s === 'one size') return false;
  if (/^(\d+|height|width|\d+cm|\d+mm|\d+px|=)/i.test(s) || /^\d+$/.test(s)) return false;
  if (KNOWN_COLORS.some(kc => s.includes(kc))) return true;
  return /^[a-z\s\/-]{2,20}$/i.test(s) && !/(\d|width|height|size)/i.test(s);
};

/**
 * Smart Multi-Hyphen Variant Key Parser
 * Correctly identifies size (checking STANDARD_SIZES, numeric waist/shoe sizes, and aliases)
 * and extracts clean color names even for multi-hyphen variants (e.g. "Dark-Blue-Vintage-Wash-M").
 */
export const parseVariantKey = (rawKey) => {
  if (!rawKey || typeof rawKey !== 'string') {
    return { color: '', size: '' };
  }

  let str = rawKey.trim();
  // Strip HTML tags and specification labels
  str = str.replace(/<[^>]+>/g, '').replace(/^(dimension|width|height|size|color)\s*[:=]\s*/i, '');

  // Normalize delimiters to hyphens
  const tokens = str.split(/[-_/]+/).map(t => t.trim()).filter(Boolean);
  if (tokens.length === 0) return { color: '', size: '' };

  let detectedSize = '';
  let sizeTokenIndex = -1;

  // 1. Scan tokens from RIGHT to LEFT for standard apparel size, numeric waist/shoe sizes, or 'one size'
  for (let i = tokens.length - 1; i >= 0; i--) {
    const tokUpper = tokens[i].toUpperCase();
    if (
      STANDARD_SIZES.has(tokUpper) || 
      /^\d{2,3}$/.test(tokUpper) || 
      /^(\d+cm|\d+mm|\d+px)$/i.test(tokUpper) || 
      /one\s*size|free\s*size/i.test(tokUpper)
    ) {
      detectedSize = tokens[i];
      sizeTokenIndex = i;
      break;
    }
  }

  // 2. If not detected right-to-left, check the FIRST token (left-to-right, e.g. "M-Dark-Blue-Vintage")
  if (!detectedSize && tokens.length > 1) {
    const firstTokUpper = tokens[0].toUpperCase();
    if (
      STANDARD_SIZES.has(firstTokUpper) || 
      /^\d{2,3}$/.test(firstTokUpper) || 
      /one\s*size|free\s*size/i.test(firstTokUpper)
    ) {
      detectedSize = tokens[0];
      sizeTokenIndex = 0;
    }
  }

  // 3. Assemble the color name from remaining tokens
  let colorTokens = [];
  if (sizeTokenIndex !== -1) {
    colorTokens = tokens.filter((_, idx) => idx !== sizeTokenIndex);
  } else {
    colorTokens = tokens;
  }

  let detectedColor = colorTokens.join(' ').trim();
  // Strip dimensions or leading symbols
  detectedColor = detectedColor.replace(/^(height|width|\d+cm|\d+px|=)\s*/i, '').trim();

  return {
    color: detectedColor,
    size: detectedSize
  };
};

/**
 * Robust date parser supporting ISO strings, space-separated timestamps, and slash notations.
 * Returns numeric timestamp (ms) or NaN if completely unparseable.
 */
export const safeParseDate = (dateVal) => {
  if (!dateVal) return NaN;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal !== 'string') return NaN;

  const trimmed = dateVal.trim();
  let parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return parsed;

  // Format: "YYYY-MM-DD HH:mm:ss" -> replace space with 'T'
  if (trimmed.includes(' ') && !trimmed.includes('T')) {
    parsed = Date.parse(trimmed.replace(/\s+/, 'T'));
    if (!isNaN(parsed)) return parsed;
  }

  // Format: "YYYY/MM/DD HH:mm:ss"
  if (trimmed.includes('/')) {
    parsed = Date.parse(trimmed.replace(/-/g, '/'));
    if (!isNaN(parsed)) return parsed;
  }

  // Timestamp in seconds (10 digits)
  if (/^\d{10}$/.test(trimmed)) {
    return parseInt(trimmed, 10) * 1000;
  }
  // Timestamp in milliseconds (13 digits)
  if (/^\d{13}$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  return NaN;
};

/**
 * Retrieve stored CJ Dropshipping credentials from .env or localStorage
 */
export const getCjCredentials = () => {
  const envApiKey = import.meta.env.VITE_CJ_API_KEY || '';
  const envAccessToken = import.meta.env.VITE_CJ_ACCESS_TOKEN || '';
  const envRefreshToken = import.meta.env.VITE_CJ_REFRESH_TOKEN || '';
  const envEmail = import.meta.env.VITE_CJ_EMAIL || '';

  try {
    const saved = localStorage.getItem(CJ_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiKey: envApiKey || parsed.apiKey || '',
        accessToken: parsed.accessToken || envAccessToken || '',
        accessTokenExpiryDate: parsed.accessTokenExpiryDate || '',
        refreshToken: parsed.refreshToken || envRefreshToken || '',
        refreshTokenExpiryDate: parsed.refreshTokenExpiryDate || '',
        email: envEmail || parsed.email || ''
      };
    }
  } catch (e) {
    console.warn("Could not read CJ credentials from storage:", e);
  }

  return {
    apiKey: envApiKey,
    accessToken: envAccessToken,
    accessTokenExpiryDate: '',
    refreshToken: envRefreshToken,
    refreshTokenExpiryDate: '',
    email: envEmail
  };
};

/**
 * Save CJ Dropshipping credentials
 */
export const saveCjCredentials = (credentials) => {
  try {
    localStorage.setItem(CJ_STORAGE_KEY, JSON.stringify(credentials));
    return true;
  } catch (e) {
    console.error("Failed to save CJ credentials:", e);
    throw e;
  }
};

/**
 * Obtain an access token from CJ Dropshipping API via cjFetch
 */
export const fetchCjAccessToken = async (apiKey) => {
  if (!apiKey) throw new Error("API Key is required to fetch CJ access token.");

  try {
    const response = await cjFetch('/authentication/getAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey: apiKey.trim() })
    });

    const data = await response.json();
    if ((data.result || data.code === 200) && data.data?.accessToken) {
      const creds = {
        apiKey: apiKey.trim(),
        accessToken: data.data.accessToken,
        accessTokenExpiryDate: data.data.accessTokenExpiryDate || '',
        refreshToken: data.data.refreshToken || '',
        refreshTokenExpiryDate: data.data.refreshTokenExpiryDate || ''
      };
      saveCjCredentials(creds);
      return creds;
    } else {
      throw new Error(data.message || "Failed to obtain CJ access token");
    }
  } catch (error) {
    console.error("CJ getAccessToken error:", error);
    throw error;
  }
};

/**
 * Refresh expired access token using refreshToken via cjFetch
 */
export const refreshCjAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token is required.");

  try {
    const response = await cjFetch('/authentication/refreshAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: refreshToken.trim() })
    });

    const data = await response.json();
    if ((data.result || data.code === 200) && data.data?.accessToken) {
      const current = getCjCredentials();
      const updated = {
        ...current,
        accessToken: data.data.accessToken,
        accessTokenExpiryDate: data.data.accessTokenExpiryDate || '',
        refreshToken: data.data.refreshToken || refreshToken,
        refreshTokenExpiryDate: data.data.refreshTokenExpiryDate || ''
      };
      saveCjCredentials(updated);
      return updated;
    } else {
      throw new Error(data.message || "Failed to refresh CJ access token");
    }
  } catch (error) {
    console.error("CJ refreshAccessToken error:", error);
    throw error;
  }
};

/**
 * Check if token needs refresh and get valid access token.
 * Uses safeParseDate with automatic fallback to prevent silent failures on non-standard date strings.
 */
export const getValidAccessToken = async () => {
  let { apiKey, accessToken, accessTokenExpiryDate, refreshToken } = getCjCredentials();

  // Check if token is expired or has invalid date format
  if (accessToken) {
    let isExpiredOrInvalid = false;

    if (accessTokenExpiryDate) {
      const expiryTimestamp = safeParseDate(accessTokenExpiryDate);
      if (isNaN(expiryTimestamp)) {
        // Non-standard date string that evaluated to NaN -> force token refresh
        console.warn(`[CJ Auth] accessTokenExpiryDate evaluated to NaN ("${accessTokenExpiryDate}"). Forcing token refresh.`);
        isExpiredOrInvalid = true;
      } else if (Date.now() > expiryTimestamp - 60000) {
        // Expired or expiring within 60s
        isExpiredOrInvalid = true;
      }
    }

    if (isExpiredOrInvalid) {
      if (refreshToken) {
        try {
          const refreshed = await refreshCjAccessToken(refreshToken);
          return refreshed.accessToken;
        } catch (refErr) {
          console.warn("[CJ Auth] Token refresh failed, falling back to apiKey:", refErr);
        }
      }
      accessToken = '';
    } else {
      return accessToken;
    }
  }

  // Fallback to apiKey authentication
  if (!accessToken && apiKey) {
    try {
      const authRes = await fetchCjAccessToken(apiKey);
      return authRes.accessToken;
    } catch (authErr) {
      console.error("[CJ Auth] Failed to authenticate with apiKey:", authErr);
      return null;
    }
  }

  return accessToken || null;
};

/**
 * Helper to map any raw CJ product shape to consistent store format
 */
const mapCjProduct = (p) => {
  if (!p || typeof p !== 'object') return null;
  const pid = p.id || p.pid || p.productId || '';
  const name = p.nameEn || p.productNameEn || p.productName || p.name || 'Streetwear Apparel';
  const sku = p.sku || p.spu || p.productSku || '';
  const img = p.bigImage || p.productImage || p.image || '';
  const imgSet = Array.isArray(p.productImageSet) ? p.productImageSet : (p.imageSet || [img]);
  const price = String(p.sellPrice || p.variantSellPrice || p.price || '20.00');
  const cat = p.categoryName || p.category || 'Streetwear';
  const desc = p.description || p.productDescription || '';
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const weight = p.productWeight || p.weight || p.packingWeight || p.packWeight || p.unitWeight || (variants[0]?.variantWeight) || null;

  return {
    pid,
    productNameEn: name,
    productSku: sku,
    productImage: img,
    productImageSet: imgSet,
    sellPrice: price,
    categoryName: cat,
    description: desc,
    variants,
    productWeight: weight,
    weight: weight,
    supplierRating: 4.9,
    warehouseLocation: "Verified CJ Warehouse"
  };
};

/**
 * Search CJ Dropshipping products via live API
 * Handles real /product/listV2 response shapes with fallback to /product/list and /product/query
 */
export const searchCjProducts = async (params = {}) => {
  const { keyword = '', page = 1, size = 20, categoryId = '' } = params;

  if (!keyword.trim() && !categoryId) {
    return { source: 'empty', total: 0, products: [] };
  }

  const accessToken = await getValidAccessToken();

  if (accessToken) {
    // 1. Try /product/listV2
    try {
      const qParams = new URLSearchParams({
        pageNum: String(page),
        pageSize: String(size),
        page: String(page),
        size: String(size),
        ...(keyword ? {
          keyWord: keyword.trim(),
          keyword: keyword.trim(),
          productNameEn: keyword.trim(),
          productName: keyword.trim()
        } : {}),
        ...(categoryId ? { categoryId } : {})
      });

      const response = await cjFetch(`/product/listV2?${qParams.toString()}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const isSuccess = data.result === true || data.code === 200 || String(data.message).toLowerCase() === 'success';

      let rawList = [];
      let totalCount = 0;

      if (isSuccess && data.data) {
        if (Array.isArray(data.data?.content) && data.data.content[0]?.productList) {
          rawList = data.data.content[0].productList;
          totalCount = data.data.content[0].totalRecords || data.data.content[0].total || rawList.length;
        } else if (Array.isArray(data.data?.content?.[0])) {
          rawList = data.data.content[0];
          totalCount = rawList.length;
        } else if (Array.isArray(data.data?.content)) {
          rawList = data.data.content;
          totalCount = rawList.length;
        } else if (Array.isArray(data.data?.list)) {
          rawList = data.data.list;
          totalCount = data.data.total || rawList.length;
        } else if (Array.isArray(data.data?.records)) {
          rawList = data.data.records;
          totalCount = data.data.total || rawList.length;
        } else if (Array.isArray(data.data?.items)) {
          rawList = data.data.items;
          totalCount = rawList.length;
        } else if (Array.isArray(data.data)) {
          rawList = data.data;
          totalCount = rawList.length;
        }
      }

      if (rawList.length > 0) {
        const mappedProducts = rawList.map(mapCjProduct).filter(Boolean);
        return {
          source: 'api',
          total: totalCount || mappedProducts.length,
          products: mappedProducts
        };
      }
    } catch (v2Err) {
      console.warn("listV2 query failed, attempting alternate search:", v2Err);
    }

    // 2. Fallback: Try /product/list
    try {
      const qParamsFallback = new URLSearchParams({
        pageNum: String(page),
        pageSize: String(size),
        ...(keyword ? { productNameEn: keyword.trim(), keyWord: keyword.trim(), keyword: keyword.trim() } : {}),
        ...(categoryId ? { categoryId } : {})
      });

      const response = await cjFetch(`/product/list?${qParamsFallback.toString()}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if ((data.result || data.code === 200) && data.data) {
        const rawList = Array.isArray(data.data.list) ? data.data.list : (Array.isArray(data.data) ? data.data : []);
        if (rawList.length > 0) {
          const mappedProducts = rawList.map(mapCjProduct).filter(Boolean);
          return {
            source: 'api',
            total: data.data.total || mappedProducts.length,
            products: mappedProducts
          };
        }
      }
    } catch (fallbackErr) {
      console.warn("Fallback /product/list failed:", fallbackErr);
    }

    // 3. Fallback: If keyword looks like a SKU or PID, query /product/query
    if (keyword.trim().startsWith('CJ') || /^\d{6,}$/.test(keyword.trim())) {
      try {
        const directProd = await fetchCjProductDetails(keyword.trim());
        if (directProd) {
          return {
            source: 'api',
            total: 1,
            products: [mapCjProduct(directProd)].filter(Boolean)
          };
        }
      } catch (directErr) {
        console.warn("Direct PID query fallback failed:", directErr);
      }
    }
  }

  return {
    source: accessToken ? 'api' : 'no_auth',
    total: 0,
    products: []
  };
};

/**
 * Fetch detailed product info dynamically from CJ API by PID or SKU
 * Depth guard prevents infinite recursive lookups.
 * All outbound requests are rate-limited via cjFetch.
 */
export const fetchCjProductDetails = async (identifier, depth = 0) => {
  if (!identifier || depth > 1) return null;
  const id = identifier.trim();

  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  // 1. Try querying by productSku (e.g. CJLS...)
  try {
    const resSku = await cjFetch(`/product/query?productSku=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    const dataSku = await resSku.json();
    if ((dataSku.result || dataSku.code === 200) && dataSku.data && (dataSku.data.productNameEn || dataSku.data.productName || dataSku.data.nameEn)) {
      return dataSku.data;
    }
  } catch (err) {
    console.warn(`Query by productSku failed for ${id}:`, err);
  }

  // 2. Try querying by PID
  try {
    const response = await cjFetch(`/product/query?pid=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if ((data.result || data.code === 200) && data.data && (data.data.productNameEn || data.data.productName || data.data.nameEn)) {
      return data.data;
    }
  } catch (err) {
    console.warn(`Query by pid failed for ${id}:`, err);
  }

  // 3. Fallback: Search listV2 with depth guard
  if (depth === 0) {
    try {
      const searchRes = await searchCjProducts({ keyword: id, page: 1, size: 1 });
      if (searchRes.products && searchRes.products.length > 0) {
        const item = searchRes.products[0];
        if (item.pid && item.pid !== id) {
          const detailed = await fetchCjProductDetails(item.pid, depth + 1);
          if (detailed) return detailed;
        }
        return item;
      }
    } catch (err) {
      console.warn(`Search listV2 fallback failed for ${id}:`, err);
    }
  }

  return null;
};

/**
 * Extract all image URLs from product, variants, and description HTML
 */
const extractAllImages = (cjProduct) => {
  if (!cjProduct || typeof cjProduct !== 'object') return [];
  const imageSet = new Set();

  const addValidImg = (rawUrl) => {
    if (!rawUrl) return;
    const url = typeof rawUrl === 'object' ? (rawUrl.url || rawUrl.image || rawUrl.imgUrl) : rawUrl;
    if (typeof url === 'string') {
      const normalized = normalizeImageUrl(url);
      if (normalized && normalized.startsWith('http') && !normalized.includes('pixel') && !normalized.includes('tracking')) {
        imageSet.add(normalized);
      }
    }
  };

  // 1. Existing images array
  if (Array.isArray(cjProduct.images)) {
    cjProduct.images.forEach(img => addValidImg(img));
  }

  // 2. Main images
  addValidImg(cjProduct.productImage);
  addValidImg(cjProduct.bigImage);
  addValidImg(cjProduct.smallImage);

  // 3. Gallery images array or JSON/comma string
  if (Array.isArray(cjProduct.productImageSet)) {
    cjProduct.productImageSet.forEach(img => addValidImg(img));
  } else if (typeof cjProduct.productImageSet === 'string') {
    try {
      const parsed = JSON.parse(cjProduct.productImageSet);
      if (Array.isArray(parsed)) parsed.forEach(img => addValidImg(img));
    } catch {
      cjProduct.productImageSet.split(',').forEach(img => addValidImg(img));
    }
  }

  // 4. Variant images
  if (Array.isArray(cjProduct.variants)) {
    cjProduct.variants.forEach(v => {
      if (v && typeof v === 'object') {
        addValidImg(v.variantImage);
        addValidImg(v.variantImg);
        addValidImg(v.image);
        addValidImg(v.imgUrl);
      }
    });
  }

  // 5. Embedded images in description HTML (if gallery is small)
  if (imageSet.size < 6 && typeof cjProduct.description === 'string' && cjProduct.description.includes('<img')) {
    const regex = /<img[^>]+src=["']([^"'>]+)["']/gi;
    let match;
    while ((match = regex.exec(cjProduct.description)) !== null) {
      addValidImg(match[1]);
      if (imageSet.size >= 12) break;
    }
  }

  // 6. Cache fallback for re-imported items
  if (imageSet.size === 0) {
    const cached = getCachedProductImages(cjProduct.pid) || getCachedProductImages(cjProduct.productSku);
    if (cached && Array.isArray(cached)) {
      cached.forEach(img => addValidImg(img));
    }
  }

  const finalImgs = Array.from(imageSet).slice(0, 15);

  // Persist into cache for future re-imports
  if (finalImgs.length > 0) {
    if (cjProduct.pid) cacheProductImages(cjProduct.pid, finalImgs);
    if (cjProduct.productSku) cacheProductImages(cjProduct.productSku, finalImgs);
  }

  return finalImgs;
};

/**
 * Extract live shipping freight from CJ listing data if present (e.g. "$8.05-9.56" or numeric freight)
 */
export const extractListingFreight = (item) => {
  if (!item || typeof item !== 'object') return null;
  const raw = item.shippingCost || item.shippingFee || item.freight || item.postage || item.logisticPrice || item.defaultShippingPrice || null;
  if (typeof raw === 'number' && raw > 0) return Math.round(raw * 100) / 100;
  if (typeof raw === 'string' && raw.trim()) {
    const matches = raw.match(/\d+(?:\.\d+)?/g);
    if (matches && matches.length > 0) {
      const nums = matches.map(Number);
      return nums[0]; // e.g. 8.05 from "8.05-9.56"
    }
  }
  return null;
};

/**
 * Calculate estimated CJ delivery price to USA (CJPacket Ordinary / USPS) based on product weight & category
 * Priority: 1. Live listing shipping cost -> 2. Extracted weight -> 3. Dynamic category/price curve
 * @param {Object} item - CJ Product or Variant object
 * @returns {number} Estimated shipping cost in USD (e.g. $4.85 - $10.50)
 */
export const calculateCjUsShippingFee = (item = {}, serviceName = 'CJPacket Ordinary') => {
  if (!item || typeof item !== 'object') return 5.50;
  
  // 1. Direct from actual CJ Listing freight if provided
  const directListingFreight = extractListingFreight(item);
  if (directListingFreight && directListingFreight > 0) {
    return directListingFreight;
  }

  let weightInGrams = 0;
  
  // 2. Extract raw weight from any provided field (weight, variantWeight, productWeight, packWeight)
  const rawWeight = item.variantWeight || item.productWeight || item.weight || item.packingWeight || item.packWeight || item.unitWeight || 0;
  if (typeof rawWeight === 'number' && rawWeight > 0) {
    weightInGrams = rawWeight > 30 ? rawWeight : rawWeight * 1000;
  } else if (typeof rawWeight === 'string' && rawWeight.trim()) {
    const clean = rawWeight.replace(/[^\d.]/g, '');
    const parsed = parseFloat(clean) || 0;
    if (parsed > 0) {
      weightInGrams = parsed > 30 ? parsed : parsed * 1000;
    }
  }

  // 3. If weight is missing or negligible, estimate based on title, price, and category
  if (weightInGrams <= 30) {
    const text = `${item.productNameEn || item.productName || item.name || ''} ${item.categoryName || item.category || ''} ${item.description || ''}`.toLowerCase();
    const itemCost = parseFloat(item.sellPrice || item.variantSellPrice || item.price || 15) || 15;

    if (text.includes('winter') || text.includes('parka') || text.includes('down jacket') || text.includes('heavy coat')) {
      weightInGrams = 850 + (itemCost * 8);
    } else if (text.includes('hoodie') || text.includes('sweater') || text.includes('sweatshirt') || text.includes('fleece') || text.includes('pullover')) {
      weightInGrams = 520 + (itemCost * 6);
    } else if (text.includes('jacket') || text.includes('bomber') || text.includes('windbreaker')) {
      weightInGrams = 480 + (itemCost * 5);
    } else if (text.includes('cargo') || text.includes('tactical') || text.includes('multi-pocket')) {
      weightInGrams = 450 + (itemCost * 7);
    } else if (text.includes('jean') || text.includes('denim')) {
      weightInGrams = 520 + (itemCost * 6);
    } else if (text.includes('pant') || text.includes('trouser') || text.includes('sweatpant') || text.includes('jogger')) {
      weightInGrams = 380 + (itemCost * 5);
    } else if (text.includes('shoe') || text.includes('boot') || text.includes('sneaker')) {
      weightInGrams = 750 + (itemCost * 5);
    } else if (text.includes('short')) {
      weightInGrams = 240 + (itemCost * 3);
    } else if (text.includes('cap') || text.includes('hat') || text.includes('beanie') || text.includes('belt') || text.includes('wallet') || text.includes('sock') || text.includes('bag')) {
      weightInGrams = 120 + (itemCost * 2);
    } else {
      weightInGrams = 200 + (itemCost * 4);
    }
  }

  const additionalGrams = Math.max(0, weightInGrams - 100);
  const serviceKey = String(serviceName || 'CJPacket Ordinary').toLowerCase();

  // 4. Explicit IF-ELSE Branching by CJ Logistics Service
  let baseFee = 4.20;
  let operationalFee = 0.80;
  let ratePer100g = 1.05;
  let minFee = 4.50;

  if (serviceKey.includes('fast') || serviceKey.includes('sensitive') || serviceKey.includes('express line')) {
    // Service: CJPacket Fast Line (Expedited Air 3-7 days)
    baseFee = 5.80;
    operationalFee = 1.20;
    ratePer100g = 1.45;
    minFee = 6.50;
  } else if (serviceKey.includes('usps') || serviceKey.includes('domestic') || serviceKey.includes('priority')) {
    // Service: USPS Direct / Domestic Warehouse (2-5 days)
    baseFee = 6.50;
    operationalFee = 1.50;
    ratePer100g = 1.60;
    minFee = 7.50;
  } else if (serviceKey.includes('dhl') || serviceKey.includes('fedex') || serviceKey.includes('ups')) {
    // Service: Commercial Courier Express (DHL / FedEx / UPS 2-4 days)
    baseFee = 18.00;
    operationalFee = 3.00;
    ratePer100g = 3.50;
    minFee = 19.99;
  } else {
    // Default Service: CJPacket Ordinary (China Warehouse -> United States, 4-9 / 7-15 days)
    baseFee = 4.20;
    operationalFee = 0.80;
    ratePer100g = 1.05;
    minFee = 4.50;
  }

  const variableFee = (additionalGrams / 100) * ratePer100g;
  const totalShippingUsd = Math.round((baseFee + operationalFee + variableFee) * 100) / 100;
  return Math.max(minFee, totalShippingUsd);
};

const freightCache = new Map();

/**
 * Fetch dynamic live freight/delivery price to USA directly from CJ Dropshipping API
 * Endpoint: POST /logistic/freightCalculate
 */
export const fetchDynamicCjFreight = async (params = {}) => {
  const { 
    startCountryCode = 'CN', 
    endCountryCode = 'US', 
    vid = null, 
    pid = null, 
    weight = 0 
  } = params;

  const cacheKey = `${vid || pid || 'wt'}_${Math.round(weight || 0)}_${startCountryCode}_${endCountryCode}`;
  if (freightCache.has(cacheKey)) {
    return freightCache.get(cacheKey);
  }

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return null;

    let calcWeight = weight;
    if (!calcWeight || calcWeight <= 30) {
      calcWeight = 250;
    }

    const payload = {
      startCountryCode,
      endCountryCode,
      products: [
        {
          quantity: 1,
          ...(vid ? { variantId: String(vid) } : {}),
          ...(pid ? { pid: String(pid) } : {}),
          weight: Math.round(calcWeight)
        }
      ]
    };

    const response = await cjFetch('/logistic/freightCalculate', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const isSuccess = data.result === true || data.code === 200 || String(data.message).toLowerCase() === 'success';

    if (isSuccess && Array.isArray(data.data) && data.data.length > 0) {
      // Find exact CJPacket Ordinary as specified on CJ listing
      const standardLine = data.data.find(opt => 
        opt.logisticName && opt.logisticName.toLowerCase().includes('cjpacket ordinary')
      ) || data.data.find(opt => 
        opt.logisticName && (
          opt.logisticName.toLowerCase().includes('cjpacket') ||
          opt.logisticName.toLowerCase().includes('usps') ||
          opt.logisticName.toLowerCase().includes('ordinary')
        )
      ) || data.data[0];

      const price = parseFloat(
        standardLine.logisticPrice || 
        standardLine.postage || 
        standardLine.shippingFee || 
        standardLine.freightPrice || 
        standardLine.price || 0
      );

      if (price > 0) {
        const result = {
          shippingFee: Math.round(price * 100) / 100,
          logisticName: standardLine.logisticName || 'CJPacket Ordinary',
          deliveryDays: standardLine.logisticAging || standardLine.deliveryDays || '7-15 days',
          isLiveDynamic: true
        };
        freightCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("[CJ Freight] Live freight calculation query skipped:", err.message);
  }

  return null;
};

/**
 * Transform a CJ Dropshipping product into Ryanz Clothes Firestore document format
 * Calculates total landed cost = (Product Supplier Cost + Dynamic/Estimated CJ USA Delivery) * markupMultiplier
 */
export const transformCjToFirestoreProduct = (cjProduct, options = {}) => {
  const {
    markupMultiplier = 2.2,
    overrideCategory = '',
    applySaleDiscount = false,
    discountPercent = 15,
    featured = false,
    isNewArrival = true,
    dynamicShippingFee = null,
    dynamicCarrier = null,
    shippingMethod = 'CJPacket Ordinary'
  } = options;

  const costPrice = parseFloat(cjProduct.sellPrice || cjProduct.variantSellPrice || 20) || 20;
  const usShippingCost = dynamicShippingFee && dynamicShippingFee > 0
    ? dynamicShippingFee
    : calculateCjUsShippingFee(cjProduct, shippingMethod);

  const totalLandedCost = Math.round((costPrice + usShippingCost) * 100) / 100;
  const retailPrice = Math.round((totalLandedCost * markupMultiplier) * 100) / 100;
  
  let discountPrice = null;
  if (applySaleDiscount && discountPercent > 0) {
    discountPrice = Math.round((retailPrice * (1 - discountPercent / 100)) * 100) / 100;
  }

  // 1. All Images — normalize every URL
  const rawAllImages = extractAllImages(cjProduct);
  const normalizedImages = rawAllImages.map(normalizeImageUrl);

  // 2. Color-First Scanner: Loop through each color to find available sizes, photos, and variant matrix
  const colorMap = new Map();
  let totalStock = 0;

  const cleanColorName = (val) => {
    if (!val || typeof val !== 'string') return '';
    let s = val.trim();
    s = s.replace(/<[^>]+>/g, '').replace(/^(color|colour|dimension|width|height|size)\s*[:=]\s*/i, '');
    if (/^(\d+|height|width|\d+cm|\d+px|=)/i.test(s) || /^\d+$/.test(s)) return '';
    return s.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
  };

  const cleanSizeName = (val) => {
    if (!val || typeof val !== 'string') return '';
    let s = val.trim().toUpperCase();
    s = s.replace(/<[^>]+>/g, '').replace(/^(size|dimension|width|height)\s*[:=]\s*/i, '');
    if (/^(height|width|=)/i.test(s)) return '';
    return s.trim();
  };

  if (Array.isArray(cjProduct.variants) && cjProduct.variants.length > 0) {
    cjProduct.variants.forEach((v, idx) => {
      let color = cleanColorName(v.variantColor || v.color || v.variantColorEn || '');
      let size = cleanSizeName(v.variantSize || v.size || '');

      // CRITICAL FIX: Prioritize variantKey (documented Color-Size string) over variantStandard (dimension text)
      const rawKey = v.variantKey || v.variantNameEn || v.variantProperty || v.variantName || v.variantStandard || '';
      
      // Robust Multi-Hyphen Variant Parser (handles "Dark-Blue-Vintage-Wash-M", "Rose-Red-Floral-Print-XL", "Navy-Blue-28")
      if ((!color || !size) && rawKey) {
        const parsed = parseVariantKey(rawKey);
        if (!size && parsed.size) size = cleanSizeName(parsed.size);
        if (!color && parsed.color) color = cleanColorName(parsed.color);
      }

      // If color is still missing, scan known colors in rawKey
      if (!color && rawKey) {
        const lowerRaw = rawKey.toLowerCase();
        for (const kc of KNOWN_COLORS) {
          if (lowerRaw.includes(kc)) {
            color = kc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }

      // If size is still missing, scan standard sizes or numbers in rawKey
      if (!size || !STANDARD_SIZES.has(size)) {
        const segments = rawKey.split(/[-_,\s:;]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
        for (const seg of segments) {
          if (STANDARD_SIZES.has(seg) || /^\d{2,3}$/.test(seg)) {
            size = seg;
            break;
          }
        }
      }

      color = color || 'Standard';
      size = size || 'M';

      const variantCost = parseFloat(v.variantSellPrice || v.sellPrice || costPrice) || costPrice;
      const variantShipping = dynamicShippingFee && dynamicShippingFee > 0
        ? dynamicShippingFee
        : calculateCjUsShippingFee({ ...cjProduct, ...v }, shippingMethod);
      const variantLanded = Math.round((variantCost + variantShipping) * 100) / 100;
      const variantRetail = Math.round((variantLanded * markupMultiplier) * 100) / 100;

      // CRITICAL FIX: Calculate stock by summing inventories[].totalInventory across warehouses
      let variantStock = 0;
      if (Array.isArray(v.inventories) && v.inventories.length > 0) {
        variantStock = v.inventories.reduce((acc, inv) => {
          return acc + (Number(inv.totalInventory || inv.inventory || inv.stock || 0) || 0);
        }, 0);
      }
      if (variantStock <= 0) {
        variantStock = parseInt(v.variantStock || v.stock || v.inventory || 50, 10);
      }
      totalStock += variantStock;

      const rawVarImg = v.variantImage || v.variantImg || v.image || '';
      const varImg = rawVarImg ? normalizeImageUrl(rawVarImg) : null;

      if (!colorMap.has(color)) {
        colorMap.set(color, {
          color: color,
          image: varImg || (normalizedImages[0] || null),
          sizes: new Set(),
          variants: []
        });
      }

      const colorEntry = colorMap.get(color);
      colorEntry.sizes.add(size);
      if (varImg && (!colorEntry.image || colorEntry.image === normalizedImages[0])) {
        colorEntry.image = varImg;
      }

      colorEntry.variants.push({
        id: `var_${idx + 1}`,
        vid: v.vid || v.variantId || v.id || null,
        variantId: v.vid || v.variantId || v.id || null,
        sku: v.variantSku || v.sku || `${cjProduct.productSku || 'CJ'}-${color.replace(/\s+/g, '')}-${size}`,
        variantSku: v.variantSku || v.sku || `${cjProduct.productSku || 'CJ'}-${color.replace(/\s+/g, '')}-${size}`,
        color: color,
        size: size,
        supplierPrice: variantCost,
        shippingPrice: variantShipping,
        landedCost: variantLanded,
        price: variantRetail,
        stock: variantStock,
        image: varImg || colorEntry.image || normalizedImages[0] || null
      });
    });
  }

  // 3. Fallback: If colorMap has no authentic colors, scan specifications in description
  if (colorMap.size === 0 || Array.from(colorMap.keys()).every(c => c === 'Standard' || c === 'Default')) {
    let descColors = [];
    if (typeof cjProduct.description === 'string' && cjProduct.description.trim()) {
      const colorMatch = cjProduct.description.match(/(?:Color|Colors|Colour|Colours)\s*:\s*([^;\n\.<]+)/i);
      if (colorMatch && colorMatch[1]) {
        descColors = colorMatch[1].split(/[,/、]+/).map(c => cleanColorName(c)).filter(Boolean);
      }
    }
    if (descColors.length === 0 && typeof cjProduct.productNameEn === 'string') {
      const titleLower = cjProduct.productNameEn.toLowerCase();
      for (const kc of KNOWN_COLORS) {
        if (titleLower.includes(kc)) {
          descColors.push(kc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        }
      }
    }
    if (descColors.length === 0) {
      descColors = Array.isArray(cjProduct.colors) && cjProduct.colors.length > 0
        ? cjProduct.colors.map(cleanColorName).filter(Boolean)
        : ['Black', 'White'];
    }

    let descSizes = [];
    if (typeof cjProduct.description === 'string' && cjProduct.description.trim()) {
      const sizeMatch = cjProduct.description.match(/(?:Sizes?|Size\s*Range)\s*:\s*([A-Za-z0-9\s,\/\-]+?)(?:Waist|Fabric|Style|Skirt|Length|Material|Note|\n|\.|\<|$)/i);
      if (sizeMatch && sizeMatch[1]) {
        descSizes = sizeMatch[1].split(/[,/、\s]+/).map(s => s.trim().toUpperCase()).filter(s => STANDARD_SIZES.has(s));
      }
    }
    if (descSizes.length === 0) {
      descSizes = Array.isArray(cjProduct.sizes) && cjProduct.sizes.length > 0
        ? cjProduct.sizes.map(cleanSizeName).filter(Boolean)
        : ['S', 'M', 'L', 'XL'];
    }

    colorMap.clear();
    descColors.forEach((col, cIdx) => {
      const colImg = normalizedImages[cIdx % normalizedImages.length] || normalizedImages[0] || null;
      const sizeSetForCol = new Set(descSizes);
      const varListForCol = descSizes.map((sz, sIdx) => ({
        id: `var_${cIdx * descSizes.length + sIdx + 1}`,
        sku: `${cjProduct.productSku || 'CJ'}-${col.replace(/\s+/g, '')}-${sz}`,
        color: col,
        size: sz,
        supplierPrice: costPrice,
        price: retailPrice,
        stock: 50,
        image: colImg
      }));

      colorMap.set(col, {
        color: col,
        image: colImg,
        sizes: sizeSetForCol,
        variants: varListForCol
      });
    });
  }

  // 4. Loop through colorMap to compile colors, sizes, variant matrix, and image gallery
  const finalColors = Array.from(colorMap.keys());
  const allSizesSet = new Set();
  const variantsList = [];
  const galleryImageSet = new Set(normalizedImages);

  colorMap.forEach((entry) => {
    if (entry.image) galleryImageSet.add(entry.image);
    entry.sizes.forEach(sz => allSizesSet.add(sz));
    entry.variants.forEach(v => {
      variantsList.push(v);
      if (v.image) galleryImageSet.add(v.image);
    });
  });

  const sizes = allSizesSet.size > 0 ? Array.from(allSizesSet) : ['S', 'M', 'L', 'XL'];
  const colors = finalColors.length > 0 ? finalColors : ['Black'];
  const images = galleryImageSet.size > 0 
    ? Array.from(galleryImageSet) 
    : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'];
  const stock = totalStock > 0 ? totalStock : (sizes.length * colors.length * 25);

  // Clean title
  let cleanTitle = (cjProduct.productNameEn || cjProduct.productName || 'Streetwear Apparel').trim();

  // Clean description: strip script/style tags and clean HTML into readable text
  let cleanDesc = cjProduct.description || '';
  if (typeof cleanDesc === 'string') {
    cleanDesc = cleanDesc
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  if (!cleanDesc) {
    cleanDesc = `${cleanTitle}. Imported directly from verified dropshipping apparel supplier. High-durability stitching, premium textile feel, and modern streetwear silhouette.`;
  } else if (cleanDesc.length > 2500) {
    cleanDesc = cleanDesc.substring(0, 2500);
  }

  return {
    name: cleanTitle,
    description: cleanDesc,
    price: retailPrice,
    discountPrice: discountPrice,
    category: overrideCategory || cjProduct.categoryName || 't-shirts',
    sizes: sizes,
    colors: colors,
    stock: stock,
    images: images,
    variants: variantsList,
    featured: Boolean(featured),
    isNewArrival: Boolean(isNewArrival),
    isActive: true,
    rating: cjProduct.supplierRating || 4.9,
    numReviews: Math.floor(Math.random() * 20) + 6,
    cjpId: cjProduct.pid || null,
    cjpSku: cjProduct.productSku || null,
    weight: cjProduct.productWeight || cjProduct.packingWeight || null,
    supplierCost: costPrice,
    shippingCostToUsa: usShippingCost,
    landedCost: totalLandedCost,
    targetMarket: "USA",
    shippingCarrier: "CJPacket Ordinary / USPS"
  };
};

/**
 * Import a single CJ product into Cloud Firestore
 * Fetches full details & all variants/images if not already loaded
 */
export const importCjProductToFirestore = async (cjProduct, options = {}) => {
  try {
    let fullProduct = { ...cjProduct };

    // If variants or high-res images are missing, attempt detail query
    if (cjProduct.pid && (!cjProduct.variants || cjProduct.variants.length === 0 || !cjProduct.productImageSet)) {
      const detailed = await fetchCjProductDetails(cjProduct.pid);
      if (detailed) {
        fullProduct = { ...fullProduct, ...detailed };
      }
    }

    // Dynamic live freight calculation from CJ Dropshipping API
    let dynamicShipping = null;
    try {
      const firstVid = fullProduct.variants?.[0]?.vid || fullProduct.variants?.[0]?.variantId || null;
      const weight = fullProduct.productWeight || fullProduct.weight || 250;
      dynamicShipping = await fetchDynamicCjFreight({
        startCountryCode: 'CN',
        endCountryCode: 'US',
        vid: firstVid,
        pid: fullProduct.pid,
        weight
      });
    } catch (fErr) {
      console.warn("[CJ Freight] Dynamic freight calculation skipped:", fErr);
    }

    const firestoreData = transformCjToFirestoreProduct(fullProduct, {
      ...options,
      dynamicShippingFee: dynamicShipping?.shippingFee || null,
      dynamicCarrier: dynamicShipping?.logisticName || null
    });

    const result = await addProduct(firestoreData);
    return result;
  } catch (error) {
    console.error("Error importing CJ product to Firestore:", error);
    throw error;
  }
};

/**
 * Batch import multiple CJ products into Cloud Firestore
 * Throttles requests by 1000ms to stay within CJ API rate limits
 */
export const importBatchCjProductsToFirestore = async (cjProductsList, options = {}, onProgress) => {
  const imported = [];
  const errors = [];

  for (let i = 0; i < cjProductsList.length; i++) {
    const item = cjProductsList[i];
    try {
      const doc = await importCjProductToFirestore(item, options);
      imported.push(doc);
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: cjProductsList.length,
          productName: item.productNameEn
        });
      }
      // Rate-limiting delay between sequential CJ requests
      if (i < cjProductsList.length - 1) {
        await sleep(1000);
      }
    } catch (err) {
      errors.push({ pid: item.pid, error: err.message });
    }
  }

  return {
    total: cjProductsList.length,
    successCount: imported.length,
    imported,
    errors
  };
};

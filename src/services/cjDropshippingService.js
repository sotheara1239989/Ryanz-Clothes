import { addProduct } from './productService';

const CJ_STORAGE_KEY = 'ryanz_cj_credentials';
const CJ_API_BASE = typeof window !== 'undefined' && window.location?.origin
  ? '/cj-api'
  : 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Helper to throttle sequential requests to respect CJ's rate limits
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Retrieve stored CJ Dropshipping credentials from localStorage or .env
 */
export const getCjCredentials = () => {
  try {
    const saved = localStorage.getItem(CJ_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Could not read CJ credentials from storage:", e);
  }

  return {
    apiKey: import.meta.env.VITE_CJ_API_KEY || '',
    accessToken: import.meta.env.VITE_CJ_ACCESS_TOKEN || '',
    accessTokenExpiryDate: '',
    refreshToken: import.meta.env.VITE_CJ_REFRESH_TOKEN || '',
    refreshTokenExpiryDate: '',
    email: import.meta.env.VITE_CJ_EMAIL || ''
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
 * Obtain an access token from CJ Dropshipping API
 */
export const fetchCjAccessToken = async (apiKey) => {
  if (!apiKey) throw new Error("API Key is required to fetch CJ access token.");

  try {
    const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
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
 * Refresh expired access token using refreshToken
 */
export const refreshCjAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token is required.");

  try {
    const response = await fetch(`${CJ_API_BASE}/authentication/refreshAccessToken`, {
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
 * Check if token needs refresh and get valid access token
 */
export const getValidAccessToken = async () => {
  let { apiKey, accessToken, accessTokenExpiryDate, refreshToken } = getCjCredentials();

  // Check if token is expired
  if (accessToken && accessTokenExpiryDate) {
    const expiry = new Date(accessTokenExpiryDate).getTime();
    if (!isNaN(expiry) && Date.now() > expiry - 60000) {
      if (refreshToken) {
        try {
          const refreshed = await refreshCjAccessToken(refreshToken);
          return refreshed.accessToken;
        } catch {
          // Fall through
        }
      }
      accessToken = '';
    }
  }

  if (!accessToken && apiKey) {
    try {
      const authRes = await fetchCjAccessToken(apiKey);
      return authRes.accessToken;
    } catch {
      return null;
    }
  }

  return accessToken || null;
};

/**
 * Search CJ Dropshipping products via live API
 * Handles real /product/listV2 response shapes:
 * - data.data.content[0].productList
 * - data.data.list
 * - data.data array
 */
export const searchCjProducts = async (params = {}) => {
  const { keyword = '', page = 1, size = 20, categoryId = '' } = params;

  if (!keyword.trim() && !categoryId) {
    return { source: 'empty', total: 0, products: [] };
  }

  const accessToken = await getValidAccessToken();

  if (accessToken) {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
        features: 'enable_description,enable_category',
        ...(keyword ? { keyWord: keyword.trim() } : {}),
        ...(categoryId ? { categoryId } : {})
      });

      const response = await fetch(`${CJ_API_BASE}/product/listV2?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const isSuccess = data.result === true || data.code === 200 || String(data.message).toLowerCase() === 'success';

      if (isSuccess && data.data) {
        let rawList = [];
        let totalCount = 0;

        // 1. Live API shape: data.content[0].productList
        if (Array.isArray(data.data?.content) && data.data.content[0]?.productList) {
          rawList = data.data.content[0].productList;
          totalCount = data.data.content[0].totalRecords || data.data.content[0].total || rawList.length;
        } else if (Array.isArray(data.data?.content?.[0])) {
          rawList = data.data.content[0];
          totalCount = rawList.length;
        } else if (Array.isArray(data.data?.list)) {
          // 2. Legacy / alternate flat list
          rawList = data.data.list;
          totalCount = data.data.total || rawList.length;
        } else if (Array.isArray(data.data)) {
          rawList = data.data;
          totalCount = rawList.length;
        }

        const mappedProducts = rawList.map(p => {
          const pid = p.id || p.pid || p.productId || '';
          const name = p.nameEn || p.productNameEn || p.productName || p.name || 'Streetwear Apparel';
          const sku = p.sku || p.spu || p.productSku || '';
          const img = p.bigImage || p.productImage || p.image || '';
          const imgSet = Array.isArray(p.productImageSet) ? p.productImageSet : (p.imageSet || [img]);
          const price = String(p.sellPrice || p.variantSellPrice || p.price || '20.00');
          const cat = p.categoryName || p.category || 'Streetwear';
          const desc = p.description || p.productDescription || '';
          const variants = Array.isArray(p.variants) ? p.variants : [];

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
            supplierRating: 4.9,
            warehouseLocation: "Verified CJ Warehouse"
          };
        });

        return {
          source: 'api',
          total: totalCount || mappedProducts.length,
          products: mappedProducts
        };
      } else {
        if (data.message && String(data.message).toLowerCase() !== 'success') {
          throw new Error(data.message);
        }
        return { source: 'api', total: 0, products: [] };
      }
    } catch (apiErr) {
      console.error("CJ API request failed:", apiErr);
      throw apiErr;
    }
  }

  return {
    source: 'no_auth',
    total: 0,
    products: []
  };
};

/**
 * Fetch detailed product info dynamically from CJ API by PID or SKU
 * Depth guard prevents infinite recursive lookups
 */
export const fetchCjProductDetails = async (identifier, depth = 0) => {
  if (!identifier || depth > 1) return null;
  const id = identifier.trim();

  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  // 1. Try querying by productSku (e.g. CJLS...)
  try {
    const resSku = await fetch(`${CJ_API_BASE}/product/query?productSku=${encodeURIComponent(id)}`, {
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
    const response = await fetch(`${CJ_API_BASE}/product/query?pid=${encodeURIComponent(id)}`, {
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
 * Transform a CJ Dropshipping product into Ryanz Clothes Firestore document format
 * Uses variantKey-first parsing, hyphen splitting, warehouse inventory summation, and color grouping
 */
export const transformCjToFirestoreProduct = (cjProduct, options = {}) => {
  const {
    markupMultiplier = 2.2,
    overrideCategory = '',
    applySaleDiscount = false,
    discountPercent = 15,
    featured = false,
    isNewArrival = true
  } = options;

  const costPrice = parseFloat(cjProduct.sellPrice || cjProduct.variantSellPrice || 20) || 20;
  const retailPrice = Math.round((costPrice * markupMultiplier) * 100) / 100;
  
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
      
      // Hyphen-splitting on variantKey (e.g. "Black-XXL", "Navy Blue-S", "Rose Red-28")
      if ((!color || !size) && rawKey.includes('-')) {
        const lastHyphen = rawKey.lastIndexOf('-');
        const left = rawKey.substring(0, lastHyphen).trim();
        const right = rawKey.substring(lastHyphen + 1).trim();

        if (STANDARD_SIZES.has(right.toUpperCase()) || /^\d+$/.test(right) || /one size/i.test(right)) {
          if (!size) size = cleanSizeName(right);
          if (!color) color = cleanColorName(left);
        } else if (STANDARD_SIZES.has(left.toUpperCase()) || /^\d+$/.test(left)) {
          if (!size) size = cleanSizeName(left);
          if (!color) color = cleanColorName(right);
        } else {
          if (!color) color = cleanColorName(left);
          if (!size) size = cleanSizeName(right);
        }
      }

      // If color is still missing, scan known colors in rawKey
      if (!color) {
        const lowerRaw = rawKey.toLowerCase();
        for (const kc of KNOWN_COLORS) {
          if (lowerRaw.includes(kc)) {
            color = kc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }

      // If size is still missing, scan standard sizes in rawKey
      if (!size || !STANDARD_SIZES.has(size)) {
        const segments = rawKey.split(/[-_,\s:;]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
        for (const seg of segments) {
          if (STANDARD_SIZES.has(seg)) {
            size = seg;
            break;
          }
        }
      }

      color = color || 'Standard';
      size = size || 'M';

      const variantCost = parseFloat(v.variantSellPrice || v.sellPrice || costPrice) || costPrice;
      const variantRetail = Math.round((variantCost * markupMultiplier) * 100) / 100;

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
    supplierCost: costPrice
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

    const firestoreData = transformCjToFirestoreProduct(fullProduct, options);
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

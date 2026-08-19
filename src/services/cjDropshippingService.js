import { addProduct } from './productService';

const CJ_STORAGE_KEY = 'ryanz_cj_credentials';
const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

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
    if (data.result && data.data?.accessToken) {
      const creds = {
        apiKey,
        accessToken: data.data.accessToken,
        accessTokenExpiryDate: data.data.accessTokenExpiryDate
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
 * Search CJ Dropshipping products via live API
 */
export const searchCjProducts = async (params = {}) => {
  const { keyword = '', page = 1, size = 20, categoryId = '' } = params;
  const { accessToken } = getCjCredentials();

  if (!keyword.trim() && !categoryId) {
    return { source: 'empty', total: 0, products: [] };
  }

  if (accessToken) {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
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
      if (data.result && Array.isArray(data.data?.list)) {
        return {
          source: 'api',
          total: data.data.total || data.data.list.length,
          products: data.data.list.map(p => ({
            pid: p.pid,
            productNameEn: p.productNameEn || p.productName,
            productSku: p.productSku,
            productImage: p.productImage,
            productImageSet: Array.isArray(p.productImageSet) ? p.productImageSet : [p.productImage],
            sellPrice: String(p.sellPrice || p.variantSellPrice || '20.00'),
            categoryName: p.categoryName || 'Streetwear',
            description: p.description || '',
            variants: Array.isArray(p.variants) ? p.variants : [],
            supplierRating: 4.9,
            warehouseLocation: "Verified CJ Warehouse"
          }))
        };
      } else {
        throw new Error(data.message || "No products returned from CJ API");
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
 * Fetch detailed product info from CJ API by PID
 */
export const fetchCjProductDetails = async (pid) => {
  const { accessToken } = getCjCredentials();
  if (!accessToken || !pid) return null;

  try {
    const response = await fetch(`${CJ_API_BASE}/product/query?pid=${pid}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.result && data.data) {
      return data.data;
    }
  } catch (err) {
    console.warn(`Could not fetch extra details for CJ product ${pid}:`, err);
  }
  return null;
};

/**
 * Extract all image URLs from product, variants, and description HTML
 */
const extractAllImages = (cjProduct) => {
  const imageSet = new Set();

  const addValidImg = (url) => {
    if (typeof url === 'string' && url.trim().startsWith('http')) {
      imageSet.add(url.trim());
    }
  };

  // 1. Main image
  addValidImg(cjProduct.productImage);
  addValidImg(cjProduct.bigImage);
  addValidImg(cjProduct.smallImage);

  // 2. Gallery images array or string
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

  // 3. Variant images
  if (Array.isArray(cjProduct.variants)) {
    cjProduct.variants.forEach(v => {
      addValidImg(v.variantImage);
      addValidImg(v.variantImg);
      addValidImg(v.image);
      addValidImg(v.imgUrl);
    });
  }

  // 4. Embedded images in description HTML
  if (typeof cjProduct.description === 'string' && cjProduct.description.includes('<img')) {
    const regex = /<img[^>]+src=["'](https?:\/\/[^"'>]+)["']/gi;
    let match;
    while ((match = regex.exec(cjProduct.description)) !== null) {
      addValidImg(match[1]);
    }
  }

  return Array.from(imageSet);
};

/**
 * Transform a CJ Dropshipping product into Ryanz Clothes Firestore document format
 * Captures all images, full variant matrix (sizes, colors, SKUs, individual stock), supplier costs, and markup
 */
export const transformCjToFirestoreProduct = (cjProduct, options = {}) => {
  const {
    markupMultiplier = 2.2, // e.g. $20 cost * 2.2 = $44 retail
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

  // 1. All Images
  const allImages = extractAllImages(cjProduct);
  const images = allImages.length > 0 ? allImages : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'];

  // 2. Comprehensive Variant Matrix
  const sizeSet = new Set();
  const colorSet = new Set();
  const variantsList = [];
  let totalStock = 0;

  if (Array.isArray(cjProduct.variants) && cjProduct.variants.length > 0) {
    cjProduct.variants.forEach((v, idx) => {
      let size = v.variantSize || v.size || '';
      let color = v.variantColor || v.color || v.variantColorEn || '';

      // If size and color aren't explicitly split, parse from variantName or variantKey
      if (!size && !color && (v.variantNameEn || v.variantKey)) {
        const namePart = (v.variantNameEn || v.variantKey).split('-');
        if (namePart.length >= 2) {
          color = namePart[0].trim();
          size = namePart[1].trim();
        } else if (namePart.length === 1) {
          size = namePart[0].trim();
        }
      }

      if (size) sizeSet.add(size);
      if (color) colorSet.add(color);

      const variantCost = parseFloat(v.variantSellPrice || v.sellPrice || costPrice) || costPrice;
      const variantRetail = Math.round((variantCost * markupMultiplier) * 100) / 100;
      const variantStock = parseInt(v.variantStock || v.stock || 50, 10);
      totalStock += variantStock;

      variantsList.push({
        id: `var_${idx + 1}`,
        sku: v.variantSku || v.sku || `${cjProduct.productSku || 'CJ'}-${idx + 1}`,
        size: size || 'One Size',
        color: color || 'Default',
        supplierPrice: variantCost,
        price: variantRetail,
        stock: variantStock,
        image: v.variantImage || v.variantImg || v.image || images[0]
      });
    });
  }

  // Fallbacks if no variant objects found
  const sizes = sizeSet.size > 0 ? Array.from(sizeSet) : ['S', 'M', 'L', 'XL'];
  const colors = colorSet.size > 0 ? Array.from(colorSet) : ['Black'];
  const stock = totalStock > 0 ? totalStock : 100;

  // Clean description HTML tags if messy or preserve formatted text
  let cleanDesc = cjProduct.description || '';
  if (cleanDesc.length > 2000) {
    cleanDesc = cleanDesc.substring(0, 2000);
  }

  return {
    name: cjProduct.productNameEn || cjProduct.productName || 'CJ Dropshipping Apparel',
    description: cleanDesc || `${cjProduct.productNameEn}. Imported directly from dropshipping supplier with verified garment quality.`,
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

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
 * Transform a CJ Dropshipping product into Ryanz Clothes Firestore document format
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

  const costPrice = parseFloat(cjProduct.sellPrice) || 20;
  const retailPrice = Math.round((costPrice * markupMultiplier) * 100) / 100;
  
  let discountPrice = null;
  if (applySaleDiscount && discountPercent > 0) {
    discountPrice = Math.round((retailPrice * (1 - discountPercent / 100)) * 100) / 100;
  }

  // Extract unique sizes from CJ variants
  const sizeSet = new Set();
  const colorSet = new Set();
  let totalStock = 0;

  if (Array.isArray(cjProduct.variants) && cjProduct.variants.length > 0) {
    cjProduct.variants.forEach(v => {
      if (v.variantSize) sizeSet.add(v.variantSize);
      if (v.variantColor) colorSet.add(v.variantColor);
      if (v.variantStock) totalStock += Number(v.variantStock);
    });
  }

  const sizes = sizeSet.size > 0 ? Array.from(sizeSet) : ['S', 'M', 'L', 'XL'];
  const colors = colorSet.size > 0 ? Array.from(colorSet) : ['Black', 'Washed Black'];
  const stock = totalStock > 0 ? Math.min(totalStock, 150) : 50;

  const images = [];
  if (cjProduct.productImage) images.push(cjProduct.productImage);
  if (Array.isArray(cjProduct.productImageSet)) {
    cjProduct.productImageSet.forEach(img => {
      if (img && !images.includes(img)) images.push(img);
    });
  }

  return {
    name: cjProduct.productNameEn || 'CJ Dropshipping Apparel',
    description: cjProduct.description || `${cjProduct.productNameEn}. Imported directly from dropshipping supplier with verified garment quality.`,
    price: retailPrice,
    discountPrice: discountPrice,
    category: overrideCategory || cjProduct.categoryName || 't-shirts',
    sizes: sizes,
    colors: colors,
    stock: stock,
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
    featured: Boolean(featured),
    isNewArrival: Boolean(isNewArrival),
    isActive: true,
    rating: cjProduct.supplierRating || 4.9,
    numReviews: Math.floor(Math.random() * 18) + 5,
    cjpId: cjProduct.pid || null,
    supplierCost: costPrice
  };
};

/**
 * Import a single CJ product into Cloud Firestore
 */
export const importCjProductToFirestore = async (cjProduct, options = {}) => {
  try {
    const firestoreData = transformCjToFirestoreProduct(cjProduct, options);
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

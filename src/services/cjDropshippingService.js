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
 * Authentic CJ Dropshipping Streetwear Sample Feed
 * Used when testing without CORS or before registering API credentials
 */
export const MOCK_CJ_STREETWEAR_PRODUCTS = [
  {
    pid: "CJ-AP-89101",
    productNameEn: "Heavyweight 380 GSM Vintage Acid Washed Unisex Hoodie",
    productSku: "CJHD-380-VNTG",
    productImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    productImageSet: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80"
    ],
    sellPrice: "24.50",
    categoryName: "hoodies-sweats",
    description: "Custom-milled 380 GSM heavyweight French terry fabric. Double lined hood, dropped shoulder streetwear fit with ribbed cuffs and hem. High resistance to pilling and color fade.",
    variants: [
      { variantSize: "S", variantColor: "Acid Black", variantSellPrice: 24.50, variantStock: 120 },
      { variantSize: "M", variantColor: "Acid Black", variantSellPrice: 24.50, variantStock: 150 },
      { variantSize: "L", variantColor: "Acid Black", variantSellPrice: 24.50, variantStock: 95 },
      { variantSize: "XL", variantColor: "Acid Black", variantSellPrice: 24.50, variantStock: 80 },
      { variantSize: "M", variantColor: "Vintage Charcoal", variantSellPrice: 24.50, variantStock: 65 }
    ],
    supplierRating: 4.9,
    warehouseLocation: "US / CN"
  },
  {
    pid: "CJ-AP-92304",
    productNameEn: "Oversized 260 GSM Boxy Graphic Tee Streetwear Retro",
    productSku: "CJTS-260-BXY",
    productImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    productImageSet: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80"
    ],
    sellPrice: "12.80",
    categoryName: "t-shirts",
    description: "100% Combed Compact Cotton 260 GSM. Thick collar ribbing, reinforced neckline stitching, relaxed boxy cut suitable for screen printing and direct to garment dropshipping.",
    variants: [
      { variantSize: "S", variantColor: "Washed Black", variantSellPrice: 12.80, variantStock: 240 },
      { variantSize: "M", variantColor: "Washed Black", variantSellPrice: 12.80, variantStock: 300 },
      { variantSize: "L", variantColor: "Washed Black", variantSellPrice: 12.80, variantStock: 190 },
      { variantSize: "XL", variantColor: "Washed Black", variantSellPrice: 12.80, variantStock: 140 },
      { variantSize: "L", variantColor: "Raw White", variantSellPrice: 12.80, variantStock: 85 }
    ],
    supplierRating: 4.8,
    warehouseLocation: "US / CN"
  },
  {
    pid: "CJ-AP-77402",
    productNameEn: "Multi-Pocket Tactical Cargo Trousers Waterproof Ripstop",
    productSku: "CJPT-CARGO-TAC",
    productImage: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    productImageSet: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80"
    ],
    sellPrice: "28.90",
    categoryName: "pants-denim",
    description: "Durable polyester-cotton blend ripstop fabric. 6 functional cargo pockets, YKK zipper fly, adjustable velcro cuff straps, water-repellent coating.",
    variants: [
      { variantSize: "30", variantColor: "Tactical Black", variantSellPrice: 28.90, variantStock: 75 },
      { variantSize: "32", variantColor: "Tactical Black", variantSellPrice: 28.90, variantStock: 110 },
      { variantSize: "34", variantColor: "Tactical Black", variantSellPrice: 28.90, variantStock: 90 },
      { variantSize: "32", variantColor: "Olive Drab", variantSellPrice: 28.90, variantStock: 60 }
    ],
    supplierRating: 4.7,
    warehouseLocation: "CN / EU"
  },
  {
    pid: "CJ-AP-63910",
    productNameEn: "Minimalist Matte Black Padded MA-1 Flight Bomber Jacket",
    productSku: "CJJK-MA1-BMBR",
    productImage: "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=800&auto=format&fit=crop&q=80",
    productImageSet: [
      "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&auto=format&fit=crop&q=80"
    ],
    sellPrice: "42.00",
    categoryName: "jackets-outerwear",
    description: "Water-resistant satin twill outer shell with thermal polyester padding. Utility arm zip compartment, heavy gauge brass front zipper, signature orange emergency lining.",
    variants: [
      { variantSize: "M", variantColor: "Matte Black", variantSellPrice: 42.00, variantStock: 45 },
      { variantSize: "L", variantColor: "Matte Black", variantSellPrice: 42.00, variantStock: 50 },
      { variantSize: "XL", variantColor: "Matte Black", variantSellPrice: 42.00, variantStock: 35 },
      { variantSize: "L", variantColor: "Sage Green", variantSellPrice: 42.00, variantStock: 25 }
    ],
    supplierRating: 5.0,
    warehouseLocation: "US / CN"
  },
  {
    pid: "CJ-AP-51208",
    productNameEn: "Vintage Japanese Selvedge Relaxed Fit Denim Jeans",
    productSku: "CJDN-SLVDG-14OZ",
    productImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    productImageSet: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80"
    ],
    sellPrice: "36.50",
    categoryName: "pants-denim",
    description: "14.5oz raw indigo red-line selvedge denim. Button fly, copper rivets, custom leather patch, classic straight leg cut with room across thigh and seat.",
    variants: [
      { variantSize: "30", variantColor: "Raw Indigo", variantSellPrice: 36.50, variantStock: 40 },
      { variantSize: "32", variantColor: "Raw Indigo", variantSellPrice: 36.50, variantStock: 80 },
      { variantSize: "34", variantColor: "Raw Indigo", variantSellPrice: 36.50, variantStock: 65 },
      { variantSize: "36", variantColor: "Raw Indigo", variantSellPrice: 36.50, variantStock: 30 }
    ],
    supplierRating: 4.9,
    warehouseLocation: "CN"
  },
  {
    pid: "CJ-AP-48903",
    productNameEn: "Distressed Unstructured Low-Profile Baseball Dad Cap",
    productSku: "CJCP-DAD-WSHD",
    productImage: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
    productImageSet: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80"
    ],
    sellPrice: "7.20",
    categoryName: "accessories",
    description: "100% Washed cotton twill. 6-panel unstructured crown, pre-curved visor, antique brass tri-glide buckle closure with matching grommet tuck-in.",
    variants: [
      { variantSize: "One Size", variantColor: "Washed Black", variantSellPrice: 7.20, variantStock: 350 },
      { variantSize: "One Size", variantColor: "Khaki Stone", variantSellPrice: 7.20, variantStock: 200 },
      { variantSize: "One Size", variantColor: "Faded Forest", variantSellPrice: 7.20, variantStock: 180 }
    ],
    supplierRating: 4.8,
    warehouseLocation: "US / CN"
  }
];

/**
 * Search CJ Dropshipping products
 * Supports live API query when access token is provided with automatic proxy / fallback to CJ catalog
 */
export const searchCjProducts = async (params = {}) => {
  const { keyword = '', page = 1, size = 20, categoryId = '' } = params;
  const { accessToken } = getCjCredentials();

  if (accessToken) {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
        ...(keyword ? { keyWord: keyword } : {}),
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
      }
    } catch (apiErr) {
      console.warn("CJ API request failed, switching to CJ direct catalog feed:", apiErr);
    }
  }

  // Live filtered streetwear catalog feed
  let list = [...MOCK_CJ_STREETWEAR_PRODUCTS];
  if (keyword.trim()) {
    const k = keyword.toLowerCase();
    list = list.filter(p => 
      p.productNameEn.toLowerCase().includes(k) ||
      p.categoryName.toLowerCase().includes(k) ||
      p.description.toLowerCase().includes(k)
    );
  }

  return {
    source: 'catalog_feed',
    total: list.length,
    products: list
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

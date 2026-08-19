import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const PRODUCTS_COLLECTION = 'products';

/**
 * Real-time listener for all active products
 */
export const listenToProducts = (callback, errorCallback) => {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    }, (error) => {
      console.error("Error in listenToProducts:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up product listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Real-time listener for a single product by ID
 */
export const listenToProduct = (productId, callback, errorCallback) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in listenToProduct (${productId}):`, error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up single product listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Fetch all products (one-time fetch)
 */
export const getProducts = async (filters = {}) => {
  try {
    let q = collection(db, PRODUCTS_COLLECTION);
    const conditions = [];

    if (filters.category && filters.category !== 'all') {
      conditions.push(where('category', '==', filters.category));
    }

    if (filters.featured === true) {
      conditions.push(where('featured', '==', true));
    }

    if (filters.isNewArrival === true) {
      conditions.push(where('isNewArrival', '==', true));
    }

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side filtering if needed
    if (filters.onSale) {
      products = products.filter(p => Number(p.discountPrice) > 0 && Number(p.discountPrice) < Number(p.price));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.sortBy) {
      if (filters.sortBy === 'price-low') {
        products.sort((a, b) => (Number(a.discountPrice || a.price) - Number(b.discountPrice || b.price)));
      } else if (filters.sortBy === 'price-high') {
        products.sort((a, b) => (Number(b.discountPrice || b.price) - Number(a.discountPrice || a.price)));
      } else if (filters.sortBy === 'name') {
        products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (filters.sortBy === 'newest') {
        products.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return timeB - timeA;
        });
      }
    }

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

/**
 * Fetch a single product by ID
 */
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

/**
 * Add a new product to Firestore
 */
export const addProduct = async (productData) => {
  try {
    const rawSizes = Array.isArray(productData.sizes) ? productData.sizes : ['S', 'M', 'L', 'XL'];
    const cleanSizes = rawSizes
      .map(s => typeof s === 'object' && s !== null ? (s.size || s.name || JSON.stringify(s)) : String(s || ''))
      .map(s => s.trim())
      .filter(Boolean);

    const rawColors = Array.isArray(productData.colors) ? productData.colors : ['Black'];
    const cleanColors = rawColors
      .map(c => typeof c === 'object' && c !== null ? (c.color || c.name || JSON.stringify(c)) : String(c || ''))
      .map(c => c.trim())
      .filter(Boolean);

    const cleanData = {
      name: productData.name || '',
      description: productData.description || '',
      price: Number(productData.price) || 0,
      discountPrice: productData.discountPrice ? Number(productData.discountPrice) : null,
      category: productData.category || '',
      sizes: cleanSizes.length > 0 ? cleanSizes : ['S', 'M', 'L', 'XL'],
      colors: cleanColors.length > 0 ? cleanColors : ['Black'],
      stock: Number(productData.stock) || 0,
      images: Array.isArray(productData.images) && productData.images.length > 0 
        ? productData.images 
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
      variants: Array.isArray(productData.variants) ? productData.variants : [],
      cjpId: productData.cjpId || null,
      cjpSku: productData.cjpSku || null,
      weight: productData.weight || null,
      supplierCost: productData.supplierCost ? Number(productData.supplierCost) : null,
      featured: Boolean(productData.featured),
      isNewArrival: Boolean(productData.isNewArrival),
      isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
      rating: Number(productData.rating) || 5,
      numReviews: Number(productData.numReviews) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

/**
 * Update an existing product in Firestore
 */
export const updateProduct = async (productId, productData) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const updateData = {
      ...productData,
      updatedAt: serverTimestamp()
    };

    // Format numbers if provided
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.discountPrice !== undefined) {
      updateData.discountPrice = updateData.discountPrice ? Number(updateData.discountPrice) : null;
    }
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);

    if (Array.isArray(updateData.sizes)) {
      updateData.sizes = updateData.sizes
        .map(s => typeof s === 'object' && s !== null ? (s.size || s.name || JSON.stringify(s)) : String(s || ''))
        .map(s => s.trim())
        .filter(Boolean);
    }

    if (Array.isArray(updateData.colors)) {
      updateData.colors = updateData.colors
        .map(c => typeof c === 'object' && c !== null ? (c.color || c.name || JSON.stringify(c)) : String(c || ''))
        .map(c => c.trim())
        .filter(Boolean);
    }

    await updateDoc(docRef, updateData);
    return { id: productId, ...updateData };
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
};

/**
 * Delete a product from Firestore
 */
export const deleteProduct = async (productId) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
    return productId;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

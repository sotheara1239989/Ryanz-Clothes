import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const CATEGORIES_COLLECTION = 'categories';

/**
 * Real-time listener for categories
 */
export const listenToCategories = (callback, errorCallback) => {
  try {
    const q = query(collection(db, CATEGORIES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(categories);
    }, (error) => {
      console.error("Error in listenToCategories:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up categories listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Get all categories (one-time fetch)
 */
export const getCategories = async () => {
  try {
    const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

/**
 * Add a new category
 */
export const addCategory = async (categoryData) => {
  try {
    const slug = (categoryData.slug || categoryData.name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const cleanData = {
      name: categoryData.name || '',
      slug: slug,
      description: categoryData.description || '',
      image: categoryData.image || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
      isActive: categoryData.isActive !== undefined ? Boolean(categoryData.isActive) : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

/**
 * Update a category
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    let slug = categoryData.slug;
    if (categoryData.name && !slug) {
      slug = categoryData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updateData = {
      ...categoryData,
      ...(slug ? { slug } : {}),
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    return { id: categoryId, ...updateData };
  } catch (error) {
    console.error(`Error updating category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (categoryId) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);
    return categoryId;
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    throw error;
  }
};

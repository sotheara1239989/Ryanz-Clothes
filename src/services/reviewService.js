import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateProduct } from './productService';

const REVIEWS_COLLECTION = 'reviews';

/**
 * Real-time listener for reviews of a specific product
 */
export const listenToProductReviews = (productId, callback, errorCallback) => {
  if (!productId) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId)
    );
    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      reviews.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      callback(reviews);
    }, (error) => {
      console.error(`Error in listenToProductReviews (${productId}):`, error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up product reviews listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Real-time listener for all reviews (Admin moderation)
 */
export const listenToAllReviews = (callback, errorCallback) => {
  try {
    const q = collection(db, REVIEWS_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      reviews.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      callback(reviews);
    }, (error) => {
      console.error("Error in listenToAllReviews:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up all reviews listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Submit a customer review
 */
export const addReview = async (reviewData) => {
  try {
    const cleanReview = {
      productId: reviewData.productId,
      productName: reviewData.productName || 'Product',
      userId: reviewData.userId || 'guest',
      userName: reviewData.userName || 'Anonymous Shopper',
      userEmail: reviewData.userEmail || '',
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), cleanReview);

    // Calculate new average rating for the product
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where('productId', '==', reviewData.productId)
      );
      const snapshot = await getDocs(q);
      const allReviews = snapshot.docs.map(d => d.data());
      const totalRating = allReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
      const avgRating = Number((totalRating / (allReviews.length || 1)).toFixed(1));
      
      await updateProduct(reviewData.productId, {
        rating: avgRating,
        numReviews: allReviews.length
      });
    } catch (calcErr) {
      console.warn("Could not update product rating summary:", calcErr);
    }

    return { id: docRef.id, ...cleanReview };
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

/**
 * Delete / moderate a review (Admin)
 */
export const deleteReview = async (reviewId) => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await deleteDoc(docRef);
    return reviewId;
  } catch (error) {
    console.error(`Error deleting review (${reviewId}):`, error);
    throw error;
  }
};

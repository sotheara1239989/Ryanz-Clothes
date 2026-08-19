import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const USERS_COLLECTION = 'users';

/**
 * Get user profile by UID
 */
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user profile (${userId}):`, error);
    throw error;
  }
};

/**
 * Create or sync user profile on login/registration
 */
export const syncUserProfile = async (user, additionalData = {}) => {
  if (!user || !user.uid) return null;
  try {
    const docRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    const providerId = user.providerData && user.providerData[0] 
      ? user.providerData[0].providerId 
      : (additionalData.authProvider || 'password');

    if (!docSnap.exists()) {
      // New user registration (via regular email or Google)
      const userData = {
        name: additionalData.name || user.displayName || user.email?.split('@')[0] || 'Ryanz Customer',
        email: user.email || '',
        photoURL: user.photoURL || '',
        phone: additionalData.phone || user.phoneNumber || '',
        role: additionalData.role || 'customer', // 'customer' | 'admin'
        authProvider: providerId,
        shippingAddress: additionalData.shippingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      await setDoc(docRef, userData);
      return { id: user.uid, ...userData };
    } else {
      // Existing user: preserve role, update login timestamp & merge updated profile fields
      const existingData = docSnap.data();
      const updatedFields = {
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        ...(user.photoURL && !existingData.photoURL ? { photoURL: user.photoURL } : {}),
        ...(user.displayName && !existingData.name ? { name: user.displayName } : {}),
        ...(additionalData.name ? { name: additionalData.name } : {}),
        ...(additionalData.phone ? { phone: additionalData.phone } : {}),
        ...(additionalData.shippingAddress ? { shippingAddress: additionalData.shippingAddress } : {})
      };
      await updateDoc(docRef, updatedFields);
      return { id: user.uid, ...existingData, ...updatedFields };
    }
  } catch (error) {
    console.error("Error syncing user profile:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, data) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
    return { id: userId, ...updateData };
  } catch (error) {
    console.error(`Error updating user profile (${userId}):`, error);
    throw error;
  }
};

/**
 * Real-time listener for all users (Admin)
 */
export const listenToUsers = (callback, errorCallback) => {
  try {
    const q = collection(db, USERS_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      users.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      callback(users);
    }, (error) => {
      console.error("Error in listenToUsers:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up users listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Change user role (Admin)
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    return { id: userId, role: newRole };
  } catch (error) {
    console.error(`Error updating user role (${userId}):`, error);
    throw error;
  }
};

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  query,
  where,
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

/**
 * Automatically save / sync customer record in Firestore users collection when an order is placed
 */
export const saveCustomerFromOrder = async ({ email, name, phone, shippingAddress, userId, totalAmount = 0 }) => {
  if (!email && (!userId || userId === 'guest')) return null;
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    let targetDocRef = null;
    let existingData = null;

    // Check if user document already exists by UID
    if (userId && userId !== 'guest') {
      targetDocRef = doc(db, USERS_COLLECTION, userId);
      const snap = await getDoc(targetDocRef);
      if (snap.exists()) {
        existingData = snap.data();
      }
    }

    // Check if user document exists by email
    if (!existingData && cleanEmail) {
      const q = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        targetDocRef = doc(db, USERS_COLLECTION, firstDoc.id);
        existingData = firstDoc.data();
      }
    }

    // If no existing document, create new document reference
    if (!targetDocRef) {
      targetDocRef = doc(collection(db, USERS_COLLECTION));
    }

    if (!existingData) {
      // Create new customer record in Firestore users collection
      const customerRecord = {
        name: name || (cleanEmail ? cleanEmail.split('@')[0] : 'Ryanz Customer'),
        email: cleanEmail,
        phone: phone || '',
        role: 'customer',
        authProvider: userId && userId !== 'guest' ? 'registered' : 'order_checkout',
        shippingAddress: shippingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        orderCount: 1,
        totalSpent: Number(totalAmount) || 0,
        lastOrderAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(targetDocRef, customerRecord);
      return { id: targetDocRef.id, ...customerRecord };
    } else {
      // Update existing customer record with latest order info
      const currentOrderCount = Number(existingData.orderCount || 0) + 1;
      const currentTotalSpent = Number(existingData.totalSpent || 0) + (Number(totalAmount) || 0);

      const updatePayload = {
        orderCount: currentOrderCount,
        totalSpent: currentTotalSpent,
        lastOrderAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(name && !existingData.name ? { name } : {}),
        ...(phone && !existingData.phone ? { phone } : {}),
        ...(shippingAddress && !existingData.shippingAddress?.street ? { shippingAddress } : {})
      };

      await updateDoc(targetDocRef, updatePayload);
      return { id: targetDocRef.id, ...existingData, ...updatePayload };
    }
  } catch (error) {
    console.error("Error saving customer from order:", error);
    // Non-blocking for order flow
    return null;
  }
};


import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getProductById } from './productService';

const ORDERS_COLLECTION = 'orders';

/**
 * Verify current live product details from Firestore and create immutable order snapshot
 */
export const createOrder = async (orderData) => {
  try {
    const { items, customerInfo, paymentMethod, userId } = orderData;

    if (!items || items.length === 0) {
      throw new Error("Cannot place an order with an empty cart.");
    }

    // Step 1: Re-verify every product's price and availability from Firestore (Source of Truth)
    const verifiedItems = [];
    let verifiedSubtotal = 0;

    for (const item of items) {
      const liveProduct = await getProductById(item.productId);
      if (!liveProduct) {
        throw new Error(`Product "${item.name || item.productId}" is no longer available.`);
      }

      // Check active state
      if (liveProduct.isActive === false) {
        throw new Error(`Product "${liveProduct.name}" is currently inactive and cannot be purchased.`);
      }

      // Use verified live price from Firestore
      const verifiedPrice = liveProduct.discountPrice && Number(liveProduct.discountPrice) > 0 
        ? Number(liveProduct.discountPrice) 
        : Number(liveProduct.price);

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const itemTotal = verifiedPrice * quantity;
      verifiedSubtotal += itemTotal;

      // Create product snapshot
      verifiedItems.push({
        productId: liveProduct.id,
        productName: liveProduct.name,
        price: verifiedPrice,
        originalPrice: Number(liveProduct.price),
        discountPrice: liveProduct.discountPrice ? Number(liveProduct.discountPrice) : null,
        quantity: quantity,
        selectedSize: item.selectedSize || (liveProduct.sizes && liveProduct.sizes[0]) || 'M',
        selectedColor: item.selectedColor || (liveProduct.colors && liveProduct.colors[0]) || 'Black',
        image: (liveProduct.images && liveProduct.images[0]) || item.image || '',
        itemTotal: itemTotal
      });
    }

    const shippingFee = verifiedSubtotal > 100 ? 0 : 10; // Free shipping over $100
    const totalAmount = verifiedSubtotal + shippingFee;

    const newOrder = {
      userId: userId || 'guest',
      customerName: customerInfo.name || 'Anonymous Customer',
      customerEmail: customerInfo.email || '',
      customerPhone: customerInfo.phone || '',
      shippingAddress: {
        street: customerInfo.street || '',
        city: customerInfo.city || '',
        state: customerInfo.state || '',
        zipCode: customerInfo.zipCode || '',
        country: customerInfo.country || 'United States'
      },
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      shippingFee: shippingFee,
      totalAmount: totalAmount,
      status: 'pending', // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
      paymentMethod: paymentMethod || 'Cash On Delivery (COD)',
      paymentStatus: paymentMethod === 'Credit Card' ? 'paid' : 'pending',
      orderNotes: customerInfo.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), newOrder);
    return { id: docRef.id, ...newOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

/**
 * Real-time listener for all orders (Admin)
 */
export const listenToAllOrders = (callback, errorCallback) => {
  try {
    const q = query(collection(db, ORDERS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort newest first
      orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      callback(orders);
    }, (error) => {
      console.error("Error in listenToAllOrders:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up orders listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Real-time listener for specific user's orders (Customer)
 */
export const listenToUserOrders = (userId, callback, errorCallback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION), 
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      callback(orders);
    }, (error) => {
      console.error(`Error in listenToUserOrders (${userId}):`, error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    console.error("Error setting up user orders listener:", error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

/**
 * Update order status (Admin)
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return { id: orderId, status };
  } catch (error) {
    console.error(`Error updating order status (${orderId}):`, error);
    throw error;
  }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching order (${orderId}):`, error);
    throw error;
  }
};

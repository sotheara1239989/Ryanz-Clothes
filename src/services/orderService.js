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
import { saveCustomerFromOrder } from './userService';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from './emailService';

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
    const createdOrderResult = { id: docRef.id, ...newOrder };

    // Automatically save / sync customer record in Firestore 'users' collection
    try {
      await saveCustomerFromOrder({
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone,
        shippingAddress: newOrder.shippingAddress,
        userId: userId,
        totalAmount: totalAmount
      });
    } catch (custErr) {
      console.warn("Customer sync non-blocking warning:", custErr);
    }

    // Automatically send order confirmation email to customer
    try {
      await sendOrderConfirmationEmail(createdOrderResult);
    } catch (emailErr) {
      console.warn("Confirmation email dispatch warning:", emailErr);
    }

    return createdOrderResult;
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
 * Real-time listener for specific user's orders (queries by userId AND/OR customerEmail)
 */
export const listenToUserOrders = (userId, userEmail, callback, errorCallback) => {
  let email = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  let cb = typeof userEmail === 'function' ? userEmail : callback;
  let errCb = typeof userEmail === 'function' ? callback : errorCallback;

  if (!userId && !email) {
    if (cb) cb([]);
    return () => {};
  }

  try {
    const ordersMap = new Map();

    const emitOrders = () => {
      const orders = Array.from(ordersMap.values());
      orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      if (cb) cb(orders);
    };

    const unsubscribers = [];

    // 1. Query by userId (if registered user)
    if (userId && userId !== 'guest') {
      const qUid = query(
        collection(db, ORDERS_COLLECTION), 
        where('userId', '==', userId)
      );
      const unsubUid = onSnapshot(qUid, (snapshot) => {
        snapshot.docs.forEach(doc => {
          ordersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        emitOrders();
      }, (error) => {
        console.error(`Error in listenToUserOrders UID (${userId}):`, error);
        if (errCb) errCb(error);
      });
      unsubscribers.push(unsubUid);
    }

    // 2. Query by customerEmail (catches guest orders placed with this email)
    if (email) {
      const qEmail = query(
        collection(db, ORDERS_COLLECTION), 
        where('customerEmail', '==', email)
      );
      const unsubEmail = onSnapshot(qEmail, (snapshot) => {
        snapshot.docs.forEach(doc => {
          ordersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        emitOrders();
      }, (error) => {
        console.error(`Error in listenToUserOrders Email (${email}):`, error);
        if (errCb) errCb(error);
      });
      unsubscribers.push(unsubEmail);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  } catch (error) {
    console.error("Error setting up user orders listener:", error);
    if (errCb) errCb(error);
    return () => {};
  }
};

/**
 * Update order status and notify customer via email (Admin)
 */
export const updateOrderStatus = async (orderId, status, trackingInfo = {}) => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updatePayload = {
      status,
      updatedAt: serverTimestamp(),
      ...(trackingInfo.trackingNumber ? { trackingNumber: trackingInfo.trackingNumber } : {}),
      ...(trackingInfo.trackingCarrier ? { trackingCarrier: trackingInfo.trackingCarrier } : {}),
      ...(trackingInfo.trackingUrl ? { trackingUrl: trackingInfo.trackingUrl } : {})
    };

    await updateDoc(docRef, updatePayload);

    // Automatically send status update email to customer
    try {
      const orderSnap = await getDoc(docRef);
      if (orderSnap.exists()) {
        const fullOrder = { id: orderSnap.id, ...orderSnap.data() };
        await sendOrderStatusUpdateEmail(fullOrder, status, trackingInfo);
      }
    } catch (emailErr) {
      console.warn("Status update email warning:", emailErr);
    }

    return { id: orderId, status, ...trackingInfo };
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

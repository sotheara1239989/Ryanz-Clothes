import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  fetchCjProductDetails, 
  transformCjToFirestoreProduct, 
  getValidAccessToken, 
  getCjCredentials 
} from './cjDropshippingService';
import { updateProduct, getProducts } from './productService';
import { updateOrderStatus } from './orderService';

const CJ_API_BASE = typeof window !== 'undefined' && window.location?.origin
  ? '/cj-api'
  : 'https://developers.cjdropshipping.com/api2.0/v1';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sync a single Firestore product with live data from CJ Dropshipping
 */
export const syncSingleProductWithCj = async (productId, options = {}) => {
  try {
    const productRef = doc(db, 'products', productId);
    const snap = await getDoc(productRef);
    if (!snap.exists()) {
      throw new Error(`Product ID ${productId} not found in Firestore.`);
    }

    const currentData = snap.data();
    const cjIdentifier = currentData.cjpId || currentData.cjpSku;
    if (!cjIdentifier) {
      return { 
        success: false, 
        message: 'Product does not have a CJ Product ID or SKU attached.',
        skipped: true 
      };
    }

    // 1. Query CJ live details
    const liveCjData = await fetchCjProductDetails(cjIdentifier);
    if (!liveCjData) {
      return { 
        success: false, 
        message: `Could not retrieve live data from CJ API for ${cjIdentifier}.`,
        skipped: true 
      };
    }

    // 2. Transform live CJ data
    const transformed = transformCjToFirestoreProduct(liveCjData, options);

    // 3. Compute price/stock delta
    const oldPrice = Number(currentData.price) || 0;
    const newPrice = Number(transformed.price) || 0;
    const oldStock = Number(currentData.stock) || 0;
    const newStock = Number(transformed.stock) || 0;

    const updatePayload = {
      price: transformed.price,
      discountPrice: transformed.discountPrice,
      stock: transformed.stock,
      sizes: transformed.sizes,
      colors: transformed.colors,
      variants: transformed.variants,
      images: transformed.images,
      supplierCost: transformed.supplierCost,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced'
    };

    await updateProduct(productId, updatePayload);

    return {
      success: true,
      productId,
      name: currentData.name,
      oldPrice,
      newPrice,
      priceChanged: oldPrice !== newPrice,
      oldStock,
      newStock,
      stockChanged: oldStock !== newStock,
      variantsCount: transformed.variants?.length || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error syncing product ${productId} with CJ:`, error);
    throw error;
  }
};

/**
 * Batch Sync ALL products in Firestore with CJ Dropshipping API
 * Automatically detects inventory changes, price updates, and variant shifts
 */
export const syncAllFirestoreProductsWithCj = async (options = {}, onProgress) => {
  const results = {
    totalScanned: 0,
    cjProductsCount: 0,
    syncedCount: 0,
    priceChangesCount: 0,
    stockChangesCount: 0,
    errorsCount: 0,
    details: [],
    errors: []
  };

  try {
    const allProducts = await getProducts();
    results.totalScanned = allProducts.length;

    // Filter only CJ products
    const cjProducts = allProducts.filter(p => Boolean(p.cjpId || p.cjpSku));
    results.cjProductsCount = cjProducts.length;

    if (cjProducts.length === 0) {
      return results;
    }

    for (let i = 0; i < cjProducts.length; i++) {
      const prod = cjProducts[i];
      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: cjProducts.length,
            productName: prod.name || prod.id,
            status: 'syncing'
          });
        }

        const syncRes = await syncSingleProductWithCj(prod.id, options);
        if (syncRes.success) {
          results.syncedCount++;
          if (syncRes.priceChanged) results.priceChangesCount++;
          if (syncRes.stockChanged) results.stockChangesCount++;
          results.details.push(syncRes);
        }

        // Rate-limiting delay between sequential CJ queries (1000ms)
        if (i < cjProducts.length - 1) {
          await sleep(1000);
        }
      } catch (itemErr) {
        results.errorsCount++;
        results.errors.push({
          productId: prod.id,
          name: prod.name,
          error: itemErr.message || 'Sync failed'
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error in syncAllFirestoreProductsWithCj:", error);
    throw error;
  }
};

/**
 * Submit an order to CJ Dropshipping for fulfillment
 */
export const syncOrderToCjFulfillment = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) {
      throw new Error(`Order ID ${orderId} not found in Firestore.`);
    }

    const order = snap.data();
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error("CJ Dropshipping access token not available. Please verify API Key in Admin Settings.");
    }

    // Build CJ line items payload with authentic vid and variantSku
    const cjLineItems = [];
    for (const item of (order.items || [])) {
      let variantSku = null;
      let variantVid = null;

      if (item.productId) {
        const prod = await getDoc(doc(db, 'products', item.productId));
        if (prod.exists()) {
          const pData = prod.data();
          const targetColor = String(item.selectedColor || '').toLowerCase().trim();
          const targetSize = String(item.selectedSize || '').toLowerCase().trim();

          // 1. Check if Firestore already has a verified real vid/sku (not synthetic)
          const matchedVar = Array.isArray(pData.variants)
            ? pData.variants.find(v => 
                String(v.size || '').toLowerCase().trim() === targetSize &&
                String(v.color || '').toLowerCase().trim() === targetColor
              ) || pData.variants.find(v => 
                String(v.color || '').toLowerCase().trim() === targetColor
              ) || pData.variants[0]
            : null;

          if (matchedVar?.vid && String(matchedVar.vid) !== String(pData.cjpId) && String(matchedVar.vid).length > 3) {
            variantVid = String(matchedVar.vid);
          }
          if (matchedVar?.variantSku && !matchedVar.variantSku.includes('-Blue-') && !matchedVar.variantSku.includes('-Standard-')) {
            variantSku = String(matchedVar.variantSku);
          }

          // 2. Query Live CJ API to resolve exact warehouse variant vid & sku
          const cjIdentifier = pData.cjpId || pData.cjpSku;
          if (cjIdentifier) {
            try {
              const liveDetails = await fetchCjProductDetails(cjIdentifier);
              if (liveDetails && Array.isArray(liveDetails.variants) && liveDetails.variants.length > 0) {
                // Find exact color & size match in live CJ variants
                const liveVar = liveDetails.variants.find(v => {
                  const rawKey = (v.variantKey || v.variantNameEn || v.variantName || v.variantStandard || '').toLowerCase();
                  const vCol = (v.variantColor || v.color || '').toLowerCase();
                  const vSz = (v.variantSize || v.size || '').toLowerCase();

                  const colorMatches = targetColor === 'standard' || targetColor === 'default' ||
                    rawKey.includes(targetColor) || vCol.includes(targetColor);
                  const sizeMatches = targetSize === 'standard' || targetSize === 'default' ||
                    rawKey.includes(targetSize) || vSz.includes(targetSize);

                  return colorMatches && sizeMatches;
                }) || liveDetails.variants.find(v => {
                  const rawKey = (v.variantKey || v.variantNameEn || '').toLowerCase();
                  return rawKey.includes(targetColor) || (v.variantColor || '').toLowerCase().includes(targetColor);
                }) || liveDetails.variants[0];

                if (liveVar) {
                  if (liveVar.vid || liveVar.variantId || liveVar.id) {
                    variantVid = String(liveVar.vid || liveVar.variantId || liveVar.id);
                  }
                  if (liveVar.variantSku || liveVar.sku) {
                    variantSku = String(liveVar.variantSku || liveVar.sku);
                  }
                }
              }
            } catch (queryErr) {
              console.warn("Live CJ variant query warning:", queryErr);
            }
          }

          if (!variantSku && matchedVar?.sku) {
            variantSku = matchedVar.sku;
          }
          if (!variantSku && pData.cjpSku) {
            variantSku = pData.cjpSku;
          }
        }
      }

      if (!variantSku && item.variantSku) variantSku = item.variantSku;
      if (!variantSku && item.sku) variantSku = item.sku;
      if (!variantVid && item.vid && item.vid !== item.productId) variantVid = item.vid;

      if (variantSku || variantVid) {
        const lineItem = {
          quantity: Number(item.quantity) || 1
        };
        if (variantVid && String(variantVid).length > 3) {
          lineItem.vid = String(variantVid);
        }
        if (variantSku) {
          lineItem.variantSku = String(variantSku);
          lineItem.sku = String(variantSku);
          lineItem.productSku = String(variantSku);
        }
        cjLineItems.push(lineItem);
      }
    }

    if (cjLineItems.length === 0) {
      throw new Error("None of the items in this order have a valid CJ Dropshipping SKU or Variant ID attached.");
    }

    const destCountryCode = order.shippingAddress?.countryCode || 'US';
    const destCountryName = order.shippingAddress?.country || 'United States';
    const customerFullName = order.customerName || 'Valued Customer';
    const customerPhoneNum = order.customerPhone || '1234567890';
    const streetAddr = order.shippingAddress?.street || '123 Main St';
    const city = order.shippingAddress?.city || 'City';
    const province = order.shippingAddress?.state || 'State';
    const zip = order.shippingAddress?.zipCode || '10001';

    const cjOrderPayload = {
      orderNumber: `RYANZ-${orderId.substring(0, 8).toUpperCase()}`,
      fromCountryCode: 'CN', // Origin dispatch warehouse (CN = China dispatch / global warehouse)
      countryCode: destCountryCode,
      shippingCountryCode: destCountryCode,
      country: destCountryName,
      shippingCountry: destCountryName,
      customerName: customerFullName,
      shippingCustomerName: customerFullName,
      shippingAddress: streetAddr,
      shippingCity: city,
      shippingProvince: province,
      shippingZip: zip,
      zip: zip,
      phone: customerPhoneNum,
      shippingPhone: customerPhoneNum,
      email: order.customerEmail || '',
      shippingCustomerEmail: order.customerEmail || '',
      logisticName: order.logisticName || order.shippingMethod || 'CJPacket Ordinary',
      shippingName: order.logisticName || order.shippingMethod || 'CJPacket Ordinary',
      remark: `Ryanz Clothes store order #${orderId.substring(0, 8)}`,
      products: cjLineItems
    };

    const response = await fetch(`${CJ_API_BASE}/shopping/order/createOrder`, {
      method: 'POST',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cjOrderPayload)
    });

    const data = await response.json();
    const isSuccess = data.result === true || data.code === 200 || String(data.message).toLowerCase() === 'success';

    if (isSuccess) {
      let cjOrderId = null;
      if (typeof data.data === 'string' || typeof data.data === 'number') {
        cjOrderId = String(data.data);
      } else if (typeof data.data === 'object' && data.data !== null) {
        cjOrderId = data.data.orderId || 
                    data.data.cjOrderId || 
                    data.data.orderNumber || 
                    data.data.id || 
                    (Array.isArray(data.data.orderIdList) ? data.data.orderIdList[0] : null);
      }

      const safeOrderId = String(cjOrderId || cjOrderPayload.orderNumber || `CJ-${Date.now()}`);

      await updateDoc(orderRef, {
        cjOrderId: safeOrderId,
        cjOrderNumber: String(cjOrderPayload.orderNumber || safeOrderId),
        cjFulfillmentStatus: 'submitted_to_cj',
        status: 'processing',
        cjSyncTimestamp: new Date().toISOString()
      });

      return {
        success: true,
        orderId,
        cjOrderId: safeOrderId,
        message: "Order successfully submitted to CJ Dropshipping for fulfillment."
      };
    } else {
      throw new Error(data.message || "CJ API rejected fulfillment order creation.");
    }
  } catch (error) {
    console.error(`Error syncing order ${orderId} to CJ:`, error);
    throw error;
  }
};

/**
 * Track live shipment from CJ Dropshipping and update Firestore Order
 */
export const syncCjOrderTracking = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error(`Order ${orderId} not found.`);

    const order = snap.data();
    const cjOrderId = order.cjOrderId;
    if (!cjOrderId) {
      return { success: false, message: "Order does not have a CJ Order ID." };
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) throw new Error("CJ Access token required.");

    const response = await fetch(`${CJ_API_BASE}/shopping/order/getOrderDetail?orderId=${encodeURIComponent(cjOrderId)}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if ((data.result || data.code === 200) && data.data) {
      const trackingNumber = data.data.trackingNumber || data.data.logisticTrackNo || null;
      const carrier = data.data.logisticName || data.data.shippingMethod || 'CJ Packet';
      const cjStatus = String(data.data.orderStatus || data.data.status || '').toLowerCase();

      let orderStatus = order.status;
      if (trackingNumber || cjStatus.includes('shipped') || cjStatus.includes('delivered')) {
        orderStatus = cjStatus.includes('delivered') ? 'delivered' : 'shipped';
      }

      const updates = {
        trackingNumber: trackingNumber || order.trackingNumber || null,
        trackingCarrier: carrier,
        trackingUrl: trackingNumber ? `https://www.17track.net/en/track?nums=${trackingNumber}` : null,
        status: orderStatus,
        cjLastTrackedAt: new Date().toISOString()
      };

      await updateDoc(orderRef, updates);

      return {
        success: true,
        orderId,
        trackingNumber,
        carrier,
        status: orderStatus
      };
    }

    return { success: false, message: data.message || "No tracking update available yet." };
  } catch (error) {
    console.error(`Tracking sync error for ${orderId}:`, error);
    throw error;
  }
};

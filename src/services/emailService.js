import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get active EmailJS credentials from localStorage or import.meta.env
 */
export const getEmailJsConfig = () => {
  try {
    const local = localStorage.getItem('ryanz_emailjs_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.serviceId && parsed.templateId && parsed.publicKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read localStorage emailjs config:", e);
  }

  return {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
  };
};

/**
 * Save custom EmailJS credentials to localStorage
 */
export const saveEmailJsConfig = (config) => {
  try {
    localStorage.setItem('ryanz_emailjs_config', JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Failed to save emailjs config to localStorage:", e);
    return false;
  }
};

/**
 * Generate 100% Mobile-Friendly Responsive Order Confirmation Email
 */
export const generateOrderConfirmationHtml = (order) => {
  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
        <div style="font-size: 14px; font-weight: 700; color: #111827;">${item.productName || 'Streetwear Item'}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 3px;">
          Size: <strong style="color: #111827;">${item.selectedSize || 'M'}</strong> &bull; Color: <strong style="color: #111827;">${item.selectedColor || 'Black'}</strong> &bull; Qty: <strong style="color: #111827;">${item.quantity || 1}</strong>
        </div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; vertical-align: top; font-weight: 800; font-size: 14px; color: #111827;">
        $${(Number(item.itemTotal) || (Number(item.price) * Number(item.quantity)) || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation #${order.id}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; border-radius: 0 !important; }
          .content-padding { padding: 24px 16px !important; }
          .header-padding { padding: 24px 16px !important; }
          .btn-action { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
          .meta-col { display: block !important; width: 100% !important; text-align: left !important; margin-bottom: 8px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
          <td align="center">
            
            <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              
              <!-- Brand Header with Logo -->
              <tr>
                <td class="header-padding" style="background-color: #000000; padding: 32px 24px; text-align: center;">
                  <div style="text-align: center; margin-bottom: 12px;">
                    <img 
                      src="https://ryanz-clothes.web.app/logo.png" 
                      alt="Ryanz Clothes" 
                      width="54" 
                      height="54" 
                      style="width: 54px; height: 54px; border-radius: 14px; display: inline-block; vertical-align: middle; border: 2px solid #27272a; object-fit: cover; background-color: #ffffff;" 
                    />
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                    RYANZ<span style="color: #9ca3af; font-weight: 300; margin-left: 4px;">CLOTHES</span>
                  </h1>
                  <div style="display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px; margin-top: 12px; border: 1px solid #059669;">
                    ✓ Order Confirmed &amp; In Production
                  </div>
                </td>
              </tr>

              <!-- Main Content Body -->
              <tr>
                <td class="content-padding" style="padding: 32px 28px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: #111827;">
                    Thank You, ${order.customerName || 'Valued Customer'}!
                  </h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                    Your order has been received and verified. Our fulfillment center is now preparing your garments for worldwide express shipment.
                  </p>

                  <!-- Order Summary Banner -->
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="meta-col" style="vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Order Number</div>
                          <div style="font-size: 14px; font-weight: 800; color: #111827; font-family: monospace; margin-top: 2px;">#${order.id}</div>
                        </td>
                        <td class="meta-col" style="vertical-align: top; text-align: right;">
                          <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Payment</div>
                          <div style="font-size: 13px; font-weight: 700; color: #111827; margin-top: 2px;">${order.paymentMethod || 'Credit Card / COD'}</div>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Track Order Button -->
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="https://ryanz-clothes.web.app/my-orders?id=${order.id}" class="btn-action" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 16px 36px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); letter-spacing: 0.5px;">
                      Track Live Order Status &rarr;
                    </a>
                  </div>

                  <!-- Items Table -->
                  <div style="margin-top: 28px;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 8px;">
                      Order Breakdown (${order.items?.length || 0} items)
                    </div>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 10px 0; font-size: 13px; color: #6b7280;">Subtotal</td>
                        <td style="padding: 10px 0; text-align: right; font-size: 13px; font-weight: 700; color: #111827;">$${Number(order.subtotal || order.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #059669;">Worldwide Express Shipping</td>
                        <td style="padding: 6px 0; text-align: right; font-size: 13px; font-weight: 800; color: #059669;">FREE ($0.00)</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0 0 0; border-top: 2px solid #e5e7eb; font-size: 16px; font-weight: 900; color: #111827;">Total Paid</td>
                        <td style="padding: 14px 0 0 0; border-top: 2px solid #e5e7eb; text-align: right; font-size: 18px; font-weight: 900; color: #111827;">$${Number(order.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Shipping Destination -->
                  <div style="background-color: #f9fafb; border-radius: 14px; padding: 16px; border: 1px solid #e5e7eb; margin-top: 24px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Delivery Address
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">${order.customerName}</strong><br>
                      ${order.shippingAddress?.street || ''}<br>
                      ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}<br>
                      ${order.shippingAddress?.country || 'United States'}
                    </div>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 20px; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">
                    Have questions? Reply directly to this email or visit our help center.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                    &copy; ${new Date().getFullYear()} Ryanz Clothes. Luxury Streetwear E-Commerce.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

/**
 * Generate 100% Mobile-Friendly Responsive Order Status Update Email
 */
export const generateOrderStatusUpdateHtml = (order, newStatus, trackingInfo = {}) => {
  let statusHeading = '';
  let statusBadgeText = '';
  let statusSubheading = '';
  let statusBadgeBg = '#f3f4f6';
  let statusBadgeColor = '#111827';
  let statusBadgeBorder = '#e5e7eb';

  switch (newStatus) {
    case 'processing':
      statusHeading = 'Order Is Being Prepared';
      statusBadgeText = '🛠️ Processing';
      statusSubheading = 'Our fulfillment specialists are carefully packing and preparing your streetwear pieces for express courier dispatch.';
      statusBadgeBg = '#fef3c7';
      statusBadgeColor = '#92400e';
      statusBadgeBorder = '#fde68a';
      break;
    case 'shipped':
      statusHeading = 'Your Package Has Shipped!';
      statusBadgeText = '🚚 In Transit';
      statusSubheading = 'Your package is on its way with active live courier tracking updates.';
      statusBadgeBg = '#dbeafe';
      statusBadgeColor = '#1e40af';
      statusBadgeBorder = '#bfdbfe';
      break;
    case 'delivered':
      statusHeading = 'Package Delivered!';
      statusBadgeText = '🎉 Delivered';
      statusSubheading = 'Your package was successfully delivered to your shipping address. Enjoy your fresh rotation!';
      statusBadgeBg = '#d1fae5';
      statusBadgeColor = '#065f46';
      statusBadgeBorder = '#a7f3d0';
      break;
    case 'cancelled':
      statusHeading = 'Order Update: Cancelled';
      statusBadgeText = '❌ Cancelled';
      statusSubheading = 'Your order has been cancelled. If you have questions, please reach out to customer concierge.';
      statusBadgeBg = '#ffe4e6';
      statusBadgeColor = '#9f1239';
      statusBadgeBorder = '#fecdd3';
      break;
    default:
      statusHeading = `Order Status: ${String(newStatus).toUpperCase()}`;
      statusBadgeText = `Status: ${String(newStatus).toUpperCase()}`;
      statusSubheading = 'There is a new update regarding your order fulfillment.';
      statusBadgeBg = '#f3f4f6';
      statusBadgeColor = '#111827';
      statusBadgeBorder = '#e5e7eb';
  }

  const trackingNumber = trackingInfo.trackingNumber || order.trackingNumber;
  const trackingCarrier = trackingInfo.trackingCarrier || order.trackingCarrier || 'USPS / CJ Packet';
  const trackingUrl = trackingInfo.trackingUrl || order.trackingUrl || (trackingNumber ? `https://www.17track.net/en/track?nums=${trackingNumber}` : null);

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
        <div style="font-size: 13px; font-weight: 700; color: #111827;">${item.productName || 'Streetwear Item'}</div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
          Size: ${item.selectedSize || 'M'} &bull; Color: ${item.selectedColor || 'Black'} &bull; Qty: ${item.quantity || 1}
        </div>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; vertical-align: top; font-weight: 800; font-size: 13px; color: #111827;">
        $${(Number(item.itemTotal) || (Number(item.price) * Number(item.quantity)) || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update #${order.id}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; border-radius: 0 !important; }
          .content-padding { padding: 24px 16px !important; }
          .header-padding { padding: 24px 16px !important; }
          .btn-action { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
          .meta-col { display: block !important; width: 100% !important; text-align: left !important; margin-bottom: 8px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
          <td align="center">
            
            <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              
              <!-- Brand Header with Logo -->
              <tr>
                <td class="header-padding" style="background-color: #000000; padding: 32px 24px; text-align: center;">
                  <div style="text-align: center; margin-bottom: 12px;">
                    <img 
                      src="https://ryanz-clothes.web.app/logo.png" 
                      alt="Ryanz Clothes" 
                      width="54" 
                      height="54" 
                      style="width: 54px; height: 54px; border-radius: 14px; display: inline-block; vertical-align: middle; border: 2px solid #27272a; object-fit: cover; background-color: #ffffff;" 
                    />
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                    RYANZ<span style="color: #9ca3af; font-weight: 300; margin-left: 4px;">CLOTHES</span>
                  </h1>
                  <div style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeBorder}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 9999px; margin-top: 12px;">
                    ${statusBadgeText}
                  </div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td class="content-padding" style="padding: 32px 28px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: #111827;">
                    ${statusHeading}
                  </h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                    Hi <strong>${order.customerName || 'Valued Customer'}</strong>, ${statusSubheading}
                  </p>

                  <!-- Order Meta & Tracking Box -->
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="meta-col" style="vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Order Number</div>
                          <div style="font-size: 14px; font-weight: 800; color: #111827; font-family: monospace; margin-top: 2px;">#${order.id}</div>
                        </td>
                        <td class="meta-col" style="vertical-align: top; text-align: right;">
                          <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Status</div>
                          <div style="font-size: 13px; font-weight: 800; color: #111827; text-transform: uppercase; margin-top: 2px;">${newStatus}</div>
                        </td>
                      </tr>

                      ${trackingNumber ? `
                      <tr>
                        <td colspan="2" style="padding-top: 14px; margin-top: 12px; border-top: 1px solid #e5e7eb;">
                          <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Tracking Number</div>
                          <div style="font-size: 14px; font-weight: 800; color: #2563eb; font-family: monospace; margin-top: 2px;">
                            ${trackingCarrier}: ${trackingNumber}
                          </div>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>

                  <!-- Action Button -->
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${trackingUrl || `https://ryanz-clothes.web.app/my-orders?id=${order.id}`}" class="btn-action" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 16px 36px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); letter-spacing: 0.5px;">
                      ${trackingNumber ? 'Track Courier Delivery &rarr;' : 'View In My Orders &rarr;'}
                    </a>
                  </div>

                  <!-- Items Snapshot -->
                  <div style="margin-top: 28px;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 8px;">
                      Order Summary (${order.items?.length || 0} items)
                    </div>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 12px 0 0 0; border-top: 2px solid #e5e7eb; font-size: 14px; font-weight: 900; color: #111827;">Total Amount</td>
                        <td style="padding: 12px 0 0 0; border-top: 2px solid #e5e7eb; text-align: right; font-size: 16px; font-weight: 900; color: #111827;">$${Number(order.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 20px; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">
                    Questions about your shipment? Reply directly to this email or visit our help center.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                    &copy; ${new Date().getFullYear()} Ryanz Clothes. Luxury Streetwear E-Commerce.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

/**
 * Send order confirmation email via direct EmailJS REST API with Firestore logging
 */
export const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.customerEmail) {
    console.warn("No customer email provided for order confirmation:", order?.id);
    return null;
  }

  const subject = `Order Confirmed #${order.id} — Ryanz Clothes`;
  const htmlContent = generateOrderConfirmationHtml(order);
  const textContent = `Thank you for your order #${order.id}! Total amount: $${Number(order.totalAmount || 0).toFixed(2)}. Track your package at https://ryanz-clothes.web.app/my-orders?id=${order.id}`;

  const emailLog = {
    to: order.customerEmail,
    subject: subject,
    orderId: order.id,
    customerName: order.customerName || 'Customer',
    totalAmount: order.totalAmount || 0,
    status: 'sent',
    dispatchedAt: serverTimestamp()
  };

  const { serviceId, templateId, publicKey } = getEmailJsConfig();

  if (serviceId && templateId && publicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: order.customerEmail,
            email: order.customerEmail,
            user_email: order.customerEmail,
            recipient_email: order.customerEmail,
            recipient: order.customerEmail,
            reply_to: order.customerEmail,
            to_name: order.customerName || 'Valued Customer',
            name: order.customerName || 'Valued Customer',
            order_id: order.id,
            total_amount: `$${Number(order.totalAmount || 0).toFixed(2)}`,
            tracking_link: `https://ryanz-clothes.web.app/my-orders?id=${order.id}`,
            message_html: htmlContent,
            message: textContent
          }
        })
      });

      if (response.ok) {
        console.log(`✓ EmailJS dispatched confirmation to ${order.customerEmail} for order #${order.id}`);
        emailLog.status = 'delivered_via_emailjs';
      } else {
        const errText = await response.text();
        console.error(`❌ EmailJS Error (${response.status}):`, errText);
        emailLog.error = errText;
      }
    } catch (e) {
      console.error("❌ EmailJS fetch exception:", e);
      emailLog.error = e.message;
    }
  } else {
    console.warn("⚠️ Email keys not detected. Configure EmailJS in Admin Panel or .env.");
  }

  try {
    const docRef = await addDoc(collection(db, 'mail_logs'), emailLog);
    return { id: docRef.id, ...emailLog };
  } catch (error) {
    console.warn("Firestore mail_logs write notice:", error.message);
    return { id: 'local-dispatch', ...emailLog };
  }
};

/**
 * Send order status update email to customer via EmailJS with Firestore logging
 */
export const sendOrderStatusUpdateEmail = async (order, newStatus, trackingInfo = {}) => {
  if (!order || !order.customerEmail) {
    console.warn("No customer email available for status update:", order?.id);
    return null;
  }

  const subject = `Order #${order.id} Status: ${String(newStatus).toUpperCase()} — Ryanz Clothes`;
  const htmlContent = generateOrderStatusUpdateHtml(order, newStatus, trackingInfo);
  const textContent = `Your order #${order.id} status has been updated to ${newStatus}. Track your order at https://ryanz-clothes.web.app/my-orders?id=${order.id}`;

  const emailLog = {
    to: order.customerEmail,
    subject: subject,
    orderId: order.id,
    newStatus: newStatus,
    customerName: order.customerName || 'Customer',
    status: 'sent',
    dispatchedAt: serverTimestamp()
  };

  const { serviceId, templateId, publicKey } = getEmailJsConfig();

  if (serviceId && templateId && publicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: order.customerEmail,
            email: order.customerEmail,
            user_email: order.customerEmail,
            recipient_email: order.customerEmail,
            recipient: order.customerEmail,
            reply_to: order.customerEmail,
            to_name: order.customerName || 'Valued Customer',
            name: order.customerName || 'Valued Customer',
            order_id: order.id,
            total_amount: `$${Number(order.totalAmount || 0).toFixed(2)}`,
            tracking_link: `https://ryanz-clothes.web.app/my-orders?id=${order.id}`,
            message_html: htmlContent,
            message: textContent
          }
        })
      });

      if (response.ok) {
        console.log(`✓ Order status email (${newStatus}) dispatched to ${order.customerEmail} for #${order.id}`);
        emailLog.status = 'delivered_via_emailjs';
      } else {
        const errText = await response.text();
        console.error(`❌ EmailJS Error (${response.status}):`, errText);
        emailLog.error = errText;
      }
    } catch (e) {
      console.error("❌ EmailJS fetch exception:", e);
      emailLog.error = e.message;
    }
  }

  try {
    const docRef = await addDoc(collection(db, 'mail_logs'), emailLog);
    return { id: docRef.id, ...emailLog };
  } catch (error) {
    return { id: 'local-dispatch', ...emailLog };
  }
};

/**
 * Send a live test email directly to verify EmailJS configuration
 */
export const testSendEmail = async (targetEmail) => {
  const { serviceId, templateId, publicKey } = getEmailJsConfig();
  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      message: "Missing EmailJS configuration (Service ID, Template ID, or Public Key)."
    };
  }

  const dummyOrder = {
    id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    customerEmail: targetEmail,
    customerName: 'Store Administrator',
    paymentMethod: 'Test Verification',
    totalAmount: 99.00,
    subtotal: 99.00,
    items: [
      {
        productName: 'Oversized Boxy Heavyweight Hoodie',
        selectedSize: 'L',
        selectedColor: 'Vintage Black',
        quantity: 1,
        price: 99.00,
        itemTotal: 99.00
      }
    ],
    shippingAddress: {
      street: '123 Fashion Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'United States'
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: targetEmail,
          email: targetEmail,
          user_email: targetEmail,
          recipient_email: targetEmail,
          recipient: targetEmail,
          reply_to: targetEmail,
          to_name: 'Store Administrator',
          name: 'Store Administrator',
          order_id: dummyOrder.id,
          total_amount: '$99.00',
          tracking_link: 'https://ryanz-clothes.web.app/my-orders',
          message_html: generateOrderConfirmationHtml(dummyOrder),
          message: `This is a test email sent from Ryanz Clothes for order #${dummyOrder.id}.`
        }
      })
    });

    if (response.ok) {
      return { success: true, message: `Email sent successfully to ${targetEmail}!` };
    } else {
      const err = await response.text();
      return { success: false, message: `EmailJS Error (${response.status}): ${err}` };
    }
  } catch (err) {
    return { success: false, message: `Fetch Error: ${err.message}` };
  }
};

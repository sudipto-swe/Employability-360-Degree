/**
 * SSLCommerz Payment Integration
 *
 * Handles recruiter premium subscription payments via SSLCommerz.
 * SSLCommerz is Bangladesh's leading payment gateway.
 */

const SSLCOMMERZ_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

interface SSLCommerzPayload {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  amount: number;
  planName: string;
  transactionId: string;
}

/** Initialize SSLCommerz session — returns the redirect URL */
export async function initSSLCommerzPayment(payload: SSLCommerzPayload) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const formData = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID || "",
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
    total_amount: payload.amount.toString(),
    currency: "BDT",
    tran_id: payload.transactionId,
    success_url: `${baseUrl}/api/payments/sslcommerz/success`,
    fail_url: `${baseUrl}/api/payments/sslcommerz/fail`,
    cancel_url: `${baseUrl}/api/payments/sslcommerz/cancel`,
    ipn_url: `${baseUrl}/api/payments/sslcommerz/ipn`,
    cus_name: payload.userName,
    cus_email: payload.userEmail,
    cus_phone: payload.userPhone || "N/A",
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: `Employability 360° ${payload.planName} Plan`,
    product_category: "Subscription",
    product_profile: "non-physical-goods",
    value_a: payload.userId,
    value_b: payload.planName,
  });

  const response = await fetch(`${SSLCOMMERZ_BASE_URL}/gwprocess/v4`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const data = await response.json();

  if (data.status === "SUCCESS") {
    return {
      success: true,
      gatewayUrl: data.GatewayPageURL,
      sessionKey: data.sessionkey,
    };
  }

  return {
    success: false,
    error: data.failedreason || "Payment initialization failed",
  };
}

/** Validate SSLCommerz IPN/success callback */
export async function validateSSLCommerzPayment(validationId: string) {
  const response = await fetch(
    `${SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php?` +
      new URLSearchParams({
        val_id: validationId,
        store_id: process.env.SSLCOMMERZ_STORE_ID || "",
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
        format: "json",
      })
  );

  return response.json();
}

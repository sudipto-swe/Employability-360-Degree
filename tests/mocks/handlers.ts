import { http, HttpResponse } from 'msw';

export const handlers = [
  // Intercept Gemini API
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  personalInfo: { name: 'Test User', email: 'test@example.com' },
                  experience: [],
                  education: [],
                  skills: ['TypeScript', 'React']
                })
              }
            ]
          }
        }
      ]
    });
  }),

  // Intercept SSLCommerz API (Initialization)
  http.post('https://sandbox.sslcommerz.com/gwprocess/v4', () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v4/testpage',
      sessionkey: 'test_session_key'
    });
  }),

  // Intercept SSLCommerz API (Validation)
  http.get('https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php', ({ request }) => {
    const url = new URL(request.url);
    const val_id = url.searchParams.get('val_id');

    if (val_id === 'valid_id_123') {
      return HttpResponse.json({
        status: 'VALID',
        tran_id: 'test_tran_id_123',
        amount: '1000.00',
        store_amount: '975.00',
        currency: 'BDT'
      });
    }

    return HttpResponse.json({
      status: 'INVALID_TRANSACTION'
    });
  }),
];

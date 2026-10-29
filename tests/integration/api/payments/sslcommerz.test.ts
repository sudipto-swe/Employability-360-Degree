import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/sslcommerz/success/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma so we don't hit the real database
vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      update: vi.fn(),
    },
    recruiterProfile: {
      update: vi.fn(),
    }
  }
}));

// Mock the email sender so we don't actually send emails during tests
vi.mock('@/lib/emails/resend', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'test_email_id' })
}));

describe('SSLCommerz Webhook POST /api/payments/sslcommerz/success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a VALID webhook, update DB, and redirect to success', async () => {
    // We configured MSW to return { status: 'VALID' } for 'valid_id_123'
    
    // Mock the DB returning the updated subscription
    vi.mocked(prisma.subscription.update).mockResolvedValue({
      id: 'sub_123',
      recruiterId: 'rec_123',
      amount: 1000,
      planName: 'Premium',
      recruiter: {
        user: {
          name: 'Test Recruiter',
          email: 'recruiter@example.com'
        }
      }
    } as any);

    const formData = new FormData();
    formData.append('tran_id', 'test_tran_id_123');
    formData.append('val_id', 'valid_id_123'); // MSW will intercept this
    formData.append('status', 'VALID');

    const request = new NextRequest('http://localhost:3000/api/payments/sslcommerz/success', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    // It should redirect to success
    expect(response.status).toBe(307); // NextResponse.redirect uses 307
    expect(response.headers.get('location')).toContain('status=success');

    // It should have updated the subscription and recruiter profile
    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    expect(prisma.recruiterProfile.update).toHaveBeenCalledTimes(1);
  });

  it('should reject a tampered/invalid signature and redirect to failed', async () => {
    // We configured MSW to return { status: 'INVALID_TRANSACTION' } for anything else
    
    const formData = new FormData();
    formData.append('tran_id', 'fake_tran_id');
    formData.append('val_id', 'invalid_id_999'); // MSW returns INVALID
    formData.append('status', 'VALID'); // Hacker fakes the status in the form data

    const request = new NextRequest('http://localhost:3000/api/payments/sslcommerz/success', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    // It should redirect to failed
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('status=failed');

    // DB should NEVER be updated for a fake transaction
    expect(prisma.subscription.update).not.toHaveBeenCalled();
    expect(prisma.recruiterProfile.update).not.toHaveBeenCalled();
  });
});

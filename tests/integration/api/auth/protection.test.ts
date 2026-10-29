import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as PostJob } from '@/app/api/jobs/route';
// Import auth to mock it
import { auth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('API Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/jobs', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      // Mock auth to return null
      vi.mocked(auth as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await PostJob(req);
      expect(res.status).toBe(401);
      
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should reject JOBSEEKER requests with 403 Forbidden', async () => {
      // Mock auth to return a jobseeker
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: 'user_1', role: 'JOBSEEKER' },
        expires: '1000'
      });

      const req = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await PostJob(req);
      expect(res.status).toBe(403);
      
      const json = await res.json();
      expect(json.error).toBe('Only recruiters can post jobs');
    });
  });
});

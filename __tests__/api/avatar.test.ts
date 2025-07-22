/**
 * @jest-environment node
 */
import { POST, DELETE } from '@/app/api/account/avatar/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, unlink } from 'fs/promises';
import { NextRequest } from 'next/server';

// Add TextEncoder/TextDecoder polyfills for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

jest.mock('@/auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

describe('/api/account/avatar', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
  const mockUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
  const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
  const mockUnlink = unlink as jest.MockedFunction<typeof unlink>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/account/avatar', () => {
    it('should upload avatar successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString(),
      });

      mockFindUnique.mockResolvedValue({
        id: 'test-user-id',
        avatarUrl: null,
      } as any);

      mockUpdate.mockResolvedValue({
        avatarUrl: '/avatars/test-user-id-uuid.jpg',
      } as any);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('avatar', file);

      const request = new NextRequest('http://localhost:3000/api/account/avatar', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.avatarUrl).toMatch(/^\/avatars\//);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should reject unauthorized requests', async () => {
      mockAuth.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('avatar', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

      const request = new NextRequest('http://localhost:3000/api/account/avatar', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject invalid file types', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString(),
      });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('avatar', file);

      const request = new NextRequest('http://localhost:3000/api/account/avatar', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid file type');
    });

    it('should reject large files', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString(),
      });

      // Create a 6MB file (over the 5MB limit)
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('avatar', file);

      const request = new NextRequest('http://localhost:3000/api/account/avatar', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('File too large');
    });

    it('should delete old avatar when uploading new one', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString(),
      });

      mockFindUnique.mockResolvedValue({
        id: 'test-user-id',
        avatarUrl: '/avatars/old-avatar.jpg',
      } as any);

      mockUpdate.mockResolvedValue({
        avatarUrl: '/avatars/test-user-id-uuid.jpg',
      } as any);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('avatar', file);

      const request = new NextRequest('http://localhost:3000/api/account/avatar', {
        method: 'POST',
        body: formData,
      });

      await POST(request);

      expect(mockUnlink).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/account/avatar', () => {
    it('should delete avatar successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString(),
      });

      mockFindUnique.mockResolvedValue({
        id: 'test-user-id',
        avatarUrl: '/avatars/test-avatar.jpg',
      } as any);

      mockUpdate.mockResolvedValue({
        avatarUrl: null,
      } as any);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUnlink).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { avatarUrl: null },
      });
    });

    it('should handle missing avatar gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString(),
      });

      mockFindUnique.mockResolvedValue({
        id: 'test-user-id',
        avatarUrl: null,
      } as any);

      mockUpdate.mockResolvedValue({
        avatarUrl: null,
      } as any);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should reject unauthorized requests', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
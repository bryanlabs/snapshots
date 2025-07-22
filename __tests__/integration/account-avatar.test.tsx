import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AccountPage from '@/app/account/page';
import { ToastProvider } from '@/components/ui/toast';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();
const mockUpdate = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe('Account Page Avatar Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    (global.fetch as jest.Mock).mockReset();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ToastProvider>
        {component}
      </ToastProvider>
    );
  };

  it('should display profile picture section', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: mockUpdate,
    } as any);

    renderWithProviders(<AccountPage />);

    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    expect(screen.getByText('Customize your profile picture')).toBeInTheDocument();
    expect(screen.getByText('Upload Picture')).toBeInTheDocument();
  });

  it('should show remove button when user has avatar', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
          avatarUrl: '/avatars/test.jpg',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: mockUpdate,
    } as any);

    renderWithProviders(<AccountPage />);

    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('should handle avatar upload successfully', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: mockUpdate,
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        avatarUrl: '/avatars/new-avatar.jpg',
      }),
    });

    renderWithProviders(<AccountPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/account/avatar', {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(mockUpdate).toHaveBeenCalled();
    });

    expect(screen.getByText('Profile picture updated successfully')).toBeInTheDocument();
  });

  it('should handle avatar upload errors', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: mockUpdate,
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'File too large',
      }),
    });

    renderWithProviders(<AccountPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });

  it('should handle avatar deletion', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
          avatarUrl: '/avatars/test.jpg',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: mockUpdate,
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders(<AccountPage />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/account/avatar', {
        method: 'DELETE',
      });
      expect(mockUpdate).toHaveBeenCalled();
    });

    expect(screen.getByText('Profile picture removed')).toBeInTheDocument();
  });

  it('should disable buttons during upload', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
          avatarUrl: '/avatars/test.jpg',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: mockUpdate,
    } as any);

    // Mock a slow response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true }),
      }), 100))
    );

    renderWithProviders(<AccountPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check that button text changes and is disabled
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    const uploadButton = screen.getByText('Uploading...').closest('button');
    const removeButton = screen.getByText('Remove').closest('button');
    
    expect(uploadButton).toBeDisabled();
    expect(removeButton).toBeDisabled();
  });
});
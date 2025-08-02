import { render, screen } from '@testing-library/react';
import { UpgradePrompt } from '../UpgradePrompt';

describe('UpgradePrompt', () => {
  describe('inline variant', () => {
    it('should render inline upgrade prompt', () => {
      render(<UpgradePrompt variant="inline" />);
      
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
      expect(screen.getByText('for 5x faster downloads')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /upgrade to premium/i })).toHaveAttribute('href', '/premium');
    });
  });

  describe('banner variant', () => {
    it('should render banner upgrade prompt', () => {
      render(<UpgradePrompt variant="banner" />);
      
      expect(screen.getByText('Premium users get 250 Mbps download speeds!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /upgrade now/i })).toHaveAttribute('href', '/premium');
    });
  });

  describe('card variant (default)', () => {
    it('should render card upgrade prompt by default', () => {
      render(<UpgradePrompt />);
      
      expect(screen.getByText('Unlock Premium Benefits')).toBeInTheDocument();
      expect(screen.getByText('250 Mbps download speeds (5x faster)')).toBeInTheDocument();
      expect(screen.getByText('Custom snapshots from any block height')).toBeInTheDocument();
      expect(screen.getByText('Priority queue bypass')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get premium access/i })).toHaveAttribute('href', '/premium');
    });

    it('should render card upgrade prompt when explicitly specified', () => {
      render(<UpgradePrompt variant="card" />);
      
      expect(screen.getByText('Unlock Premium Benefits')).toBeInTheDocument();
    });
  });

  describe('styling and classes', () => {
    it('should apply custom className', () => {
      const { container } = render(<UpgradePrompt className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have proper gradient styling for banner', () => {
      const { container } = render(<UpgradePrompt variant="banner" />);
      
      expect(container.firstChild).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-blue-600');
    });

    it('should have proper gradient styling for card', () => {
      const { container } = render(<UpgradePrompt variant="card" />);
      
      expect(container.firstChild).toHaveClass('bg-gradient-to-br', 'from-purple-50', 'to-blue-50');
    });
  });

  describe('accessibility', () => {
    it('should have proper link accessibility for inline variant', () => {
      render(<UpgradePrompt variant="inline" />);
      
      const link = screen.getByRole('link', { name: /upgrade to premium/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/premium');
    });

    it('should have proper link accessibility for banner variant', () => {
      render(<UpgradePrompt variant="banner" />);
      
      const link = screen.getByRole('link', { name: /upgrade now/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/premium');
    });

    it('should have proper link accessibility for card variant', () => {
      render(<UpgradePrompt variant="card" />);
      
      const link = screen.getByRole('link', { name: /get premium access/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/premium');
    });
  });
});
import { render, screen } from '@testing-library/react';
import NetworkPage from '../../app/network/page';

describe('NetworkPage', () => {
  it('should render the network page with all key sections', () => {
    render(<NetworkPage />);

    // Check hero section
    expect(screen.getByText('Global Network Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Enterprise-grade connectivity powered by DACS-IX peering fabric')).toBeInTheDocument();

    // Check main sections
    expect(screen.getByText('Powered by DACS-IX')).toBeInTheDocument();
    expect(screen.getByText('Direct Peering Partners')).toBeInTheDocument();
    expect(screen.getByText('Technical Specifications')).toBeInTheDocument();

    // Check key infrastructure details - use getAllByText for multiple occurrences
    expect(screen.getAllByText('AS 401711').length).toBeGreaterThan(0);
    expect(screen.getByText('12401 Prosperity Dr, Silver Spring, MD 20904')).toBeInTheDocument();
    expect(screen.getByText('(410) 760-3447')).toBeInTheDocument();
  });

  it('should display major cloud providers', () => {
    render(<NetworkPage />);

    // Check for major cloud providers
    expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
    expect(screen.getByText('Cloudflare')).toBeInTheDocument();
  });

  it('should display internet exchanges', () => {
    render(<NetworkPage />);

    // Check for internet exchanges
    expect(screen.getByText(/Equinix Internet Exchange/)).toBeInTheDocument();
    expect(screen.getByText(/New York International Internet Exchange/)).toBeInTheDocument();
    expect(screen.getByText(/Fremont Cabal Internet Exchange/)).toBeInTheDocument();
  });

  it('should display data center locations', () => {
    render(<NetworkPage />);

    // Check for data center locations - using more specific text matching
    expect(screen.getByText('Ashburn, VA - Primary peering hub')).toBeInTheDocument();
    expect(screen.getByText('Reston, VA - Secondary connectivity')).toBeInTheDocument();
    expect(screen.getByText('Baltimore, MD - Regional presence')).toBeInTheDocument();
    expect(screen.getByText('Silver Spring, MD - Operations center')).toBeInTheDocument();
  });

  it('should display port speeds', () => {
    render(<NetworkPage />);

    // Check for port speeds
    expect(screen.getByText('1 Gbps')).toBeInTheDocument();
    expect(screen.getByText('10 Gbps')).toBeInTheDocument();
    expect(screen.getByText('40 Gbps')).toBeInTheDocument();
    expect(screen.getByText('100 Gbps')).toBeInTheDocument();
  });

  it('should have ARIN registry link', () => {
    render(<NetworkPage />);

    const arinLink = screen.getByText('ARIN Registry →');
    expect(arinLink).toBeInTheDocument();
    expect(arinLink.closest('a')).toHaveAttribute('href', 'https://whois.arin.net/rest/asn/AS401711');
    expect(arinLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('should have call-to-action buttons', () => {
    render(<NetworkPage />);

    const browseButton = screen.getByRole('link', { name: 'Browse Snapshots' });
    expect(browseButton).toHaveAttribute('href', '/');

    const contactButton = screen.getByRole('link', { name: 'Contact Sales' });
    expect(contactButton).toHaveAttribute('href', '/contact');
  });

  it('should be accessible with proper heading structure', () => {
    render(<NetworkPage />);

    // Check heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Global Network Infrastructure');

    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.length).toBeGreaterThan(0);
  });
});
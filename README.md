# Blockchain Snapshots - Next.js App

A professional blockchain snapshots application built with Next.js 15, following the BryanLabs design style and branding.

## 🚀 Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Inter Font** for typography (matching BryanLabs style)

## 🎨 Features

- **Professional Design** matching BryanLabs aesthetic
- **Fully Responsive** layout that works on all devices
- **Interactive Search Bar** for finding blockchain chains
- **Statistics Display** showing key metrics (30+ Chains, Daily Updates, 99.9% Uptime)
- **Modern Typography** using Inter font family
- **Smooth Animations** and hover effects
- **SEO Optimized** with proper metadata
- **Accessibility** features built-in

## 🏗️ Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with Inter font and metadata
│   ├── page.tsx            # Hero section implementation
│   ├── globals.css         # Global styles with Tailwind and custom properties
│   └── favicon.ico         # Site favicon
├── public/
│   ├── bryanlabs-logo.svg  # BryanLabs logo
│   └── bryanlabs_banner.png # Banner image
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.*       # Tailwind CSS configuration
└── next.config.ts          # Next.js configuration
```

## 🎯 Design Elements

### Typography

- **Primary Font**: Inter (Google Fonts)
- **Hero Title**: 4xl-7xl responsive, weight 800
- **Subtitle**: xl-2xl responsive, weight 400
- **Features**: Clean bullet-separated list

### Color Scheme

- **Background**: Gradient from slate-50 to slate-100
- **Text**: Professional grays (#1a1a1a primary, #4b5563 secondary)
- **Accent**: Blue (#3b82f6) for interactive elements
- **Borders**: Light gray (#e5e7eb)

### Layout

- **Centered Content** with responsive max-widths
- **Grid-Based Statistics** (3 columns desktop, 1 column mobile)
- **Sticky Navigation** with backdrop blur effect
- **Prominent Search** with icon and focus states

## 🧩 Key Components

### Navigation

- Sticky header with backdrop blur
- BryanLabs logo and brand name
- Clean navigation links that hide on mobile
- Smooth hover transitions

### Hero Section

- Bold "Blockchain Snapshots" title
- Descriptive subtitle about Cosmos ecosystem
- Feature highlights: "Updated daily • Pruned options available • Global CDN delivery"
- Interactive search bar with search icon
- Statistics grid showing key metrics

### Responsive Design

- **Desktop**: Full navigation, large typography, 3-column stats
- **Tablet**: Hidden navigation menu, medium typography
- **Mobile**: Single column layout, optimized touch targets

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Development Server**

   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🛠️ Customization

### Update Colors

Edit the CSS custom properties in `app/globals.css`:

```css
:root {
  --foreground: #1a1a1a; /* Primary text */
  --muted-foreground: #4b5563; /* Secondary text */
  --accent: #3b82f6; /* Interactive elements */
  --border: #e5e7eb; /* Borders */
}
```

### Update Content

Modify the hero section in `app/page.tsx`:

- Change statistics in the `HeroStats` component
- Update feature bullets in the hero section
- Modify navigation links in the `Navigation` component

### Update Branding

- Replace `public/bryanlabs-logo.svg` with your logo
- Update metadata in `app/layout.tsx`
- Modify the brand name in the navigation

## 🌐 SEO & Metadata

The app includes comprehensive SEO optimization:

- **Title**: "Blockchain Snapshots - BryanLabs"
- **Description**: Optimized for search engines
- **Keywords**: blockchain, snapshots, cosmos, cosmos-sdk, devops
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Twitter sharing optimization

## 📱 Browser Support

- **Chrome/Edge**: Full support with latest features
- **Firefox**: Full support
- **Safari**: Full support with webkit optimizations
- **Mobile**: Optimized responsive experience

## 🎨 BryanLabs Style Guide

This implementation follows BryanLabs' design principles:

- **Professional & Clean**: Minimal, focused design
- **Technical Authority**: Bold typography and clear messaging
- **Trust & Reliability**: Statistics and feature highlights
- **Modern & Responsive**: Works perfectly on all devices
- **Performance Focused**: Optimized with Next.js 15 and Tailwind CSS

The hero section captures BryanLabs' **professional, technical expertise** while providing a **clean, modern interface** for blockchain snapshot services.

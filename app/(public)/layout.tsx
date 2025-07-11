import { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Public routes don't require authentication */}
      {children}
    </>
  );
}
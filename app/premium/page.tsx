import { redirect } from 'next/navigation';

export default function PremiumPage() {
  // Redirect to new pricing page
  redirect('/pricing');
}
import { ReactNode } from 'react';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Parlour Portal - Aestheticsupplypk',
} as const;

export default function ParlourPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

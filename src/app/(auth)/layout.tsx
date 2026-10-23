import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EventEase — Sign In',
  description: 'Sign in to EventEase AI Event Planning Assistant.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      {children}
    </div>
  );
}

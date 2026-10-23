import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventEase — AI Event Planning Assistant',
  description: 'Smart context-aware organizer for weddings, birthdays, and community events with deterministic budget tracking and Plan Stress Test.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#F8FAFC] text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}

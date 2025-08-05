import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Decision Tree Platform - Medical Algorithm Management',
  description: 'Comprehensive platform for managing medical decision trees, templates, and algorithms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
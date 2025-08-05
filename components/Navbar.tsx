'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreePine, Settings, Database, Brain } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-white hover:text-white/80 transition-colors">
          <TreePine className="h-8 w-8" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Decision Tree Platform</h1>
            <p className="text-sm text-white/70">Medical Algorithm Management</p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive('/') 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Database className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            href="/builder"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive('/builder') 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Brain className="h-5 w-5" />
            <span className="font-medium">Algorithm Builder</span>
          </Link>

          <Link
            href="/cms"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive('/cms') 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">CMS</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
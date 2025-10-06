'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center space-x-8">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Spec-This</h1>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/' || pathname.startsWith('/epics')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Epics
            </Link>
            <div className="relative">
              <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed inline-flex items-center">
                Repos
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                  Coming Soon
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

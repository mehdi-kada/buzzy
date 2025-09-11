'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';

const Navigation = () => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Upload', path: '/upload' },
    { name: 'Projects', path: '/projects' },
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 dark:bg-gray-950/80 border-b border-amber-100 dark:border-amber-900/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Buzzler
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={[
                    'relative px-1 pt-1 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-gray-600 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-300',
                  ].join(' ')}
                >
                  {item.name}
                  <span
                    className={[
                      'absolute left-0 -bottom-1 h-0.5 rounded-full transition-all',
                      isActive ? 'w-full bg-amber-600' : 'w-0 bg-transparent group-hover:w-full',
                    ].join(' ')}
                  />
                </Link>
              );
            })}
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
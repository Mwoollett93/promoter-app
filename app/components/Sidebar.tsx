'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-[#0f172a] text-gray-200 flex flex-col justify-between p-4">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2 mb-8">
          <Image
          src="/logo.png"
          alt="Logo"
          width={32}
          height={32}
          priority
          sizes="32px"
          />

          <h1 className="text-lg font-bold">PromoterPro</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-4">
          <Link href="/dashboard" className="hover:text-orange-400">Dashboard</Link>
          <Link href="/artists" className="hover:text-orange-400">Artists</Link>
          <Link href="/venues" className="hover:text-orange-400">Venues</Link>
          <Link href="/events" className="hover:text-orange-400">Events</Link>
          <Link href="/risk-calculator" className="hover:text-orange-400">Risk Calculator</Link>
          <Link href="/analytics" className="hover:text-orange-400">Analytics</Link>
        </nav>
      </div>

      {/* Quick Stats Section */}
      <div className="text-sm space-y-1">
        <p className="text-green-400">Active Events: 3</p>
        <p className="text-yellow-400">This Month Revenue: $42K</p>
        <p className="text-purple-400">Artists Managed: 12</p>
      </div>
    </div>
  );
}

'use client';

import Sidebar from '@/app/components/Sidebar'

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#1e293b] text-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-gray-400">Here&apos;s your music promotion overview</p>

        {/* Placeholder sections */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0f172a] p-6 rounded-xl">Active Events</div>
          <div className="bg-[#0f172a] p-6 rounded-xl">Total Revenue</div>
          <div className="bg-[#0f172a] p-6 rounded-xl">Artists Managed</div>
          <div className="bg-[#0f172a] p-6 rounded-xl">Average Risk</div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-[#0f172a] p-6 rounded-xl">Revenue Trends (Chart Placeholder)</div>
          <div className="bg-[#0f172a] p-6 rounded-xl">Calendar</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#0f172a] p-6 rounded-xl">Upcoming Events</div>
          <div className="bg-[#0f172a] p-6 rounded-xl">Top Artists</div>
        </div>
      </main>
    </div>
  );
}

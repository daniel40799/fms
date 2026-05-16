// @ts-nocheck
import React from 'react';

export interface UserProfile {
  name: string;
  role: string;
  imageUrl: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface PageHeaderWithAvatarAndStatsProps {
  user?: UserProfile;
  stats?: StatItem[];
  className?: string;
}

export function PageHeaderWithAvatarAndStats({
  user,
  stats = [],
  className,
}: PageHeaderWithAvatarAndStatsProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <h2 id="profile-overview-title" className="sr-only">
        Profile Overview
      </h2>
      <div className="bg-white p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex sm:space-x-5">
            <div className="flex-shrink-0">
              <img alt="" src={user?.imageUrl} className="mx-auto h-20 w-20 rounded-full" />
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-sm font-medium text-gray-600">Welcome back,</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{user?.name}</p>
              <p className="text-sm font-medium text-gray-600">{user?.role}</p>
            </div>
          </div>
          <div className="mt-5 flex justify-center sm:mt-0">
            <a
              href="#"
              className="flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              View profile
            </a>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 py-5 text-center text-sm font-medium">
            <span className="text-gray-900">{stat.value}</span> <span className="text-gray-600">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageHeaderWithAvatarAndStats;
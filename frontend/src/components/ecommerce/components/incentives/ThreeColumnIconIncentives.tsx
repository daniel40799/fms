// @ts-nocheck
import React from 'react';
import { CalendarIcon, CheckBadgeIcon, TruckIcon } from '@heroicons/react/24/outline'

export interface IncentiveItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface ThreeColumnIconIncentivesProps {
  incentives?: IncentiveItem[];
  className?: string;
}

export function ThreeColumnIconIncentives({
  incentives = [],
  className,
}: ThreeColumnIconIncentivesProps) {
  return (
    <div className="bg-white">
      <h2 className="sr-only">Why you should buy from us</h2>
      <div className="flex overflow-x-auto">
        <div className="mx-auto flex space-x-12 whitespace-nowrap px-4 py-3 sm:px-6 lg:space-x-24 lg:px-8">
          {incentives.map((incentive) => (
            <div key={incentive.name} className="flex items-center text-sm font-medium text-indigo-600">
              <incentive.icon aria-hidden="true" className="mr-2 h-6 w-6 flex-none" />
              <p>{incentive.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThreeColumnIconIncentives;
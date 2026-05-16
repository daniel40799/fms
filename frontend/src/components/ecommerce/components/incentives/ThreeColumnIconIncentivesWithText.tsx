// @ts-nocheck
import React from 'react';
import { ArrowPathIcon, CalendarIcon, TruckIcon } from '@heroicons/react/24/outline'

export interface PerkItem {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface ThreeColumnIconIncentivesWithTextProps {
  perks?: PerkItem[];
  className?: string;
}

export function ThreeColumnIconIncentivesWithText({
  perks = [],
  className,
}: ThreeColumnIconIncentivesWithTextProps) {
  return (
    <div className="bg-white">
      <h2 className="sr-only">Our perks</h2>
      <div className="mx-auto max-w-7xl divide-y divide-gray-200 lg:flex lg:justify-center lg:divide-x lg:divide-y-0 lg:py-8">
        {perks.map((perk, perkIdx) => (
          <div key={perkIdx} className="py-8 lg:w-1/3 lg:flex-none lg:py-0">
            <div className="mx-auto flex max-w-xs items-center px-4 lg:max-w-none lg:px-8">
              <perk.icon aria-hidden="true" className="h-8 w-8 flex-shrink-0 text-indigo-600" />
              <div className="ml-4 flex flex-auto flex-col-reverse">
                <h3 className="font-medium text-gray-900">{perk.name}</h3>
                <p className="text-sm text-gray-500">{perk.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThreeColumnIconIncentivesWithText;
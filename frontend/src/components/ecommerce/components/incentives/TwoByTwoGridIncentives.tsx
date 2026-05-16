// @ts-nocheck
import React from 'react';

export interface PerkItem {
  name: string;
  imageSrc: string;
  description: string;
}

export interface TwoByTwoGridIncentivesProps {
  perks?: PerkItem[];
  className?: string;
}

export function TwoByTwoGridIncentives({
  perks = [],
  className,
}: TwoByTwoGridIncentivesProps) {
  return (
    <div className="bg-gray-50">
      <h2 className="sr-only">Our perks</h2>
      <div className="mx-auto max-w-7xl py-24 sm:px-2 sm:py-32 lg:px-4">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 px-4 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {perks.map((perk) => (
            <div key={perk.name} className="sm:flex">
              <div className="sm:flex-shrink-0">
                <div className="flow-root">
                  <img alt="" src={perk.imageSrc} className="h-24 w-28" />
                </div>
              </div>
              <div className="mt-3 sm:ml-3 sm:mt-0">
                <h3 className="text-sm font-medium text-gray-900">{perk.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{perk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TwoByTwoGridIncentives;
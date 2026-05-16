// @ts-nocheck
import React from 'react';

export interface IncentiveItem {
  name: string;
  description: string;
  imageSrc: string;
}

export interface FourColumnIllustrationIncentivesProps {
  incentives?: IncentiveItem[];
  className?: string;
}

export function FourColumnIllustrationIncentives({
  incentives = [],
  className,
}: FourColumnIllustrationIncentivesProps) {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {incentives.map((incentive) => (
            <div key={incentive.name}>
              <img alt="" src={incentive.imageSrc} className="h-24 w-auto" />
              <h3 className="mt-6 text-sm font-medium text-gray-900">{incentive.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{incentive.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FourColumnIllustrationIncentives;
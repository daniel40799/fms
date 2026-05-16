// @ts-nocheck
import React from 'react';

export interface SideItem {
  id: number;
  name: string;
}

export interface SimpleListWithRadioOnRightProps {
  sides?: SideItem[];
  className?: string;
}

export function SimpleListWithRadioOnRight({
  sides = [],
  className,
}: SimpleListWithRadioOnRightProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold leading-6 text-gray-900">Select a side</legend>
      <div className="mt-4 divide-y divide-gray-200 border-b border-t border-gray-200">
        {sides.map((side, sideIdx) => (
          <div key={sideIdx} className="relative flex items-start py-4">
            <div className="min-w-0 flex-1 text-sm leading-6">
              <label htmlFor={`side-${side.id}`} className="select-none font-medium text-gray-900">
                {side.name}
              </label>
            </div>
            <div className="ml-3 flex h-6 items-center">
              <input
                defaultChecked={side.id === null}
                id={`side-${side.id}`}
                name="plan"
                type="radio"
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default SimpleListWithRadioOnRight;
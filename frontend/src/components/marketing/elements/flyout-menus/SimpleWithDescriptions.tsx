// @ts-nocheck
import React from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export interface SolutionItem {
  name: string;
  description: string;
  href: string;
}

export interface SimpleWithDescriptionsProps {
  solutions?: SolutionItem[];
  className?: string;
}

export function SimpleWithDescriptions({
  solutions = [],
  className,
}: SimpleWithDescriptionsProps) {
  return (
    <Popover className="relative">
      <PopoverButton className="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
        <span>Solutions</span>
        <ChevronDownIcon aria-hidden="true" className="h-5 w-5" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 px-4 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="w-screen max-w-sm flex-auto rounded-3xl bg-white p-4 text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
          {solutions.map((item) => (
            <div key={item.name} className="relative rounded-lg p-4 hover:bg-gray-50">
              <a href={item.href} className="font-semibold text-gray-900">
                {item.name}
                <span className="absolute inset-0" />
              </a>
              <p className="mt-1 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </PopoverPanel>
    </Popover>
  );
}

export default SimpleWithDescriptions;
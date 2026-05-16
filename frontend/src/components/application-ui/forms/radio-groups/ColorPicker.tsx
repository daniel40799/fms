// @ts-nocheck
'use client'

import React, { useState } from 'react';
import { Radio, RadioGroup } from '@headlessui/react'

export interface OptionItem {
  name: string;
  color: string;
}

export interface ColorPickerProps {
  options?: OptionItem[];
  className?: string;
}

export function ColorPicker({
  options = [],
  className,
}: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(options[1]);

  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <fieldset>
      <legend className="block text-sm font-semibold leading-6 text-gray-900">Choose a label color</legend>
      <RadioGroup value={selectedColor} onChange={setSelectedColor} className="mt-6 flex items-center space-x-3">
        {options.map((option) => (
          <Radio
            key={option.name}
            value={option}
            aria-label={option.name}
            className={classNames(
              option.color,
              'relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 ring-current focus:outline-none data-[checked]:ring-2 data-[focus]:data-[checked]:ring data-[focus]:data-[checked]:ring-offset-1',
            )}
          >
            <span
              aria-hidden="true"
              className="h-8 w-8 rounded-full border border-black border-opacity-10 bg-current"
            />
          </Radio>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

export default ColorPicker;
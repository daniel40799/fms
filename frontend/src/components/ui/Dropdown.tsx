import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export interface DropdownItem {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerBefore?: boolean;
}

export interface DropdownProps {
  label: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
  variant?: 'default' | 'minimal';
  className?: string;
}

export function Dropdown({
  label,
  items,
  align = 'right',
  variant = 'default',
  className = '',
}: DropdownProps) {
  void className;
  void items;
  const alignClasses = align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right';

  const buttonClasses =
    variant === 'minimal'
      ? 'inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-slate-900 transition-colors duration-150 ease-out hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:text-slate-100 dark:hover:text-sky-300 dark:focus-visible:outline-sky-400 motion-reduce:transition-none'
      : 'inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition-all duration-150 ease-out hover:bg-slate-50 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800 dark:focus-visible:outline-sky-400 motion-reduce:transition-none motion-reduce:active:scale-100';

  // Group items by dividers
  const groups: DropdownItem[][] = [];
  let current: DropdownItem[] = [];
  for (const item of items) {
    if (item.dividerBefore && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(item);
  }
  if (current.length > 0) groups.push(current);

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <MenuButton className={buttonClasses}>
        {label}
        <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-slate-400 dark:text-slate-500" />
      </MenuButton>

      <MenuItems
        transition
        className={`absolute ${alignClasses} z-10 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none dark:border-slate-700 dark:bg-slate-900 data-[closed]:-translate-y-1 data-[closed]:scale-[0.98] data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-[160ms] data-[leave]:duration-[120ms] data-[enter]:ease-out data-[leave]:ease-in motion-reduce:transition-none`}
      >
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'border-t border-slate-100 py-1 dark:border-slate-700' : 'py-1'}>
            {group.map((item) => (
              <MenuItem key={item.label} disabled={item.disabled}>
                {item.href ? (
                  <a
                    href={item.href}
                    className={`block px-4 py-2 text-sm data-[focus]:bg-slate-100 data-[focus]:text-slate-950 dark:data-[focus]:bg-slate-800 dark:data-[focus]:text-white ${
                      item.danger ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-100'
                    } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`block w-full px-4 py-2 text-left text-sm data-[focus]:bg-slate-100 data-[focus]:text-slate-950 dark:data-[focus]:bg-slate-800 dark:data-[focus]:text-white ${
                      item.danger ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-100'
                    } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        ))}
      </MenuItems>
    </Menu>
  );
}

export default Dropdown;

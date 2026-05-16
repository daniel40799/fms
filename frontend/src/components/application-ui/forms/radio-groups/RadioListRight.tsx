// @ts-nocheck
import React from 'react';

export interface AccountItem {
  id: number;
  name: string;
  description: string;
}

export interface RadioListRightProps {
  accounts?: AccountItem[];
  className?: string;
}

export function RadioListRight({
  accounts = [],
  className,
}: RadioListRightProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold leading-6 text-gray-900">Transfer Funds</legend>
      <p className="mt-1 text-sm leading-6 text-gray-600">Transfer your balance to your bank account.</p>
      <div className="mt-2.5 divide-y divide-gray-200">
        {accounts.map((account, accountIdx) => (
          <div key={accountIdx} className="relative flex items-start pb-4 pt-3.5">
            <div className="min-w-0 flex-1 text-sm leading-6">
              <label htmlFor={`account-${account.id}`} className="font-medium text-gray-900">
                {account.name}
              </label>
              <p id={`account-${account.id}-description`} className="text-gray-500">
                {account.description}
              </p>
            </div>
            <div className="ml-3 flex h-6 items-center">
              <input
                defaultChecked={account.id === 'checking'}
                id={`account-${account.id}`}
                name="account"
                type="radio"
                aria-describedby={`account-${account.id}-description`}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default RadioListRight;
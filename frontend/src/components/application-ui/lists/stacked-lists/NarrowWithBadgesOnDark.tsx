// @ts-nocheck
import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid'

export interface StatuseItem {
  offline: string;
  online: boolean;
  error: string;
}

export interface EnvironmentItem {
  [key: string]: unknown;
}

export interface DeploymentItem {
  id: number;
  href: string;
  projectName: string;
  teamName: string;
  status: string;
  statusText: string;
  description: string;
  environment: string;
}

export interface NarrowWithBadgesOnDarkProps {
  statuses?: StatuseItem;
  environments?: EnvironmentItem;
  deployments?: DeploymentItem[];
  className?: string;
}

export function NarrowWithBadgesOnDark({
  statuses,
  environments,
  deployments = [],
  className,
}: NarrowWithBadgesOnDarkProps) {
  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <ul role="list" className="divide-y divide-white/5">
      {deployments.map((deployment) => (
        <li key={deployment.id} className="relative flex items-center space-x-4 py-4">
          <div className="min-w-0 flex-auto">
            <div className="flex items-center gap-x-3">
              <div className={classNames(statuses[deployment.status], 'flex-none rounded-full p-1')}>
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>
              <h2 className="min-w-0 text-sm font-semibold leading-6 text-white">
                <a href={deployment.href} className="flex gap-x-2">
                  <span className="truncate">{deployment.teamName}</span>
                  <span className="text-gray-400">/</span>
                  <span className="whitespace-nowrap">{deployment.projectName}</span>
                  <span className="absolute inset-0" />
                </a>
              </h2>
            </div>
            <div className="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-400">
              <p className="truncate">{deployment.description}</p>
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 flex-none fill-gray-300">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p className="whitespace-nowrap">{deployment.statusText}</p>
            </div>
          </div>
          <div
            className={classNames(
              environments[deployment.environment],
              'flex-none rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
            )}
          >
            {deployment.environment}
          </div>
          <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
        </li>
      ))}
    </ul>
  );
}

export default NarrowWithBadgesOnDark;
import { statusTone } from '../../lib/status';

export function Stat({ label, value, tone = 'INFORMATION' }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm ring-1 ring-inset transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-4 ${statusTone(tone)}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80 sm:text-sm sm:normal-case sm:tracking-normal">{label}</p>
      <p className="mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl">{value}</p>
    </div>
  )
}

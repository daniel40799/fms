import { statusTone } from '../../lib/status'

export function Stat({ label, value, tone = 'INFORMATION' }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ring-1 ring-inset transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${statusTone(tone)}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

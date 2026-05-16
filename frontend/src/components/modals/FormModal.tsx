import type { ReactNode } from 'react'
import { AnimatedDialog } from './AnimatedDialog'

export function FormModal({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatedDialog isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </AnimatedDialog>
  )
}

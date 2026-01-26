import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: Toast = { ...props, id, open: true }
      setToasts((current) => [...current, newToast])

      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id))
      }, 5000)

      return {
        id,
        dismiss: () => setToasts((current) => current.filter((t) => t.id !== id)),
      }
    },
    []
  )

  return { toasts, toast }
}

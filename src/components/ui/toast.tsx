import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'

export function Toast({ open, onOpenChange, title, description }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
}) {
  return (
    <ToastPrimitives.Provider swipeDirection="right">
      <ToastPrimitives.Root open={open} onOpenChange={onOpenChange} className="bg-white text-gray-900 border shadow rounded p-4 fixed bottom-4 right-4 z-50">
        <ToastPrimitives.Title className="font-bold mb-1">{title}</ToastPrimitives.Title>
        {description && <ToastPrimitives.Description>{description}</ToastPrimitives.Description>}
      </ToastPrimitives.Root>
      <ToastPrimitives.Viewport />
    </ToastPrimitives.Provider>
  )
} 
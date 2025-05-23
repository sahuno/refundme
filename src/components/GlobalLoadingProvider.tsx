"use client"

import { ReactNode, createContext, useContext, useState } from 'react'

const LoadingContext = createContext<{ loading: boolean; setLoading: (v: boolean) => void }>({ loading: false, setLoading: () => {} })

export function useGlobalLoading() {
  return useContext(LoadingContext)
}

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  )
} 
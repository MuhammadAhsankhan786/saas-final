'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearSessionPage() {
  const router = useRouter()

  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_ROUTES === 'true'
    if (!enabled) {
      if (typeof window !== 'undefined') {
        // Inform the user and navigate home if debug routes are disabled
        alert('Debug routes are disabled. Set NEXT_PUBLIC_ENABLE_DEBUG_ROUTES=true to enable.')
        router.replace('/')
      }
      return
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } catch {}

    router.replace('/login')
  }, [router])

  return null
}



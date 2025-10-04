'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/menu')
  }, [router])

  return (
    <div className='relative h-screen w-screen overflow-hidden bg-black flex items-center justify-center'>
      <div className='text-white text-[10px] font-[family-name:var(--font-press-start)] animate-pulse'>
        LOADING...
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function NBLPage() {
  const router = useRouter()

  return (
    <div className='relative h-screen w-screen overflow-hidden bg-black flex items-center justify-center'>
      {/* Background Stars */}
      <div 
        className='absolute inset-0 opacity-30'
        style={{
          backgroundImage: 'radial-gradient(#333333 1px, transparent 0), radial-gradient(#333333 1px, transparent 0)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 4px 4px',
          animation: 'starField 300s linear infinite'
        }}
      />

      <style jsx>{`
        @keyframes starField {
          from { background-position: 0 0, 4px 4px; }
          to { background-position: 100px 100px, 104px 104px; }
        }
      `}</style>

      {/* Back Button */}
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => router.push('/menu')}
        className='absolute top-6 left-6 z-50 bg-black border-2 border-zinc-700 px-4 py-3 shadow-[0_0_0_4px_#000000] hover:border-cyan-500 transition-all group'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className='flex items-center gap-2'>
          <span className='text-orange-500 text-[10px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>{'<'}</span>
          <span className='text-white text-[8px] font-[family-name:var(--font-press-start)] tracking-wider group-hover:text-cyan-500'>MENU</span>
        </div>
      </motion.button>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='relative z-10 text-center'
      >
        <h1 className='text-white text-[16px] font-[family-name:var(--font-press-start)] mb-4 tracking-wider border-b-2 border-cyan-500 pb-2'>
          NBL GAME
        </h1>
        <p className='text-zinc-600 text-[8px] font-[family-name:var(--font-press-start)] mt-4'>
          COMING SOON...
        </p>
      </motion.div>
    </div>
  )
}

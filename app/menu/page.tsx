'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const menuOptions = [
  { id: 1, label: 'START GAME (NBL)', action: 'nbl' },
  { id: 2, label: 'GO TO CUPOLA', action: 'cupola' },
]

export default function MenuPage() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()

      switch (event.key) {
        case 'ArrowUp':
          setSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length)
          break
        case 'ArrowDown':
          setSelectedIndex((prev) => (prev + 1) % menuOptions.length)
          break
        case 'Enter':
          selectOption()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex])

  const selectOption = () => {
    const selected = menuOptions[selectedIndex]
    if (selected.action === 'cupola') {
      router.push('/cupola')
    } else if (selected.action === 'nbl') {
      router.push('/nbl')
    }
  }

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
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

      {/* Menu Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='relative z-10 w-[90%] max-w-[450px] p-5 text-center border-2 border-zinc-600 shadow-[0_0_0_4px_#000000]'
      >
        {/* Title */}
        <h1 className='text-white text-[16px] font-[family-name:var(--font-press-start)] mb-1 tracking-wider border-b-2 border-cyan-500 pb-1'>
          ORBITAL WRENCH!
        </h1>

        {/* Subtitle */}
        <div className='text-zinc-600 text-[7px] font-[family-name:var(--font-press-start)] mt-2 mb-8'>
          M.E. PROTOCOL 86 | BEYOND GRAVITY
        </div>

        {/* Menu Options */}
        <div className='flex flex-col gap-0'>
          {menuOptions.map((option, index) => (
            <motion.div
              key={option.id}
              onClick={() => {
                setSelectedIndex(index)
                selectOption()
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                text-[10px] font-[family-name:var(--font-press-start)] py-2 px-0 cursor-pointer transition-all
                ${selectedIndex === index 
                  ? 'bg-zinc-800 text-white border border-cyan-500' 
                  : 'text-zinc-600 hover:text-cyan-500'
                }
              `}
              style={{ textRendering: 'geometricPrecision' }}
            >
              {selectedIndex === index && (
                <>
                  <span className='text-orange-500 mr-1 inline-block' style={{ animation: 'blink 0.5s step-start infinite' }}>
                    {'>'}
                  </span>
                  [ {option.label} ]
                  <span className='text-orange-500 ml-1 inline-block' style={{ animation: 'blink 0.5s step-start infinite' }}>
                    {'<'}
                  </span>
                </>
              )}
              {selectedIndex !== index && (
                <span>[ {option.label} ]</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className='mt-12 pt-2 border-t-2 border-zinc-800 flex justify-between text-[7px] font-[family-name:var(--font-press-start)] text-zinc-800'>
          <div className='text-left'>
            COMMS: <span className='text-cyan-500'>ONLINE</span><br />
            ENERGY: <span className='text-cyan-500'>100%</span>
          </div>
          <div className='text-right'>
            SELECTED TOOL: <span className='text-orange-500'>ADJUSTABLE</span><br />
            PRESS [<span className='text-cyan-500'>ENTER</span>]
          </div>
        </div>
      </motion.div>
    </div>
  )
}

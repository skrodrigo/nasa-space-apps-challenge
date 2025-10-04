'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Particles from '@/components/Particles'
import { motion, AnimatePresence } from 'framer-motion'

const spaceBackgrounds = [
  { id: 1, src: '/terra.jpg', name: 'Terra' },
  { id: 2, src: '/sol.jpg', name: 'Sol' },
  { id: 3, src: '/moon.jpg', name: 'Lua' },
  { id: 4, src: '/mars.jpg', name: 'Marte' },
]

const spaceObjects = [
  { id: 1, name: 'METEORITO' },
  { id: 3, name: 'ROCKET' },
  { id: 4, name: 'UFO' },
  { id: 5, name: 'ASTEROIDE' },
]

export default function Home() {
  const [currentBg, setCurrentBg] = useState(0)
  const [launchedObjects, setLaunchedObjects] = useState<Array<{ id: number, name: string, x: number, y: number, timestamp: number }>>([])

  const launchObject = (obj: typeof spaceObjects[0]) => {
    const newObj = {
      id: Date.now(),
      name: obj.name,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      timestamp: Date.now()
    }
    setLaunchedObjects(prev => [...prev, newObj])

    setTimeout(() => {
      setLaunchedObjects(prev => prev.filter(o => o.id !== newObj.id))
    }, 5000)
  }

  return (
    <div className='relative h-screen w-screen overflow-hidden'>
      {/* Back Button - Top Left */}
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => window.history.back()}
        className='absolute top-6 left-6 z-50 bg-black border-2 border-zinc-700 px-4 py-3 shadow-[0_0_0_4px_#000000] hover:border-cyan-500 transition-all group'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className='flex items-center gap-2'>
          <span className='text-orange-500 text-[10px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>{'<'}</span>
          <span className='text-white text-[8px] font-[family-name:var(--font-press-start)] tracking-wider group-hover:text-cyan-500'>MENU</span>
        </div>
      </motion.button>

      {/* Background Image - Layer 1 (fundo) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{
            rotate: 360,
            opacity: 1
          }}
          exit={{ opacity: 0 }}
          transition={{
            rotate: { duration: 120, repeat: Infinity, ease: "linear" },
            opacity: { duration: 0.5 }
          }}
          className='absolute inset-0 scale-110'
        >
          <Image
            src={spaceBackgrounds[currentBg].src}
            alt={spaceBackgrounds[currentBg].name}
            fill
            className='object-cover'
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Base SVG - Layer 2 (meio) */}
      <motion.div
        animate={{
          y: [0, -3, 0],
          x: [0, 2, -2, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className='absolute inset-0 scale-110'
      >
        <Image src="/base.png" quality={100} priority alt="Base" width={1920} height={1080} className='w-full h-full object-cover' />
      </motion.div>

      {/* Particles - Layer 3 (topo) */}
      <div className='absolute inset-0 pointer-events-none'>
        <Particles
          particleColors={['#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.01}
          particleBaseSize={5}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Launched Objects */}
      <AnimatePresence>
        {launchedObjects.map((obj) => (
          <motion.div
            key={obj.id}
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: [0, 1.5, 1],
              rotate: 360,
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 5, ease: "easeOut" }}
            className='absolute text-[10px] font-bold text-white pointer-events-none z-50 bg-black px-3 py-2 border-2 border-cyan-500 font-[family-name:var(--font-press-start)] shadow-[0_0_10px_rgba(0,170,170,0.5)]'
            style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
          >
            {obj.name}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Left Panel - Space Backgrounds */}
      <div className='absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3'>
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='bg-black border-2 border-zinc-700 p-4 shadow-[0_0_0_4px_#000000]'
          style={{ imageRendering: 'pixelated' }}
        >
          <h3 className='text-white text-[8px] font-bold mb-4 tracking-wider font-[family-name:var(--font-press-start)] border-b-2 border-cyan-500 pb-2'>CENÁRIOS</h3>
          <div className='flex flex-col gap-2'>
            {spaceBackgrounds.map((bg, index) => (
              <motion.button
                key={bg.id}
                onClick={() => setCurrentBg(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-2 text-[8px] tracking-wider transition-all font-[family-name:var(--font-press-start)] relative ${
                  currentBg === index
                    ? 'bg-zinc-800 text-white border border-cyan-500'
                    : 'bg-transparent text-zinc-600 hover:text-cyan-500'
                }`}
                style={{ textRendering: 'geometricPrecision' }}
              >
                {currentBg === index && (
                  <>
                    <span className='absolute left-1 text-orange-500 animate-pulse'>{'>'}</span>
                    <span className='absolute right-1 text-orange-500 animate-pulse'>{'<'}</span>
                  </>
                )}
                [ {bg.name.toUpperCase()} ]
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Space Objects */}
      <div className='absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3'>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='bg-black border-2 border-zinc-700 p-4 shadow-[0_0_0_4px_#000000]'
          style={{ imageRendering: 'pixelated' }}
        >
          <h3 className='text-white text-[8px] font-bold mb-4 tracking-wider font-[family-name:var(--font-press-start)] border-b-2 border-cyan-500 pb-2'>LANÇAR</h3>
          <div className='flex flex-col gap-2'>
            {spaceObjects.map((obj, index) => (
              <motion.button
                key={obj.id}
                onClick={() => launchObject(obj)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='px-3 py-2 text-[8px] tracking-wider transition-all font-[family-name:var(--font-press-start)] bg-transparent text-zinc-600 hover:text-cyan-500 hover:bg-zinc-800 hover:border hover:border-cyan-500 relative'
                style={{ textRendering: 'geometricPrecision' }}
              >
                <span className='opacity-0 group-hover:opacity-100 absolute left-1 text-orange-500'>{'>'}</span>
                [ {obj.name} ]
                <span className='opacity-0 group-hover:opacity-100 absolute right-1 text-orange-500'>{'<'}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
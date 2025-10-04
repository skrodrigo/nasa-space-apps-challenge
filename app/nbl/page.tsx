'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Particles from '@/components/Particles'

declare global {
  interface Window {
    nblGameInitialized?: boolean
  }
}

export default function NBLPage() {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [restarting, setRestarting] = React.useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRestart = () => {
    setRestarting(true)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  useEffect(() => {
    if (!mounted) return

    if (window.nblGameInitialized) {
      window.nblGameInitialized = false
      const container = document.getElementById('simulador-container')
      if (container) {
        const gameElements = container.querySelectorAll('.object, .caixa')
        gameElements.forEach(el => el.remove())
      }
    }

    const existingScript = document.getElementById('nbl-game-script')
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.id = 'nbl-game-script'
    script.src = '/nbl-game.js?t=' + Date.now() // Cache bust
    script.async = true
    document.body.appendChild(script)

    return () => {
      const scriptToRemove = document.getElementById('nbl-game-script')
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.remove()
      }
      if (window.nblGameInitialized) {
        window.nblGameInitialized = false
      }
    }
  }, [mounted])

  return (
    <div className='relative h-screen w-screen overflow-hidden bg-black flex items-center justify-center' suppressHydrationWarning>
      {/* Restart Fade Overlay */}
      {restarting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='absolute inset-0 z-[9999] bg-black'
        />
      )}

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

      <style jsx global>{`
        @keyframes starField {
          from { background-position: 0 0, 4px 4px; }
          to { background-position: 100px 100px, 104px 104px; }
        }
        
        .object {
          position: absolute;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
          cursor: grab;
          z-index: 100;
        }

        .object:active {
          cursor: grabbing;
        }

        .caixa {
          position: absolute;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          image-rendering: pixelated;
          z-index: 50;
        }

        .parafuso-slot {
          position: absolute;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          cursor: pointer;
        }
      `}</style>

      <div className='absolute inset-0 pointer-events-none z-5'>
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

      {mounted && (
        <>
          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/menu')}
            className='absolute top-6 left-6 z-[2000] bg-black border-2 border-zinc-700 px-4 py-3 shadow-[0_0_0_4px_#000000] hover:border-cyan-500 transition-all group'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className='flex items-center gap-2'>
              <span className='text-orange-500 text-[10px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>{'<'}</span>
              <span className='text-white text-[8px] font-[family-name:var(--font-press-start)] tracking-wider group-hover:text-cyan-500'>MENU</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleRestart}
            className='absolute top-6 left-[140px] z-[2000] bg-black border-2 border-zinc-700 px-4 py-3 shadow-[0_0_0_4px_#000000] hover:border-orange-500 transition-all group'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className='flex items-center gap-2'>
              <span className='text-cyan-500 text-[10px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>↻</span>
              <span className='text-white text-[8px] font-[family-name:var(--font-press-start)] tracking-wider group-hover:text-orange-500'>RESTART</span>
            </div>
          </motion.button>

          <div
            id="simulador-container"
            className='w-[800px] h-[600px] border-2 z-20 border-zinc-700 relative overflow-hidden bg-[#0f0f1a] shadow-[0_0_1000px_rgba(0,170,170,0.5)] cursor-default'
          >
            <div id="instrucoes" className='absolute top-2.5 left-2.5 text-white bg-black/70 px-[15px] py-2.5 rounded text-[0.6em] max-w-[300px] leading-[1.4] font-[family-name:var(--font-press-start)]'>
              <strong>MISSÃO:</strong> Abra a caixa de energia!<br />
              1. Arraste a chave até cada parafuso<br />
              2. Clique 3x em cada um para soltar<br />
              3. NÃO deixe nada sair da tela!
            </div>
            <div id="hud" className='absolute top-2.5 right-2.5 text-cyan-500 bg-black/70 px-[15px] py-2.5 rounded text-xs font-bold text-right font-[family-name:var(--font-press-start)]'>
              Parafusos: <span id="parafusos-count">4/4</span><br />
              <span id="aviso" className="text-orange-500 animate-pulse hidden">⚠ CUIDADO!</span><br />
              <small id="debug-info" className='text-[0.6em] text-zinc-600'></small>
            </div>
            <div id="vitoria" className='hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500/90 text-black px-[50px] py-[30px] rounded-lg text-xl font-bold z-[1000] font-[family-name:var(--font-press-start)]'>
              MISSÃO COMPLETA! <br />
              <small className='text-[0.4em]'>Manutenção realizada com sucesso!</small>
            </div>
            <div id="game-over" className='hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500/90 text-white px-[50px] py-[30px] rounded-lg text-xl font-bold z-[1000] font-[family-name:var(--font-press-start)]'>
              FALHA NA MISSÃO!<br />
              <small className='text-[0.4em]'>Equipamento perdido no espaço<br />Recarregue a página para tentar novamente</small>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

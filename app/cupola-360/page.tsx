'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const spaceBackgrounds = [
  { id: 1, src: '/cupole/earth.jpg', name: 'Earth', color: '#4D7094' },
  { id: 2, src: '/cupole/sun.mp4', name: 'Sun', color: '#794D01' },
  { id: 3, src: '/cupole/moon.jpg', name: 'Moon', color: '#968575' },
  { id: 4, src: '/cupole/mars.mp4', name: 'Mars', color: '#5C4931' },
  { id: 5, src: '/cupole/saturn.mp4', name: 'Saturn', color: '#030203' },
  { id: 6, src: '/cupole/boreal.mp4', name: 'Borealis', color: '#030203' },
]

export default function Cupola360() {
  const [currentBg, setCurrentBg] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load A-Frame scripts
    const aframeScript = document.createElement('script')
    aframeScript.src = 'https://aframe.io/releases/1.4.2/aframe.min.js'
    aframeScript.async = true
    document.head.appendChild(aframeScript)

    aframeScript.onload = () => {
      setMounted(true)
    }

    return () => {
      if (document.head.contains(aframeScript)) {
        document.head.removeChild(aframeScript)
      }
    }
  }, [])

  return (
    <div className='relative h-screen w-screen overflow-hidden bg-black'>
      {/* Back Button */}
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => window.history.back()}
        className='absolute top-6 left-6 z-50 bg-black border-2 border-zinc-700 px-4 py-3 shadow-[0_0_0_4px_#030203] hover:border-cyan-500 transition-all group'
        style={{ position: 'fixed' }}
      >
        <div className='flex items-center gap-2'>
          <span className='text-orange-500 text-[10px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>{'<'}</span>
          <span className='text-white text-[8px] font-[family-name:var(--font-press-start)] tracking-wider group-hover:text-cyan-500'>CUPOLA</span>
        </div>
      </motion.button>

      {/* Scenario Selector */}
      <div className='absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3' style={{ position: 'fixed' }}>
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='bg-black border-2 border-zinc-700 p-4 shadow-[0_0_0_4px_#030203]'
        >
          <h3 className='text-white text-[8px] font-bold mb-4 tracking-wider font-[family-name:var(--font-press-start)] border-b-2 border-cyan-500 pb-2'>SCENARIOS</h3>
          <div className='flex flex-col gap-2'>
            {spaceBackgrounds.map((bg, index) => (
              <motion.button
                key={bg.id}
                onClick={() => setCurrentBg(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-2 text-[8px] tracking-wider transition-all font-[family-name:var(--font-press-start)] relative ${currentBg === index
                  ? 'bg-zinc-800 text-white border border-cyan-500'
                  : 'bg-transparent text-zinc-600 hover:text-cyan-500'
                  }`}
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

      {/* A-Frame Scene */}
      {mounted && (
        <div
          id="aframe-container"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          dangerouslySetInnerHTML={{
            __html: `
              <script>
                AFRAME.registerComponent('mouse-look', {
                  schema: {
                    sensitivity: {default: 0.5}
                  },
                  init: function() {
                    this.yaw = 0;
                    this.pitch = 0;
                    this.onMouseMove = this.onMouseMove.bind(this);
                    document.addEventListener('mousemove', this.onMouseMove);
                  },
                  onMouseMove: function(event) {
                    this.yaw -= event.movementX * this.data.sensitivity;
                    this.pitch -= event.movementY * this.data.sensitivity;
                    this.pitch = Math.max(-90, Math.min(90, this.pitch));
                    this.el.setAttribute('rotation', {
                      x: this.pitch,
                      y: this.yaw,
                      z: 0
                    });
                  },
                  remove: function() {
                    document.removeEventListener('mousemove', this.onMouseMove);
                  }
                });
              </script>
              <a-scene embedded vr-mode-ui="enabled: true" renderer="antialias: true; colorManagement: true; sortObjects: true; physicallyCorrectLights: true; maxCanvasWidth: 1920; maxCanvasHeight: 1080;">
                <a-assets>
                  <img id="cupola-base" src="/cupole/base-360.png" crossorigin="anonymous" />
                  ${spaceBackgrounds[currentBg].src.endsWith('.mp4')
                ? `<video id="space-bg" src="${spaceBackgrounds[currentBg].src}" autoplay loop muted playsinline crossorigin="anonymous"></video>`
                : `<img id="space-bg" src="${spaceBackgrounds[currentBg].src}" crossorigin="anonymous" />`
              }
                </a-assets>

                <!-- Camera -->
                <a-entity id="rig" position="0 0 0">
                  <a-camera mouse-look wasd-controls="enabled: false" position="0 0 0">
                    <a-cursor color="#ffffff"></a-cursor>
                  </a-camera>
                </a-entity>

                <!-- Sky preto -->
                <a-sky color="#030203"></a-sky>

                <!-- Fundo: cenário espacial rotativo (mesmo tamanho da base) -->
                <a-plane 
                  src="#space-bg" 
                  position="0 0 -10.1" 
                  rotation="0 0 0" 
                  width="34.78" 
                  height="20"
                  material="shader: flat; side: front"
                  animation="property: rotation; to: 0 0 360  ; loop: true; dur: 120000; easing: linear"
                ></a-plane>

                <!-- Frente: base.png (1920x1080 aspect ratio = 1.78:1) -->
                <a-plane 
                  src="#cupola-base" 
                  position="0 0 -10" 
                  rotation="0 0 0" 
                  width="34.78" 
                  height="20"
                  material="shader: standard; side: front; transparent: false; alphaTest: 0.5"
                ></a-plane>

                <!-- Teto preto - tampa superior -->
                <a-plane 
                  color="#030203" 
                  position="0 10 -10" 
                  rotation="-90 0 0" 
                  width="40" 
                  height="25"
                  material="shader: flat; side: double"
                ></a-plane>
                
                <!-- Chão preto - tampa inferior -->
                <a-plane 
                  color="#030203" 
                  position="0 -10 -10" 
                  rotation="90 0 0" 
                  width="40" 
                  height="25"
                  material="shader: flat; side: double"
                ></a-plane>
                
                <!-- Laterais do teto/chão para cobrir gaps -->
                <a-plane 
                  color="#030203" 
                  position="-17.39 0 -10" 
                  rotation="0 90 0" 
                  width="25" 
                  height="20"
                  material="shader: flat; side: double"
                ></a-plane>
                
                <a-plane 
                  color="#030203" 
                  position="17.39 0 -10" 
                  rotation="0 -90 0" 
                  width="25" 
                  height="20"
                  material="shader: flat; side: double"
                ></a-plane>
                
                <!-- Traseira: preto -->
                <a-plane 
                  color="#030203" 
                  position="0 0 10" 
                  rotation="0 180 0" 
                  width="20" 
                  height="20"
                  material="shader: flat; side: front"
                ></a-plane>
                
                <!-- Esquerda: preto -->
                <a-plane 
                  color="#030203" 
                  position="-10 0 0" 
                  rotation="0 90 0" 
                  width="20" 
                  height="20"
                  material="shader: flat; side: front"
                ></a-plane>
                
                <!-- Direita: preto -->
                <a-plane 
                  color="#030203" 
                  position="10 0 0" 
                  rotation="0 -90 0" 
                  width="20" 
                  height="20"
                  material="shader: flat; side: front"
                ></a-plane>
                
                <!-- Baixo: preto (geral) -->
                <a-plane 
                  color="#030203" 
                  position="0 -10 0" 
                  rotation="90 0 0" 
                  width="20" 
                  height="20"
                  material="shader: flat; side: front"
                ></a-plane>
                
                <!-- Cima: preto (geral) -->
                <a-plane 
                  color="#030203" 
                  position="0 10 0" 
                  rotation="-90 0 0" 
                  width="20" 
                  height="20"
                  material="shader: flat; side: front"
                ></a-plane>

                <!-- Luzes -->
                <a-light type="ambient" color="#ffffff" intensity="1.2"></a-light>
                <a-light type="directional" color="#ffffff" intensity="0.3" position="0 0 -1"></a-light>
              </a-scene>
            `
          }}
        />
      )}

      {/* Instructions */}
      <div className='absolute bottom-6 left-1/2 -translate-x-1/2 z-40' style={{ position: 'fixed' }}>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className='bg-black border-2 border-zinc-700 px-6 py-3 shadow-[0_0_0_4px_#030203]'
        >
          <p className='text-cyan-500 text-[8px] font-[family-name:var(--font-press-start)] tracking-wider text-center'>
            DRAG TO LOOK AROUND • CLICK VR ICON FOR IMMERSIVE MODE
          </p>
        </motion.div>
      </div>
    </div>
  )
}

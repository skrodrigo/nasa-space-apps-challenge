'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const spaceBackgrounds = [
  { id: 1, src: '/cupola/earth.jpg', name: 'Earth', color: '#4D7094' },
  { id: 2, src: '/cupola/mars.mp4', name: 'Mars', color: '#5C4931' },
  { id: 3, src: '/cupola/saturn.mp4', name: 'Saturn', color: '#030203' },
  { id: 4, src: '/cupola/boreal.mp4', name: 'Borealis', color: '#030203' },
]

export default function Cupola360() {
  const [currentBg, setCurrentBg] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [launchedObjects, setLaunchedObjects] = useState<Array<{ id: number, name: string, image: string, timestamp: number }>>([])

  useEffect(() => {
    // Load A-Frame scripts
    const aframeScript = document.createElement('script')
    aframeScript.src = 'https://aframe.io/releases/1.4.2/aframe.min.js'
    aframeScript.async = true
    document.head.appendChild(aframeScript)

    aframeScript.onload = () => {
      setMounted(true)
      // Trigger fade out after mount
      setTimeout(() => setFadeOut(true), 100)
    }

    return () => {
      if (document.head.contains(aframeScript)) {
        document.head.removeChild(aframeScript)
      }
    }
  }, [])

  const moveForward = () => {
    if (mounted) {
      const camera = document.querySelector('a-camera')
      if (camera) {
        const currentFov = parseFloat(camera.getAttribute('fov') || '80')
        const newFov = Math.max(currentFov - 5, 40)
        camera.setAttribute('animation__fov', `property: fov; to: ${newFov}; dur: 500; easing: easeInOutQuad`)
      }
    }
  }

  const moveBackward = () => {
    if (mounted) {
      const camera = document.querySelector('a-camera')
      if (camera) {
        const currentFov = parseFloat(camera.getAttribute('fov') || '80')
        const newFov = Math.min(currentFov + 5, 100)
        camera.setAttribute('animation__fov', `property: fov; to: ${newFov}; dur: 500; easing: easeInOutQuad`)
      }
    }
  }

  return (
    <div className='relative h-screen w-screen overflow-hidden bg-black'>
      {/* Fade Out Effect - Astronaut opening eyes with bounce */}
      <motion.div
        initial={{ opacity: 1, scale: 1.15, filter: 'blur(0px)' }}
        animate={{
          opacity: fadeOut ? 0 : 1,
          scale: fadeOut ? 1 : 1.15,
          filter: fadeOut ? 'blur(8px)' : 'blur(0px)'
        }}
        transition={{
          duration: 3.5,
          ease: [0.34, 1.8, 0.64, 1], // Stronger bounce - more overshoot
          delay: 0.2
        }}
        className='absolute inset-0 z-[9999] bg-black pointer-events-none'
      />

      {/* Back Button */}
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className='absolute top-6 left-6 z-50 bg-black border-2 border-zinc-700 px-4 py-3 shadow-[0_0_0_4px_#030203] hover:border-cyan-500 transition-all group'
        style={{ position: 'fixed' }}
      >
        <Link href="/cupola">
          <div className='flex items-center gap-2'>
            <span className='text-orange-500 text-[10px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>{'<'}</span>
            <span className='text-white text-[8px] font-[family-name:var(--font-press-start)] tracking-wider group-hover:text-cyan-500'>CUPOLA NO 360º</span>
          </div>
        </Link>
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


      {/* Navigation Buttons */}
      <div className='absolute right-6 bottom-6 z-40 flex flex-row gap-3' style={{ position: 'fixed' }}>
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={moveBackward}
          className='bg-black border-2 border-zinc-700 p-4 shadow-[0_0_0_4px_#030203] hover:border-orange-500 transition-all group'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className='flex items-center justify-center'>
            <span className='text-orange-500 text-[16px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>-</span>
          </div>
        </motion.button>

        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={moveForward}
          className='bg-black border-2 border-zinc-700 p-4 shadow-[0_0_0_4px_#030203] hover:border-cyan-500 transition-all group'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className='flex items-center justify-center'>
            <span className='text-cyan-500 text-[16px] font-[family-name:var(--font-press-start)] group-hover:animate-pulse'>+</span>
          </div>
        </motion.button>
      </div>

      {/* A-Frame Scene */}
      {mounted && (
        <div
          key={`aframe-${currentBg}`}
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
nao 
                AFRAME.registerComponent('parallax', {
                  schema: {
                    intensity: {default: 0.02}
                  },
                  init: function() {
                    this.onMouseMove = this.onMouseMove.bind(this);
                    this.basePosition = this.el.getAttribute('position');
                    document.addEventListener('mousemove', this.onMouseMove);
                  },
                  onMouseMove: function(event) {
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    
                    const deltaX = (event.clientX - centerX) / centerX;
                    const deltaY = (event.clientY - centerY) / centerY;
                    
                    const offsetX = deltaX * this.data.intensity;
                    const offsetY = -deltaY * this.data.intensity;
                    
                    this.el.setAttribute('position', {
                      x: this.basePosition.x + offsetX,
                      y: this.basePosition.y + offsetY,
                      z: this.basePosition.z
                    });
                  },
                  remove: function() {
                    document.removeEventListener('mousemove', this.onMouseMove);
                  }
                });

                // Camera bounce animation - simulates astronaut head movement
                AFRAME.registerComponent('camera-bounce', {
                  init: function() {
                    const rig = this.el;
                    const startTime = Date.now();
                    const duration = 4000; // 4 seconds
                    
                    const easeOutBounce = (t) => {
                      const n1 = 7.5625;
                      const d1 = 2.75;
                      
                      if (t < 1 / d1) {
                        return n1 * t * t;
                      } else if (t < 2 / d1) {
                        return n1 * (t -= 1.5 / d1) * t + 0.75;
                      } else if (t < 2.5 / d1) {
                        return n1 * (t -= 2.25 / d1) * t + 0.9375;
                      } else {
                        return n1 * (t -= 2.625 / d1) * t + 0.984375;
                      }
                    };
                    
                    const animate = () => {
                      const elapsed = Date.now() - startTime;
                      const progress = Math.min(elapsed / duration, 1);
                      
                      // Apply bounce easing
                      const eased = easeOutBounce(progress);
                      
                      // Simulate head movement - starts tilted down, bounces up to normal
                      const rotationX = -25 + (eased * 25); // From -25° to 0°
                      const positionY = -0.8 + (eased * 0.8); // From -0.8 to 0
                      const positionZ = 1.5 - (eased * 1.5); // From 1.5 to 0 (head moving forward)
                      
                      rig.setAttribute('rotation', {
                        x: rotationX,
                        y: 0,
                        z: 0
                      });
                      
                      rig.setAttribute('position', {
                        x: 0,
                        y: positionY,
                        z: positionZ
                      });
                      
                      if (progress < 1) {
                        requestAnimationFrame(animate);
                      } else {
                        // Final position
                        rig.setAttribute('rotation', '0 0 0');
                        rig.setAttribute('position', '0 0 0');
                      }
                    };
                    
                    setTimeout(() => {
                      animate();
                    }, 200);
                  }
                });
              </script>
              <a-scene embedded vr-mode-ui="enabled: true" renderer="antialias: true; colorManagement: true; sortObjects: true; physicallyCorrectLights: true; maxCanvasWidth: 1920; maxCanvasHeight: 1080;">
                <a-assets>
                  <img id="cupola-base" src="/cupola/base-360.png" crossorigin="anonymous" />
                  ${spaceBackgrounds[currentBg].src.endsWith('.mp4')
                ? `<video id="space-bg" src="${spaceBackgrounds[currentBg].src}" autoplay loop muted playsinline crossorigin="anonymous"></video>`
                : `<img id="space-bg" src="${spaceBackgrounds[currentBg].src}" crossorigin="anonymous" />`
              }
                </a-assets>

                <!-- Camera -->
                <a-entity id="rig" camera-bounce position="0 0 0">
                  <a-camera mouse-look wasd-controls="enabled: false" position="0 0 0" fov="80">
                    <a-cursor color="#ffffff"></a-cursor>
                  </a-camera>
                </a-entity>

                <!-- Sky preto -->
                <a-sky color="#030203"></a-sky>

                <!-- Fundo: cenário espacial rotativo (mesmo tamanho da base) -->
                <a-plane 
                  id="space-bg-plane"
                  src="#space-bg" 
                  position="0 0 -10.1" 
                  rotation="0 0 0" 
                  width="34.78" 
                  height="20"
                  material="shader: flat; side: front"
                  animation="property: rotation; to: 0 0 360; loop: true; dur: 120000; easing: linear"
                ></a-plane>

                <!-- Frente: base.png (1920x1080 aspect ratio = 1.78:1) -->
                <a-plane 
                  src="#cupola-base" 
                  position="0 0 -10" 
                  rotation="0 0 0" 
                  width="34.78" 
                  height="20"
                  material="shader: standard; side: front; transparent: false; alphaTest: 0.5"
                  parallax="intensity: 0.5"
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

'use client'

import React, { useEffect } from 'react'

export default function NBLGamePage() {
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Inicializa o jogo quando o componente monta
    initGame()

    return () => {
      // Cleanup quando o componente desmonta
      if (typeof window !== 'undefined') {
        const container = document.getElementById('simulador-container')
        if (container) {
          container.innerHTML = ''
        }
      }
    }
  }, [mounted])

  const initGame = () => {
    // Todo o código JavaScript do jogo
    const CONTAINER = document.getElementById('simulador-container')
    if (!CONTAINER) return

    const WIDTH = CONTAINER.clientWidth
    const HEIGHT = CONTAINER.clientHeight
    const FPS = 60
    const TIME_STEP = 1000 / FPS
    const MARGIN_WARNING = 50

    const objects: any[] = []
    const parafusos: any[] = []

    let isDragging = false
    let draggedObject: any = null
    let lastMouseX = 0
    let lastMouseY = 0
    let dragStartTime = 0
    let dragDistance = 0

    let chaveDeFenda: any = null
    let caixa: any = null
    let parafusosRestantes = 0
    let gameOver = false
    let caixaAberta = false
    let fusivelQuebrado: any = null
    let fusivelNovo: any = null
    let fusivelTrocado = false
    let etapaJogo = 'remover_parafusos'
    let nivelAtual = 1
    const PARAFUSOS_POR_NIVEL: any = {
      1: 4,
      2: 6,
      3: 8
    }

    let tempoRestante = 30
    let intervaloCronometro: any = null

    const sons: any = {
      parafuso: document.getElementById('som-parafuso'),
      parafusoSolto: document.getElementById('som-parafuso-solto'),
      caixaAbrir: document.getElementById('som-caixa-abrir'),
      fusivel: document.getElementById('som-fusivel'),
      encaixe: document.getElementById('som-encaixe'),
      vitoria: document.getElementById('som-vitoria'),
      explosao: document.getElementById('som-explosao')
    }

    function tocarSom(som: string) {
      if (sons[som]) {
        sons[som].currentTime = 0
        sons[som].play().catch((err: any) => console.log('Erro ao tocar som:', err))
      }
    }

    class FloatingObject {
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      type: string
      shape: string
      element: HTMLDivElement
      isDragging: boolean

      constructor(x: number, y: number, radius: number, color: string, vx: number, vy: number, type = 'generic', shape = '●') {
        this.x = x
        this.y = y
        this.radius = radius
        this.vx = vx
        this.vy = vy
        this.type = type
        this.shape = shape

        this.element = document.createElement('div')
        this.element.className = 'object interativo'
        this.element.style.width = `${radius * 2}px`
        this.element.style.height = `${radius * 2}px`
        this.element.style.display = 'flex'
        this.element.style.alignItems = 'center'
        this.element.style.justifyContent = 'center'

        if (shape.endsWith('.png')) {
          this.element.style.backgroundImage = `url(/nbl/${shape})`
          this.element.style.backgroundSize = 'contain'
          this.element.style.backgroundRepeat = 'no-repeat'
          this.element.style.backgroundPosition = 'center'
          this.element.style.imageRendering = 'pixelated'
          this.element.style.backgroundColor = 'transparent'
        } else {
          this.element.style.backgroundColor = color
          this.element.style.fontSize = `${radius * 1.2}px`
          this.element.textContent = shape
        }

        this.element.style.transform = `translate(${this.x - this.radius}px, ${this.y - this.radius}px)`
        this.isDragging = false
        CONTAINER.appendChild(this.element)

        this.element.addEventListener('mousedown', this.startDrag.bind(this))
        this.element.addEventListener('touchstart', this.startDrag.bind(this))
      }

      update() {
        if (gameOver) return

        if (this.type === 'fusivel-fixo') {
          return
        }

        this.x += this.vx * (TIME_STEP / 1000)
        this.y += this.vy * (TIME_STEP / 1000)

        if (this.type === 'parafuso' || this.type === 'chave' ||
          this.type === 'fusivel-quebrado' || this.type === 'fusivel-novo') {

          if (this.x < 0 || this.x > WIDTH ||
            this.y < 0 || this.y > HEIGHT) {
            const explosaoX = Math.max(0, Math.min(WIDTH, this.x))
            const explosaoY = Math.max(0, Math.min(HEIGHT, this.y))
            triggerGameOver(explosaoX, explosaoY)
            return
          }
        }

        if (this.type === 'parafuso' || this.type === 'chave' ||
          this.type === 'fusivel-quebrado' || this.type === 'fusivel-novo') {
          if (this.x < MARGIN_WARNING || this.x > WIDTH - MARGIN_WARNING ||
            this.y < MARGIN_WARNING || this.y > HEIGHT - MARGIN_WARNING) {
            const avisoEl = document.getElementById('aviso')
            if (avisoEl) avisoEl.style.display = 'block'
          } else {
            const avisoEl = document.getElementById('aviso')
            if (avisoEl) avisoEl.style.display = 'none'
          }
        }

        if (this.type === 'fusivel-quebrado' && etapaJogo === 'trocar_fusivel' && !fusivelTrocado) {
          checkRemoverFusivel(this)
        }

        const scale = this.isDragging ? 1.3 : 1
        this.element.style.transform = `translate(${this.x - this.radius}px, ${this.y - this.radius}px) scale(${scale})`
      }

      startDrag(e: any) {
        if (gameOver) return
        if (this.type === 'fusivel-fixo') return
        e.preventDefault()

        isDragging = true
        draggedObject = this
        dragStartTime = Date.now()
        dragDistance = 0

        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0)
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0)

        lastMouseX = clientX
        lastMouseY = clientY

        this.vx = 0
        this.vy = 0

        this.isDragging = true
        this.element.classList.add('dragging')
        this.element.style.transform = `translate(${this.x - this.radius}px, ${this.y - this.radius}px) scale(1.3)`

        document.addEventListener('mousemove', drag, { passive: false })
        document.addEventListener('mouseup', endDrag)
        document.addEventListener('touchmove', drag, { passive: false })
        document.addEventListener('touchend', endDrag)

        CONTAINER.style.cursor = 'grabbing'
      }
    }

    class Caixa {
      x: number
      y: number
      width: number
      height: number
      parafusosSlots: any[]
      aberta: boolean
      interior: HTMLDivElement
      element: HTMLDivElement

      constructor(x: number, y: number, width: number, height: number, numParafusos = 4) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.parafusosSlots = []
        this.aberta = false

        this.interior = document.createElement('div')
        this.interior.className = 'caixa brilho-vermelho'
        this.interior.style.left = `${x}px`
        this.interior.style.top = `${y}px`
        this.interior.style.width = `${width}px`
        this.interior.style.height = `${height}px`
        this.interior.style.backgroundImage = 'url(/nbl/caixaaberta.png)'
        this.interior.style.zIndex = '40'
        CONTAINER.appendChild(this.interior)

        this.element = document.createElement('div')
        this.element.className = 'caixa brilho-vermelho'
        this.element.style.left = `${x}px`
        this.element.style.top = `${y}px`
        this.element.style.width = `${width}px`
        this.element.style.height = `${height}px`
        this.element.style.backgroundImage = 'url(/nbl/caixafechada-erro.png)'
        this.element.style.transition = 'transform 1s ease-out, background-image 0.5s ease-out'
        this.element.style.zIndex = '50'
        CONTAINER.appendChild(this.element)

        let positions: any[] = []
        if (numParafusos === 4) {
          positions = [
            { x: 40, y: 5 },
            { x: 222, y: 5 },
            { x: 40, y: height - 45 },
            { x: 222, y: height - 45 }
          ]
        } else if (numParafusos === 6) {
          positions = [
            { x: 40, y: 5 },
            { x: 131, y: 5 },
            { x: 222, y: 5 },
            { x: 40, y: height - 45 },
            { x: 131, y: height - 45 },
            { x: 222, y: height - 45 }
          ]
        } else if (numParafusos === 8) {
          positions = [
            { x: 40, y: 5 },
            { x: 131, y: 5 },
            { x: 222, y: 5 },
            { x: 40, y: height / 2 - 18 },
            { x: 222, y: height / 2 - 18 },
            { x: 40, y: height - 45 },
            { x: 131, y: height - 45 },
            { x: 222, y: height - 45 }
          ]
        }

        positions.forEach((pos, index) => {
          const slotTampa = document.createElement('div')
          slotTampa.className = 'parafuso-slot'
          slotTampa.style.left = `${pos.x}px`
          slotTampa.style.top = `${pos.y}px`
          slotTampa.style.backgroundImage = 'url(/nbl/parafusopreso.png)'
          slotTampa.style.backgroundSize = 'contain'
          slotTampa.style.backgroundRepeat = 'no-repeat'
          slotTampa.style.backgroundPosition = 'center'
          slotTampa.style.imageRendering = 'pixelated'
          this.element.appendChild(slotTampa)

          const slotInterior = document.createElement('div')
          slotInterior.className = 'parafuso-slot slot-interior'
          slotInterior.style.left = `${this.x + pos.x}px`
          slotInterior.style.top = `${this.y + pos.y}px`
          slotInterior.style.backgroundImage = 'none'
          slotInterior.style.backgroundSize = 'contain'
          slotInterior.style.backgroundRepeat = 'no-repeat'
          slotInterior.style.backgroundPosition = 'center'
          slotInterior.style.imageRendering = 'pixelated'
          slotInterior.style.display = 'none'
          CONTAINER.appendChild(slotInterior)

          this.parafusosSlots.push({
            x: this.x + pos.x + 12,
            y: this.y + pos.y + 12,
            slotTampa,
            slotInterior,
            index
          })
        })
      }

      abrir() {
        this.aberta = true
        this.element.style.transformOrigin = 'top center'
        this.element.style.transformStyle = 'preserve-3d'
        this.element.style.transform = 'perspective(800px) rotateX(-110deg) translateY(-30px)'
      }

      fechar() {
        this.aberta = false
        this.element.style.transform = 'perspective(800px) rotateX(0deg) translateY(0px)'
      }

      resetImagem() {
        this.element.style.backgroundImage = 'url(/nbl/caixafechada-erro.png)'
        this.element.classList.remove('brilho-laranja', 'brilho-verde')
        this.element.classList.add('brilho-vermelho')
        this.interior.classList.remove('brilho-laranja', 'brilho-verde')
        this.interior.classList.add('brilho-vermelho')
      }

      resetParafusos() {
        this.parafusosSlots.forEach(slot => {
          slot.toques = 0
          slot.slotTampa.style.backgroundImage = 'none'
          slot.slotTampa.style.transform = ''
          slot.slotTampa.style.filter = ''
          slot.slotInterior.style.backgroundImage = 'none'
        })
      }

      checkParafusoClick(obj: any, clicked = false) {
        if (obj.type !== 'chave') return

        if (etapaJogo === 'remover_parafusos') {
          for (let i = 0; i < this.parafusosSlots.length; i++) {
            const slot = this.parafusosSlots[i]
            if (!slot.removed && !slot.processando) {
              const chaveX = obj.x + 40
              const dx = chaveX - slot.x
              const dy = obj.y - slot.y
              const dist = Math.sqrt(dx * dx + dy * dy)

              if (dist < 100 && clicked) {
                if (!slot.toques) slot.toques = 0
                slot.toques++

                tocarSom('parafuso')

                const rotation = slot.toques * 120
                slot.slotTampa.style.transform = `rotate(${rotation}deg)`
                slot.slotTampa.style.transition = 'transform 0.3s'

                if (slot.toques === 1) {
                  slot.slotTampa.style.filter = 'brightness(1.2) hue-rotate(30deg)'
                } else if (slot.toques === 2) {
                  slot.slotTampa.style.filter = 'brightness(1.3) hue-rotate(60deg)'
                }

                if (slot.toques >= 3) {
                  slot.processando = true

                  tocarSom('parafusoSolto')

                  setTimeout(() => {
                    slot.removed = true
                    slot.slotTampa.style.backgroundImage = 'none'
                    slot.slotTampa.style.transform = ''
                    slot.slotTampa.style.filter = ''

                    const parafuso = new FloatingObject(
                      slot.x, slot.y, 22, 'transparent',
                      (Math.random() - 0.5) * 100,
                      (Math.random() - 0.5) * 100,
                      'parafuso', 'parafusosolto.png'
                    )
                    parafusos.push(parafuso)
                    objects.push(parafuso)

                    parafusosRestantes--
                    atualizarHUD()

                    if (parafusosRestantes === 0) {
                      setTimeout(abrirCaixa, 500)
                    }
                  }, 300)
                }
                return
              }
            }
          }
        }
      }

      checkParafusoProximo(parafusoObj: any) {
        if (etapaJogo !== 'recolocar_parafusos') return false

        let slotMaisProximo: any = null
        let menorDist = 50

        for (let i = 0; i < this.parafusosSlots.length; i++) {
          const slot = this.parafusosSlots[i]

          if (slot.removed) {
            const dx = parafusoObj.x - slot.x
            const dy = parafusoObj.y - slot.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < menorDist) {
              menorDist = dist
              slotMaisProximo = slot
            }
          }
        }

        if (slotMaisProximo) {
          parafusoObj.element.remove()
          const index = objects.indexOf(parafusoObj)
          if (index > -1) objects.splice(index, 1)
          const index2 = parafusos.indexOf(parafusoObj)
          if (index2 > -1) parafusos.splice(index2, 1)

          tocarSom('encaixe')

          slotMaisProximo.removed = false
          slotMaisProximo.toques = 0
          slotMaisProximo.slotInterior.style.backgroundImage = 'url(/nbl/parafusopreso.png)'
          slotMaisProximo.slotInterior.style.transform = ''
          slotMaisProximo.slotInterior.style.filter = ''

          parafusosRestantes++
          atualizarHUD()

          caixa.element.style.filter = 'brightness(1.5)'
          setTimeout(() => {
            caixa.element.style.filter = ''
          }, 300)

          const totalParafusos = PARAFUSOS_POR_NIVEL[nivelAtual]
          if (parafusosRestantes === totalParafusos) {
            caixa.element.classList.remove('brilho-laranja')
            caixa.element.classList.add('brilho-verde')
            caixa.interior.classList.remove('brilho-laranja')
            caixa.interior.classList.add('brilho-verde')

            setTimeout(triggerVitoria, 500)
          }

          return true
        }

        return false
      }
    }

    function drag(e: any) {
      if (!isDragging || !draggedObject) return
      e.preventDefault()

      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0)
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0)

      const deltaX = clientX - lastMouseX
      const deltaY = clientY - lastMouseY

      dragDistance += Math.abs(deltaX) + Math.abs(deltaY)

      draggedObject.x += deltaX
      draggedObject.y += deltaY

      draggedObject.vx = deltaX / (TIME_STEP / 1000) / 2
      draggedObject.vy = deltaY / (TIME_STEP / 1000) / 2

      lastMouseX = clientX
      lastMouseY = clientY

      if (draggedObject.type === 'parafuso' && caixa && etapaJogo === 'recolocar_parafusos') {
        highlightNearbySlot(draggedObject)
      }

      if (draggedObject.type === 'fusivel-quebrado' && etapaJogo === 'trocar_fusivel') {
        checkRemoverFusivel(draggedObject)
      }
      if (draggedObject.type === 'fusivel-novo' && etapaJogo === 'fechar_caixa') {
        checkColocarFusivel(draggedObject)
      }

      const scale = draggedObject.isDragging ? 1.3 : 1
      draggedObject.element.style.transform = `translate(${draggedObject.x - draggedObject.radius}px, ${draggedObject.y - draggedObject.radius}px) scale(${scale})`
    }

    function highlightNearbySlot(parafusoObj: any) {
      if (!caixa || !caixa.parafusosSlots) return

      let slotMaisProximo: any = null
      let menorDist = 50

      for (let i = 0; i < caixa.parafusosSlots.length; i++) {
        const slot = caixa.parafusosSlots[i]

        if (slot.removed) {
          const dx = parafusoObj.x - slot.x
          const dy = parafusoObj.y - slot.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < menorDist) {
            menorDist = dist
            slotMaisProximo = slot
          }
        }
      }

      if (slotMaisProximo) {
        caixa.element.style.filter = 'brightness(1.4)'

        const debugInfo = document.getElementById('debug-info')
        if (debugInfo) debugInfo.textContent = `Dist: ${Math.round(menorDist)}px | ENCAIXA!`
      } else {
        caixa.element.style.filter = ''
        const debugInfo = document.getElementById('debug-info')
        if (debugInfo) debugInfo.textContent = ''
      }
    }

    function endDrag() {
      if (!isDragging) return

      const dragDuration = Date.now() - dragStartTime
      const wasClick = dragDistance < 20 && dragDuration < 500

      if (draggedObject && draggedObject.type === 'chave' && caixa) {
        caixa.checkParafusoClick(draggedObject, true)
      }

      if (draggedObject && draggedObject.type === 'parafuso' && caixa) {
        const encaixou = caixa.checkParafusoProximo(draggedObject)

        caixa.element.style.filter = ''

        if (encaixou) {
          document.removeEventListener('mousemove', drag)
          document.removeEventListener('mouseup', endDrag)
          document.removeEventListener('touchmove', drag)
          document.removeEventListener('touchend', endDrag)
          isDragging = false
          draggedObject = null
          CONTAINER.style.cursor = 'default'
          return
        }
      }

      if (draggedObject) {
        draggedObject.isDragging = false
        draggedObject.element.classList.remove('dragging')
        draggedObject.element.style.transform = `translate(${draggedObject.x - draggedObject.radius}px, ${draggedObject.y - draggedObject.radius}px) scale(1)`

        const velocidadeTotal = Math.sqrt(draggedObject.vx * draggedObject.vx + draggedObject.vy * draggedObject.vy)
        if (velocidadeTotal < 5) {
          const angulo = Math.random() * Math.PI * 2
          const forca = 20 + Math.random() * 15
          draggedObject.vx = Math.cos(angulo) * forca
          draggedObject.vy = Math.sin(angulo) * forca
        }
      }

      document.removeEventListener('mousemove', drag)
      document.removeEventListener('mouseup', endDrag)
      document.removeEventListener('touchmove', drag)
      document.removeEventListener('touchend', endDrag)

      isDragging = false
      draggedObject = null
      CONTAINER.style.cursor = 'default'
    }

    function criarExplosao(x: number, y: number) {
      CONTAINER.style.animation = 'tela-tremer 0.5s'
      setTimeout(() => {
        CONTAINER.style.animation = ''
      }, 500)

      for (let i = 0; i < 80; i++) {
        setTimeout(() => {
          const particula = document.createElement('div')
          particula.className = 'particula-explosao'

          particula.style.left = `${x}px`
          particula.style.top = `${y}px`

          const cores = ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#cc0000']
          particula.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)]

          const angulo = Math.random() * Math.PI * 2
          const distancia = 100 + Math.random() * 200
          const destX = x + Math.cos(angulo) * distancia
          const destY = y + Math.sin(angulo) * distancia

          const duracao = Math.random() * 1 + 0.5
          particula.style.animationDuration = `${duracao}s`

          const tamanho = Math.random() * 12 + 6
          particula.style.width = `${tamanho}px`
          particula.style.height = `${tamanho}px`

          CONTAINER.appendChild(particula)

          particula.animate([
            { left: `${x}px`, top: `${y}px` },
            { left: `${destX}px`, top: `${destY}px` }
          ], {
            duration: duracao * 1000,
            easing: 'ease-out'
          })

          setTimeout(() => {
            particula.remove()
          }, duracao * 1000)
        }, i * 10)
      }
    }

    function triggerGameOver(x = WIDTH / 2, y = HEIGHT / 2, motivo = 'Object left the screen!') {
      if (gameOver) return
      gameOver = true

      pararCronometro()

      tocarSom('explosao')

      criarExplosao(x, y)

      setTimeout(() => {
        const motivoEl = document.getElementById('game-over-motivo')
        const gameOverEl = document.getElementById('game-over')
        if (motivoEl) motivoEl.textContent = motivo
        if (gameOverEl) gameOverEl.style.display = 'block'
      }, 500)
    }

    function criarConfetes() {
      const cores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']

      for (let i = 0; i < 100; i++) {
        setTimeout(() => {
          const confete = document.createElement('div')
          confete.className = 'confete'

          confete.style.left = `${Math.random() * 100}%`

          confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)]

          confete.style.animationDuration = `${Math.random() * 2 + 2}s`

          const tamanho = Math.random() * 8 + 6
          confete.style.width = `${tamanho}px`
          confete.style.height = `${tamanho}px`

          CONTAINER.appendChild(confete)

          setTimeout(() => {
            confete.remove()
          }, 4000)
        }, i * 30)
      }
    }

    function triggerVitoria() {
      if (gameOver) return

      pararCronometro()

      tocarSom('vitoria')

      const nivelTexto = document.getElementById('nivel-texto')
      const vitoriaEl = document.getElementById('vitoria')
      const avisoEl = document.getElementById('aviso')

      if (nivelTexto) nivelTexto.textContent = `LEVEL ${nivelAtual} COMPLETE!`
      if (vitoriaEl) vitoriaEl.style.display = 'block'
      if (avisoEl) avisoEl.style.display = 'none'

      criarConfetes()

      if (nivelAtual < 3) {
        setTimeout(() => {
          if (vitoriaEl) vitoriaEl.style.display = 'none'
          nivelAtual++
          proximoNivel()
        }, 3000)
      } else {
        gameOver = true
        const vitoriaTexto = document.getElementById('vitoria-texto')
        if (vitoriaTexto) vitoriaTexto.textContent = 'YOU WIN ALL!'
        if (nivelTexto) nivelTexto.textContent = 'GAME COMPLETE!'
        setInterval(criarConfetes, 3000)
      }
    }

    function limparJogo() {
      objects.forEach(obj => {
        if (obj.element && obj.element.parentNode) {
          obj.element.remove()
        }
      })
      objects.length = 0
      parafusos.length = 0

      if (caixa) {
        if (caixa.parafusosSlots) {
          caixa.parafusosSlots.forEach((slot: any) => {
            if (slot.slotInterior && slot.slotInterior.parentNode) {
              slot.slotInterior.remove()
            }
          })
        }

        if (caixa.element && caixa.element.parentNode) {
          caixa.element.remove()
        }
        if (caixa.interior && caixa.interior.parentNode) {
          caixa.interior.remove()
        }
      }

      if (fusivelQuebrado && fusivelQuebrado.element && fusivelQuebrado.element.parentNode) {
        fusivelQuebrado.element.remove()
      }
      if (fusivelNovo && fusivelNovo.element && fusivelNovo.element.parentNode) {
        fusivelNovo.element.remove()
      }
    }

    function proximoNivel() {
      limparJogo()

      const numParafusos = PARAFUSOS_POR_NIVEL[nivelAtual]
      parafusosRestantes = numParafusos
      fusivelTrocado = false
      etapaJogo = 'remover_parafusos'
      fusivelQuebrado = null
      fusivelNovo = null
      gameOver = false

      caixa = new Caixa(WIDTH / 2 - 150, HEIGHT / 2 - 112, 300, 225, numParafusos)

      chaveDeFenda = new FloatingObject(
        100, 100, 100, 'transparent',
        30, 40,
        'chave', 'chavedefenda.png'
      )
      objects.push(chaveDeFenda)

      atualizarHUD()
      iniciarCronometro()
    }

    function iniciarCronometro() {
      if (intervaloCronometro) {
        clearInterval(intervaloCronometro)
      }

      tempoRestante = 45
      atualizarCronometro()

      intervaloCronometro = setInterval(() => {
        if (gameOver) {
          clearInterval(intervaloCronometro)
          return
        }

        tempoRestante--
        atualizarCronometro()

        if (tempoRestante <= 0) {
          clearInterval(intervaloCronometro)
          triggerGameOver(WIDTH / 2, HEIGHT / 2, "Time's up!")
        }
      }, 1000)
    }

    function pararCronometro() {
      if (intervaloCronometro) {
        clearInterval(intervaloCronometro)
        intervaloCronometro = null
      }
    }

    function atualizarCronometro() {
      const tempoCount = document.getElementById('tempo-count')
      if (tempoCount) tempoCount.textContent = `${tempoRestante}s`

      if (tempoRestante <= 10) {
        tempoCount?.classList.add('tempo-critico')
      } else {
        tempoCount?.classList.remove('tempo-critico')
      }
    }

    function atualizarHUD() {
      const instrucoes = document.getElementById('instrucoes')
      const parafusosCount = document.getElementById('parafusos-count')

      if (caixa && caixa.parafusosSlots) {
        caixa.parafusosSlots.forEach((slot: any) => {
          if (etapaJogo === 'remover_parafusos' && !slot.removed) {
            slot.slotTampa.classList.add('ativo')
            slot.slotTampa.classList.remove('piscar')
            slot.slotInterior.style.display = 'none'
            slot.slotInterior.classList.remove('ativo')
            slot.slotInterior.classList.remove('piscar')
          } else if (etapaJogo === 'recolocar_parafusos' && slot.removed) {
            slot.slotInterior.style.display = 'flex'
            slot.slotInterior.classList.add('piscar')
            slot.slotInterior.classList.remove('ativo')
            slot.slotTampa.classList.remove('ativo')
            slot.slotTampa.classList.remove('piscar')
          } else if (etapaJogo === 'recolocar_parafusos' && !slot.removed) {
            slot.slotInterior.style.display = 'flex'
            slot.slotInterior.classList.remove('piscar')
            slot.slotInterior.classList.remove('ativo')
          } else {
            slot.slotTampa.classList.remove('ativo')
            slot.slotTampa.classList.remove('piscar')
            slot.slotInterior.style.display = 'none'
            slot.slotInterior.classList.remove('ativo')
            slot.slotInterior.classList.remove('piscar')
          }
        })
      }

      const totalParafusos = PARAFUSOS_POR_NIVEL[nivelAtual]

      if (etapaJogo === 'remover_parafusos') {
        if (instrucoes) instrucoes.innerHTML = `<strong>LEVEL ${nivelAtual} - STAGE 1:</strong> Remove the screws<br>Drag and drop the wrench on screws (3x each)`
        if (parafusosCount) parafusosCount.textContent = `${parafusosRestantes}/${totalParafusos}`
      } else if (etapaJogo === 'trocar_fusivel') {
        if (instrucoes) instrucoes.innerHTML = `<strong>LEVEL ${nivelAtual} - STAGE 2:</strong> Remove broken fuse<br>Drag the red fuse out of the box`
        if (parafusosCount) parafusosCount.textContent = '✓'
      } else if (etapaJogo === 'fechar_caixa') {
        if (instrucoes) instrucoes.innerHTML = `<strong>LEVEL ${nivelAtual} - STAGE 3:</strong> Install new fuse<br>Drag the green fuse into the box`
        if (parafusosCount) parafusosCount.textContent = '✓'
      } else if (etapaJogo === 'recolocar_parafusos') {
        if (instrucoes) instrucoes.innerHTML = `<strong>LEVEL ${nivelAtual} - STAGE 4:</strong> Close the box<br>Drag the screws back to close`
        if (parafusosCount) parafusosCount.textContent = `${parafusosRestantes}/${totalParafusos}`
      }
    }

    function abrirCaixa() {
      etapaJogo = 'trocar_fusivel'
      tocarSom('caixaAbrir')
      caixa.abrir()
      atualizarHUD()

      setTimeout(() => {
        fusivelQuebrado = new FloatingObject(
          caixa.x + caixa.width / 2,
          caixa.y + caixa.height / 2,
          30, 'transparent',
          0, 0,
          'fusivel-quebrado', 'fusivelquebrado.png'
        )
        fusivelQuebrado.element.classList.add('interativo')
        objects.push(fusivelQuebrado)
      }, 400)
    }

    function checkRemoverFusivel(obj: any) {
      const distDaCaixa = Math.sqrt(
        Math.pow(obj.x - (caixa.x + caixa.width / 2), 2) +
        Math.pow(obj.y - (caixa.y + caixa.height / 2), 2)
      )

      if (distDaCaixa > 40 && !fusivelTrocado) {
        fusivelTrocado = true
        etapaJogo = 'fechar_caixa'
        tocarSom('fusivel')
        atualizarHUD()

        obj.type = 'lixo'
        obj.element.classList.remove('interativo')

        fusivelNovo = new FloatingObject(
          150, HEIGHT - 100,
          30, 'transparent',
          50, -30,
          'fusivel-novo', 'fusivel.png'
        )
        objects.push(fusivelNovo)
      }
    }

    function checkColocarFusivel(obj: any) {
      const distDaCaixa = Math.sqrt(
        Math.pow(obj.x - (caixa.x + caixa.width / 2), 2) +
        Math.pow(obj.y - (caixa.y + caixa.height / 2), 2)
      )

      if (distDaCaixa < 50) {
        if (isDragging && draggedObject === obj) {
          document.removeEventListener('mousemove', drag)
          document.removeEventListener('mouseup', endDrag)
          document.removeEventListener('touchmove', drag)
          document.removeEventListener('touchend', endDrag)
          isDragging = false
          draggedObject = null
          CONTAINER.style.cursor = 'default'
        }

        obj.type = 'fusivel-fixo'

        obj.vx = 0
        obj.vy = 0
        obj.x = caixa.x + caixa.width / 2
        obj.y = caixa.y + caixa.height / 2

        obj.element.style.left = `${obj.x - obj.radius}px`
        obj.element.style.top = `${obj.y - obj.radius}px`
        obj.element.style.transform = 'none'

        obj.element.style.zIndex = '45'
        obj.element.style.cursor = 'default'
        obj.element.style.pointerEvents = 'none'
        obj.element.classList.remove('interativo')
        obj.element.style.animation = 'fusivel-fixar 0.4s ease-out'
        obj.element.style.filter = 'hue-rotate(90deg) brightness(1.2)'

        tocarSom('encaixe')

        setTimeout(() => {
          caixa.element.style.backgroundImage = 'url(/nbl/caixafechada-boa.png)'

          caixa.element.classList.remove('brilho-vermelho')
          caixa.element.classList.add('brilho-laranja')
          caixa.interior.classList.remove('brilho-vermelho')
          caixa.interior.classList.add('brilho-laranja')

          caixa.fechar()
          etapaJogo = 'recolocar_parafusos'
          parafusosRestantes = 0
          caixa.resetParafusos()
          atualizarHUD()
        }, 500)
      }
    }

    function loop() {
      if (gameOver) return

      for (const obj of objects) {
        if (obj !== draggedObject) {
          obj.update()
        }
      }
    }

    function criarEstrelas() {
      for (let i = 0; i < 100; i++) {
        const estrela = document.createElement('div')
        estrela.className = 'estrela'

        estrela.style.left = `${Math.random() * WIDTH}px`
        estrela.style.top = `${Math.random() * HEIGHT}px`

        const tamanho = Math.random() * 2 + 1
        estrela.style.width = `${tamanho}px`
        estrela.style.height = `${tamanho}px`

        const duracaoPiscar = Math.random() * 3 + 2
        const duracaoMover = Math.random() * 5 + 3
        estrela.style.animationDuration = `${duracaoPiscar}s, ${duracaoMover}s`

        const delayPiscar = Math.random() * 5
        const delayMover = Math.random() * 3
        estrela.style.animationDelay = `${delayPiscar}s, ${delayMover}s`

        CONTAINER.appendChild(estrela)
      }
    }

    criarEstrelas()

    function criarMeteoro() {
      const meteoro = document.createElement('div')
      meteoro.className = 'meteoro'

      const startX = Math.random() * WIDTH
      const startY = -50

      meteoro.style.left = `${startX}px`
      meteoro.style.top = `${startY}px`

      const duracao = Math.random() * 2 + 1
      meteoro.style.animation = `meteoro-cair ${duracao}s linear`

      CONTAINER.appendChild(meteoro)

      setTimeout(() => {
        meteoro.remove()
      }, duracao * 1000)
    }

    function iniciarMeteoros() {
      criarMeteoro()
      const proximoMeteoro = Math.random() * 3000 + 1000
      setTimeout(iniciarMeteoros, proximoMeteoro)
    }

    iniciarMeteoros()

    const numParafusos = PARAFUSOS_POR_NIVEL[nivelAtual]
    parafusosRestantes = numParafusos
    caixa = new Caixa(WIDTH / 2 - 150, HEIGHT / 2 - 112, 300, 225, numParafusos)

    chaveDeFenda = new FloatingObject(
      100, 100, 90, 'transparent',
      30, 40,
      'chave', 'chavedefenda.png'
    )
    objects.push(chaveDeFenda)

    atualizarHUD()

    CONTAINER.addEventListener('gesturestart', function (e) {
      e.preventDefault()
    })

    let lastTouchEnd = 0
    CONTAINER.addEventListener('touchend', function (e) {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }, false)

    document.body.addEventListener('touchmove', function (e) {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }, { passive: false })

    setInterval(loop, TIME_STEP)

    const musica = document.getElementById('musica-fundo') as HTMLAudioElement
    const btnMusica = document.getElementById('btn-musica')
    const overlayMusica = document.getElementById('overlay-musica')
    let musicaTocando = false

    overlayMusica?.addEventListener('click', function () {
      if (musica) {
        musica.muted = false
        musica.play().then(() => {
          musicaTocando = true
          if (btnMusica) {
            btnMusica.textContent = '🔊'
            btnMusica.classList.remove('mutado')
          }
          if (overlayMusica) {
            overlayMusica.style.opacity = '0'
            overlayMusica.style.transition = 'opacity 0.5s'
            setTimeout(() => {
              overlayMusica.style.display = 'none'
              iniciarCronometro()
            }, 500)
          }
        }).catch(err => {
          console.log('Erro ao tocar música:', err)
        })
      }
    })

    btnMusica?.addEventListener('click', function () {
      if (musicaTocando) {
        musica?.pause()
        if (btnMusica) {
          btnMusica.textContent = '🔇'
          btnMusica.classList.add('mutado')
        }
        musicaTocando = false
      } else {
        musica?.play().catch(err => console.log('Erro ao tocar música:', err))
        if (btnMusica) {
          btnMusica.textContent = '🔊'
          btnMusica.classList.remove('mutado')
        }
        musicaTocando = true
      }
    })
  }

  return (
    <>
      <style jsx global>{`
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(45deg,
            #330000, #331100, #110033,
            #000033, #110022, #220033, #330000);
          background-size: 400% 400%;
          font-family: sans-serif;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          animation: rainbow-bg 10s ease infinite;
        }

        @keyframes rainbow-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        #simulador-container {
          width: 800px;
          height: 600px;
          max-width: 100vw;
          max-height: 100vh;
          border: 3px solid #ff0000;
          position: relative;
          overflow: hidden;
          background-color: #0f0f1a;
          box-shadow:
            0 0 20px rgba(255, 0, 0, 0.8),
            0 0 40px rgba(255, 0, 0, 0.6),
            inset 0 0 60px rgba(255, 0, 0, 0.3);
          cursor: default;
          touch-action: none;
          animation: borda-perigo 2s ease-in-out infinite;
        }

        @keyframes borda-perigo {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(255, 0, 0, 0.8),
              0 0 40px rgba(255, 0, 0, 0.6),
              inset 0 0 60px rgba(255, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 30px rgba(255, 0, 0, 1),
              0 0 60px rgba(255, 0, 0, 0.8),
              inset 0 0 80px rgba(255, 0, 0, 0.5);
          }
        }

        @media (max-width: 800px) {
          #simulador-container {
            width: 100vw;
            height: 100vh;
          }

          #instrucoes {
            font-size: 0.7em;
            max-width: 200px;
          }

          #hud {
            font-size: 0.8em;
          }
        }

        .object {
          position: absolute;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
          cursor: grab;
          z-index: 1100;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          transition: transform 0.2s ease-out;
        }

        .object:active {
          cursor: grabbing;
        }

        .object.dragging {
          z-index: 1200;
        }

        #instrucoes {
          position: absolute;
          top: 10px;
          left: 10px;
          color: #ffffff;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px 15px;
          border-radius: 5px;
          font-size: 0.85em;
          max-width: 300px;
          line-height: 1.4;
        }

        #hud {
          position: absolute;
          top: 10px;
          right: 10px;
          color: #00ff00;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px 15px;
          border-radius: 5px;
          font-size: 1em;
          font-weight: bold;
          text-align: right;
        }

        .parafuso-aviso {
          color: #ff3333;
          animation: pulse 1s infinite;
        }

        .tempo-critico {
          color: #ff3333 !important;
          animation: pulse 1s infinite;
          font-weight: bold;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .estrela {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: piscar linear infinite, mover-estrela linear infinite;
          pointer-events: none;
        }

        @keyframes piscar {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes mover-estrela {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(2px, -2px) scale(0.9); }
          50% { transform: translate(0, -4px) scale(0.8); }
          75% { transform: translate(-2px, -2px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }

        .meteoro {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #ffffff;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          filter: blur(0.5px);
        }

        .meteoro::before {
          content: '';
          position: absolute;
          width: 60px;
          height: 1.5px;
          background: linear-gradient(to right,
            rgba(255, 255, 255, 0.9),
            rgba(200, 230, 255, 0.6),
            rgba(150, 200, 255, 0.3),
            transparent);
          top: 50%;
          left: -60px;
          transform: translateY(-50%);
          filter: blur(1px);
        }

        .meteoro::after {
          content: '';
          position: absolute;
          width: 30px;
          height: 1px;
          background: linear-gradient(to right,
            rgba(255, 255, 255, 0.5),
            transparent);
          top: 50%;
          left: -30px;
          transform: translateY(-50%);
        }

        @keyframes meteoro-cair {
          0% {
            transform: translate(0, 0) rotate(-135deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(400px, 400px) rotate(-135deg);
            opacity: 0;
          }
        }

        @keyframes fusivel-fixar {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); }
          100% { transform: scale(1); }
        }

        @keyframes brilho-interativo {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(0, 255, 255, 1)) drop-shadow(0 0 25px rgba(0, 255, 255, 0.8));
          }
        }

        .interativo {
          animation: brilho-interativo 2s ease-in-out infinite;
        }

        .caixa {
          position: absolute;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          image-rendering: pixelated;
          z-index: 50;
          transition: filter 0.5s ease-out, box-shadow 0.5s ease-out;
        }

        .caixa.brilho-vermelho {
          filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.6)) drop-shadow(0 0 12px rgba(255, 0, 0, 0.3));
          animation: pulsar-vermelho 2s ease-in-out infinite;
        }

        .caixa.brilho-laranja {
          filter: drop-shadow(0 0 6px rgba(255, 165, 0, 0.6)) drop-shadow(0 0 12px rgba(255, 165, 0, 0.3));
          animation: pulsar-laranja 2s ease-in-out infinite;
        }

        .caixa.brilho-verde {
          filter: drop-shadow(0 0 6px rgba(0, 255, 0, 0.6)) drop-shadow(0 0 12px rgba(0, 255, 0, 0.3));
          animation: pulsar-verde 2s ease-in-out infinite;
        }

        @keyframes pulsar-vermelho {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.6)) drop-shadow(0 0 12px rgba(255, 0, 0, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 18px rgba(255, 0, 0, 0.4));
          }
        }

        @keyframes pulsar-laranja {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(255, 165, 0, 0.6)) drop-shadow(0 0 12px rgba(255, 165, 0, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.8)) drop-shadow(0 0 18px rgba(255, 165, 0, 0.4));
          }
        }

        @keyframes pulsar-verde {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(0, 255, 0, 0.6)) drop-shadow(0 0 12px rgba(0, 255, 0, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(0, 255, 0, 0.8)) drop-shadow(0 0 18px rgba(0, 255, 0, 0.4));
          }
        }

        .parafuso-slot {
          position: absolute;
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }

        .parafuso-slot.slot-interior {
          z-index: 70;
        }

        .parafuso-slot.ativo {
          animation: brilho-interativo 2s ease-in-out infinite;
        }

        @keyframes slot-piscar {
          0%, 100% {
            box-shadow: 0 0 10px rgba(255, 255, 0, 0.8), inset 0 0 15px rgba(255, 255, 0, 0.6);
            background-color: rgba(255, 255, 0, 0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px rgba(255, 255, 0, 1), inset 0 0 25px rgba(255, 255, 0, 0.8);
            background-color: rgba(255, 255, 0, 0.4);
            transform: scale(1.2);
          }
        }

        .parafuso-slot.piscar {
          animation: slot-piscar 0.8s ease-in-out infinite;
          border: 2px dashed rgba(255, 255, 0, 0.8);
          border-radius: 50%;
        }

        .vitoria {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          padding: 30px 50px;
          border-radius: 10px;
          font-size: 5em;
          font-weight: bold;
          display: none;
          z-index: 1000;
          text-shadow:
            0 0 20px rgba(0, 255, 255, 1),
            0 0 40px rgba(0, 255, 255, 0.8),
            0 0 60px rgba(0, 255, 255, 0.6),
            0 0 80px rgba(0, 255, 255, 0.4);
          animation: vitoria-pulse 1.5s ease-in-out infinite;
        }

        @keyframes vitoria-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        .confete {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          z-index: 999;
          animation: confete-cair linear forwards;
        }

        @keyframes confete-cair {
          0% {
            top: -10px;
            transform: rotate(0deg);
            opacity: 1;
          }
          100% {
            top: 110%;
            transform: rotate(720deg);
            opacity: 0.8;
          }
        }

        .particula-explosao {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #ff0000;
          border-radius: 50%;
          z-index: 999;
          animation: explosao-particula linear forwards;
        }

        @keyframes explosao-particula {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        @keyframes tela-tremer {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-10px, 5px); }
          20% { transform: translate(10px, -5px); }
          30% { transform: translate(-8px, 8px); }
          40% { transform: translate(8px, -8px); }
          50% { transform: translate(-6px, 6px); }
          60% { transform: translate(6px, -6px); }
          70% { transform: translate(-4px, 4px); }
          80% { transform: translate(4px, -4px); }
          90% { transform: translate(-2px, 2px); }
        }

        .game-over {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ff0000;
          padding: 30px 50px;
          border-radius: 10px;
          font-size: 5em;
          font-weight: bold;
          display: none;
          z-index: 1000;
          text-shadow:
            0 0 20px rgba(255, 0, 0, 1),
            0 0 40px rgba(255, 0, 0, 0.8),
            0 0 60px rgba(255, 0, 0, 0.6),
            0 0 80px rgba(255, 0, 0, 0.4);
          animation: vitoria-pulse 1.5s ease-in-out infinite;
          text-align: center;
        }

        .btn-reiniciar {
          margin-top: 30px;
          padding: 15px 40px;
          font-size: 0.4em;
          font-weight: bold;
          background: linear-gradient(135deg, #ff0000, #cc0000);
          color: #fff;
          border: 3px solid #fff;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        }

        .btn-reiniciar:hover {
          background: linear-gradient(135deg, #ff3333, #ff0000);
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
        }

        .btn-reiniciar:active {
          transform: scale(0.95);
        }

        .btn-musica {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 50px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid #00ffff;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5em;
          color: #00ffff;
          transition: all 0.3s;
          z-index: 1001;
          user-select: none;
        }

        .btn-musica:hover {
          background: rgba(0, 255, 255, 0.2);
          transform: translateX(-50%) scale(1.1);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        .btn-musica:active {
          transform: translateX(-50%) scale(0.9);
        }

        .btn-musica.mutado {
          color: #ff0000;
          border-color: #ff0000;
        }

        .btn-musica.mutado:hover {
          background: rgba(255, 0, 0, 0.2);
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        }
      `}</style>

      {mounted && (
        <>
          <audio id="musica-fundo" loop autoPlay muted>
            <source src="https://cdn.pixabay.com/download/audio/2025/03/04/audio_ca24b52b25.mp3?filename=lofi-girl-309226.mp3" type="audio/mpeg" />
          </audio>

          <audio id="som-parafuso" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" type="audio/mpeg" />
          </audio>
          <audio id="som-parafuso-solto" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3" type="audio/mpeg" />
          </audio>
          <audio id="som-caixa-abrir" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
          </audio>
          <audio id="som-fusivel" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" type="audio/mpeg" />
          </audio>
          <audio id="som-encaixe" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3" type="audio/mpeg" />
          </audio>
          <audio id="som-vitoria" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3" type="audio/mpeg" />
          </audio>
          <audio id="som-explosao" preload="auto">
            <source src="https://assets.mixkit.co/active_storage/sfx/2467/2467-preview.mp3" type="audio/mpeg" />
          </audio>

          <div
            id="overlay-musica"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              textAlign: 'center'
            }}
          >
            <button
              style={{
                color: '#fff',
                fontSize: '1.5em',
                background: 'rgba(0, 255, 255, 0.2)',
                padding: '20px 40px',
                border: '3px solid #00ffff',
                borderRadius: '15px',
                boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
                cursor: 'pointer',
                fontFamily: 'sans-serif',
                fontWeight: 'bold'
              }}
            >
              CLICK TO START
            </button>
            <p style={{ color: '#888', fontSize: '0.9em', marginTop: '20px' }}>🔊 Music will start</p>
          </div>

          <div id="simulador-container">
            <button id="btn-musica" className="btn-musica" title="Mute/Unmute music">🔊</button>
            <div id="instrucoes">
              <strong>MISSION:</strong> Replace the fuse in 45s!<br />
              1. Drag and drop the wrench on screws (3x each)<br />
              2. Remove the broken fuse<br />
              3. DON&apos;T let anything leave the screen!
            </div>
            <div id="hud">
              Time: <span id="tempo-count">45s</span><br />
              Screws: <span id="parafusos-count">4/4</span><br />
              <span id="aviso" className="parafuso-aviso" style={{ display: 'none' }}>⚠ WARNING!</span><br />
              <small id="debug-info" style={{ fontSize: '0.7em', color: '#888' }}></small>
            </div>
            <div id="vitoria" className="vitoria">
              <div id="vitoria-texto">YOU WIN!</div>
              <div id="nivel-texto" style={{ fontSize: '0.3em', marginTop: '20px' }}>LEVEL 1</div>
            </div>
            <div id="game-over" className="game-over">
              <div id="game-over-texto">GAME OVER</div>
              <div id="game-over-motivo" style={{ fontSize: '0.3em', marginTop: '10px', marginBottom: '20px' }}></div>
              <button className="btn-reiniciar" onClick={() => window.location.reload()}>RESTART</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

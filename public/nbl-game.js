// --- Configurações da Simulação ---
if (window.nblGameInitialized) {
  console.log('Jogo NBL já foi inicializado');
} else {
  window.nblGameInitialized = true;

const CONTAINER = document.getElementById('simulador-container');
if (!CONTAINER) {
  console.error('Container não encontrado!');
} else {
  const WIDTH = CONTAINER.clientWidth;
  const HEIGHT = CONTAINER.clientHeight;
  const DRAG_FACTOR = 0.998;
  const FPS = 60;
  const TIME_STEP = 1000 / FPS;
  const MARGIN_WARNING = 50;

  const objects = [];
  const parafusos = [];

  let isDragging = false;
  let draggedObject = null;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let dragStartTime = 0;
  let dragDistance = 0;

  let chaveDeFenda = null;
  let caixa = null;
  let parafusosRestantes = 4;
  let gameOver = false;
  let caixaAberta = false;
  let fusivelQuebrado = null;
  let fusivelNovo = null;
  let fusivelTrocado = false;
  let etapaJogo = 'remover_parafusos';

  class FloatingObject {
    constructor(x, y, radius, color, vx, vy, type = 'generic', shape = '●') {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.vx = vx;
      this.vy = vy;
      this.type = type;
      this.shape = shape;

      this.element = document.createElement('div');
      this.element.className = 'object';
      this.element.style.width = `${radius * 2}px`;
      this.element.style.height = `${radius * 2}px`;
      this.element.style.display = 'flex';
      this.element.style.alignItems = 'center';
      this.element.style.justifyContent = 'center';

      if (shape.endsWith('.png')) {
        this.element.style.backgroundImage = `url(/nbl/${shape})`;
        this.element.style.backgroundSize = 'contain';
        this.element.style.backgroundRepeat = 'no-repeat';
        this.element.style.backgroundPosition = 'center';
        this.element.style.imageRendering = 'pixelated';
        this.element.style.backgroundColor = 'transparent';
      } else {
        this.element.style.backgroundColor = color;
        this.element.style.fontSize = `${radius * 1.2}px`;
        this.element.textContent = shape;
      }

      this.element.style.transform = `translate(${this.x - this.radius}px, ${this.y - this.radius}px)`;
      CONTAINER.appendChild(this.element);

      this.element.addEventListener('mousedown', this.startDrag.bind(this));
      this.element.addEventListener('touchstart', this.startDrag.bind(this));
    }

    update() {
      if (gameOver) return;

      if (this.type === 'fusivel-fixo') {
        this.element.style.transform = `translate(${this.x - this.radius}px, ${this.y - this.radius}px)`;
        return;
      }

      this.x += this.vx * (TIME_STEP / 1000);
      this.y += this.vy * (TIME_STEP / 1000);

      this.vx *= DRAG_FACTOR;
      this.vy *= DRAG_FACTOR;

      if (this.type === 'parafuso' || this.type === 'chave' ||
          this.type === 'fusivel-quebrado' || this.type === 'fusivel-novo') {
        const margin = this.radius * 2;
        if (this.x < -margin || this.x > WIDTH + margin ||
            this.y < -margin || this.y > HEIGHT + margin) {
          triggerGameOver();
          return;
        }
      }

      const right = WIDTH - this.radius;
      const bottom = HEIGHT - this.radius;
      const left = this.radius;
      const top = this.radius;

      if (this.x < left) {
        this.x = left;
        this.vx *= -0.8;
      } else if (this.x > right) {
        this.x = right;
        this.vx *= -0.8;
      }

      if (this.y < top) {
        this.y = top;
        this.vy *= -0.8;
      } else if (this.y > bottom) {
        this.y = bottom;
        this.vy *= -0.8;
      }

      if (this.type === 'parafuso' || this.type === 'chave' ||
          this.type === 'fusivel-quebrado' || this.type === 'fusivel-novo') {
        const avisoEl = document.getElementById('aviso');
        if (avisoEl) {
          if (this.x < MARGIN_WARNING || this.x > WIDTH - MARGIN_WARNING ||
              this.y < MARGIN_WARNING || this.y > HEIGHT - MARGIN_WARNING) {
            avisoEl.style.display = 'block';
          } else {
            avisoEl.style.display = 'none';
          }
        }
      }

      this.element.style.transform = `translate(${this.x - this.radius}px, ${this.y - this.radius}px)`;
    }

    startDrag(e) {
      if (gameOver) return;
      if (this.type === 'fusivel-fixo') return;
      e.preventDefault();

      isDragging = true;
      draggedObject = this;
      dragStartTime = Date.now();
      dragDistance = 0;

      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;

      lastMouseX = clientX;
      lastMouseY = clientY;

      this.vx = 0;
      this.vy = 0;

      document.addEventListener('mousemove', drag, { passive: false });
      document.addEventListener('mouseup', endDrag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('touchend', endDrag);

      CONTAINER.style.cursor = 'grabbing';
    }
  }

  class Caixa {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.parafusosSlots = [];
      this.aberta = false;

      this.interior = document.createElement('div');
      this.interior.className = 'caixa';
      this.interior.style.left = `${x}px`;
      this.interior.style.top = `${y}px`;
      this.interior.style.width = `${width}px`;
      this.interior.style.height = `${height}px`;
      this.interior.style.backgroundImage = 'url(/nbl/caixaaberta.png)';
      this.interior.style.zIndex = '40';
      CONTAINER.appendChild(this.interior);

      this.element = document.createElement('div');
      this.element.className = 'caixa';
      this.element.style.left = `${x}px`;
      this.element.style.top = `${y}px`;
      this.element.style.width = `${width}px`;
      this.element.style.height = `${height}px`;
      this.element.style.backgroundImage = 'url(/nbl/caixafechada.png)';
      this.element.style.transition = 'transform 1s ease-out';
      this.element.style.zIndex = '50';
      CONTAINER.appendChild(this.element);

      const positions = [
        { x: 25, y: 2 },
        { x: 150, y: 2 },
        { x: 25, y: height - 28 },
        { x: 150, y: height - 28 }
      ];

      positions.forEach((pos, index) => {
        const slot = document.createElement('div');
        slot.className = 'parafuso-slot';
        slot.style.left = `${pos.x}px`;
        slot.style.top = `${pos.y}px`;
        slot.style.backgroundImage = 'url(/nbl/parafusopreso.png)';
        slot.style.backgroundSize = 'contain';
        slot.style.backgroundRepeat = 'no-repeat';
        slot.style.backgroundPosition = 'center';
        slot.style.imageRendering = 'pixelated';

        this.element.appendChild(slot);
        this.parafusosSlots.push({
          x: this.x + pos.x + 12,
          y: this.y + pos.y + 12,
          slot,
          index
        });
      });
    }

    abrir() {
      this.aberta = true;
      this.element.style.transformOrigin = 'top center';
      this.element.style.transformStyle = 'preserve-3d';
      this.element.style.transform = 'perspective(800px) rotateX(-110deg) translateY(-30px)';
    }

    fechar() {
      this.aberta = false;
      this.element.style.transform = 'perspective(800px) rotateX(0deg) translateY(0px)';
    }

    resetParafusos() {
      this.parafusosSlots.forEach(slot => {
        slot.toques = 0;
        slot.slot.style.backgroundImage = 'none';
        slot.slot.style.transform = 'rotate(0deg)';
        slot.slot.style.filter = 'none';
      });
    }

    checkParafusoClick(obj, clicked = false) {
      if (obj.type !== 'chave') return;

      if (etapaJogo === 'remover_parafusos') {
        for (let i = 0; i < this.parafusosSlots.length; i++) {
          const slot = this.parafusosSlots[i];
          if (!slot.removed && !slot.processando) {
            const dx = obj.x - slot.x;
            const dy = obj.y - slot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 80 && clicked) {
              if (!slot.toques) slot.toques = 0;
              slot.toques++;

              const rotation = slot.toques * 120;
              slot.slot.style.transform = `rotate(${rotation}deg)`;
              slot.slot.style.transition = 'transform 0.3s';

              if (slot.toques === 1) {
                slot.slot.style.filter = 'brightness(1.2) hue-rotate(30deg)';
              } else if (slot.toques === 2) {
                slot.slot.style.filter = 'brightness(1.3) hue-rotate(60deg)';
              }

              if (slot.toques >= 3) {
                slot.processando = true;

                setTimeout(() => {
                  slot.removed = true;
                  slot.slot.style.backgroundImage = 'none';
                  slot.slot.style.transform = 'rotate(0deg)';
                  slot.slot.style.filter = 'none';

                  const parafuso = new FloatingObject(
                    slot.x, slot.y, 15, 'transparent',
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 150,
                    'parafuso', 'parafusosolto.png'
                  );
                  parafusos.push(parafuso);
                  objects.push(parafuso);

                  parafusosRestantes--;
                  atualizarHUD();

                  if (parafusosRestantes === 0) {
                    setTimeout(abrirCaixa, 500);
                  }
                }, 300);
              }
              return;
            }
          }
        }
      }
    }

    checkParafusoProximo(parafusoObj) {
      if (etapaJogo !== 'recolocar_parafusos') return false;

      let slotMaisProximo = null;
      let menorDist = 50;

      for (let i = 0; i < this.parafusosSlots.length; i++) {
        const slot = this.parafusosSlots[i];

        if (slot.removed) {
          const dx = parafusoObj.x - slot.x;
          const dy = parafusoObj.y - slot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < menorDist) {
            menorDist = dist;
            slotMaisProximo = slot;
          }
        }
      }

      if (slotMaisProximo) {
        parafusoObj.element.remove();
        const index = objects.indexOf(parafusoObj);
        if (index > -1) objects.splice(index, 1);
        const index2 = parafusos.indexOf(parafusoObj);
        if (index2 > -1) parafusos.splice(index2, 1);

        slotMaisProximo.removed = false;
        slotMaisProximo.toques = 0;
        slotMaisProximo.slot.style.backgroundImage = 'url(/nbl/parafusopreso.png)';
        slotMaisProximo.slot.style.transform = 'rotate(0deg)';
        slotMaisProximo.slot.style.filter = 'none';

        parafusosRestantes++;
        atualizarHUD();

        caixa.element.style.filter = 'brightness(1.3)';
        setTimeout(() => {
          caixa.element.style.filter = 'brightness(1)';
        }, 300);

        if (parafusosRestantes === 4) {
          setTimeout(triggerVitoria, 500);
        }

        return true;
      }

      return false;
    }
  }

  function drag(e) {
    if (!isDragging || !draggedObject) return;
    e.preventDefault();

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    const deltaX = clientX - lastMouseX;
    const deltaY = clientY - lastMouseY;

    dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

    draggedObject.x += deltaX;
    draggedObject.y += deltaY;

    draggedObject.vx = deltaX / (TIME_STEP / 1000);
    draggedObject.vy = deltaY / (TIME_STEP / 1000);

    lastMouseX = clientX;
    lastMouseY = clientY;

    if (draggedObject.type === 'parafuso' && caixa && etapaJogo === 'recolocar_parafusos') {
      highlightNearbySlot(draggedObject);
    }

    if (draggedObject.type === 'fusivel-quebrado' && etapaJogo === 'trocar_fusivel') {
      checkRemoverFusivel(draggedObject);
    }
    if (draggedObject.type === 'fusivel-novo' && etapaJogo === 'fechar_caixa') {
      checkColocarFusivel(draggedObject);
    }

    draggedObject.element.style.transform = `translate(${draggedObject.x - draggedObject.radius}px, ${draggedObject.y - draggedObject.radius}px)`;
  }

  function highlightNearbySlot(parafusoObj) {
    if (!caixa || !caixa.parafusosSlots) return;

    let slotMaisProximo = null;
    let menorDist = 50;

    for (let i = 0; i < caixa.parafusosSlots.length; i++) {
      const slot = caixa.parafusosSlots[i];

      if (slot.removed) {
        const dx = parafusoObj.x - slot.x;
        const dy = parafusoObj.y - slot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < menorDist) {
          menorDist = dist;
          slotMaisProximo = slot;
        }
      }
    }

    if (slotMaisProximo) {
      caixa.element.style.filter = 'brightness(1.2)';
      const debugInfo = document.getElementById('debug-info');
      if (debugInfo) debugInfo.textContent = `Dist: ${Math.round(menorDist)}px | ENCAIXA!`;
    } else {
      caixa.element.style.filter = 'brightness(1)';
      const debugInfo = document.getElementById('debug-info');
      if (debugInfo) debugInfo.textContent = '';
    }
  }

  function endDrag() {
    if (!isDragging) return;

    const dragDuration = Date.now() - dragStartTime;
    const wasClick = dragDistance < 10 && dragDuration < 300;

    if (wasClick && draggedObject.type === 'chave' && caixa) {
      caixa.checkParafusoClick(draggedObject, true);
    }

    if (draggedObject && draggedObject.type === 'parafuso' && caixa) {
      const encaixou = caixa.checkParafusoProximo(draggedObject);
      caixa.element.style.filter = 'brightness(1)';

      if (encaixou) {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', endDrag);
        isDragging = false;
        draggedObject = null;
        CONTAINER.style.cursor = 'default';
        return;
      }
    }

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', endDrag);

    isDragging = false;
    draggedObject = null;
    CONTAINER.style.cursor = 'default';
  }

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'block';
  }

  function triggerVitoria() {
    if (gameOver) return;
    gameOver = true;
    const vitoriaEl = document.getElementById('vitoria');
    if (vitoriaEl) vitoriaEl.style.display = 'block';
    const avisoEl = document.getElementById('aviso');
    if (avisoEl) avisoEl.style.display = 'none';
  }

  function atualizarHUD() {
    const instrucoes = document.getElementById('instrucoes');
    const parafusosCount = document.getElementById('parafusos-count');

    if (etapaJogo === 'remover_parafusos') {
      if (instrucoes) instrucoes.innerHTML = `<strong>ETAPA 1:</strong> Remova os parafusos<br>Clique 3x em cada parafuso com a chave`;
      if (parafusosCount) parafusosCount.textContent = `${parafusosRestantes}/4`;
    } else if (etapaJogo === 'trocar_fusivel') {
      if (instrucoes) instrucoes.innerHTML = `<strong>ETAPA 2:</strong> Troca de fusível<br>Arraste o fusível quebrado para fora`;
      if (parafusosCount) parafusosCount.textContent = '✓';
    } else if (etapaJogo === 'fechar_caixa') {
      if (instrucoes) instrucoes.innerHTML = `<strong>ETAPA 3:</strong> Instalar fusível novo<br>Arraste o fusível verde para a caixa`;
      if (parafusosCount) parafusosCount.textContent = '✓';
    } else if (etapaJogo === 'recolocar_parafusos') {
      if (instrucoes) instrucoes.innerHTML = `<strong>ETAPA 4:</strong> Fechar a caixa<br>Arraste os parafusos de volta aos seus lugares`;
      if (parafusosCount) parafusosCount.textContent = `${parafusosRestantes}/4`;
    }
  }

  function abrirCaixa() {
    etapaJogo = 'trocar_fusivel';
    caixa.abrir();
    atualizarHUD();

    setTimeout(() => {
      fusivelQuebrado = new FloatingObject(
        caixa.x + caixa.width / 2,
        caixa.y + caixa.height / 2,
        20, 'transparent',
        0, 0,
        'fusivel-quebrado', 'fusivelquebrado.png'
      );
      objects.push(fusivelQuebrado);
    }, 1000);
  }

  function checkRemoverFusivel(obj) {
    const distDaCaixa = Math.sqrt(
      Math.pow(obj.x - (caixa.x + caixa.width / 2), 2) +
      Math.pow(obj.y - (caixa.y + caixa.height / 2), 2)
    );

    if (distDaCaixa > 100 && !fusivelTrocado) {
      fusivelTrocado = true;
      etapaJogo = 'fechar_caixa';
      atualizarHUD();

      obj.type = 'lixo';

      fusivelNovo = new FloatingObject(
        150, HEIGHT - 100,
        20, 'transparent',
        50, -30,
        'fusivel-novo', 'fusivel.png'
      );
      objects.push(fusivelNovo);
    }
  }

  function checkColocarFusivel(obj) {
    const distDaCaixa = Math.sqrt(
      Math.pow(obj.x - (caixa.x + caixa.width / 2), 2) +
      Math.pow(obj.y - (caixa.y + caixa.height / 2), 2)
    );

    if (distDaCaixa < 50) {
      obj.vx = 0;
      obj.vy = 0;
      obj.x = caixa.x + caixa.width / 2;
      obj.y = caixa.y + caixa.height / 2;
      obj.type = 'fusivel-fixo';
      obj.element.style.zIndex = '5';
      obj.element.style.cursor = 'default';

      setTimeout(() => {
        caixa.fechar();
        etapaJogo = 'recolocar_parafusos';
        parafusosRestantes = 0;
        caixa.resetParafusos();
        atualizarHUD();
      }, 500);
    }
  }

  function loop() {
    if (gameOver) return;

    for (const obj of objects) {
      if (obj !== draggedObject) {
        obj.update();
      }
    }
  }

  // Inicialização
  caixa = new Caixa(WIDTH / 2 - 100, HEIGHT / 2 - 75, 200, 150);

  chaveDeFenda = new FloatingObject(
    100, 100, 100, 'transparent',
    30, 40,
    'chave', 'chavedefenda.png'
  );
  objects.push(chaveDeFenda);

  atualizarHUD();

  setInterval(loop, TIME_STEP);
}
}

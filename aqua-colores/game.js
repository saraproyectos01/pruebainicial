/**
 * Aqua Colores - Motor del Juego Acuático 8x8 Bubble Shooter
 * Efectos de agua líquida, fusiones, nombres inventados, coordenadas A-H / 1-8,
 * screen shake, Web Audio API y control por texto / voz.
 */

(() => {
  'use strict';

  // Configuración del tablero
  const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ROWS = [1, 2, 3, 4, 5, 6, 7, 8];
  const GRID_SIZE = 8;

  // Paleta de colores acuáticos brillantes
  const COLORS = [
    { id: 'blue', name: 'Azul Océano', hex: '#3b82f6' },
    { id: 'cyan', name: 'Cian Cristalino', hex: '#06b6d4' },
    { id: 'green', name: 'Verde Esmeralda', hex: '#10b981' },
    { id: 'red', name: 'Rojo Rubí', hex: '#ef4444' },
    { id: 'yellow', name: 'Amarillo Ámbar', hex: '#eab308' },
    { id: 'orange', name: 'Naranja Cítrico', hex: '#f97316' },
    { id: 'purple', name: 'Púrpura Amatista', hex: '#a855f7' }
  ];

  // Generador de nombres inventados acuáticos y simpáticos
  const INVENTED_NAMES = [
    'zumi', 'onka', 'treli', 'pluki', 'bloop', 'kiri', 'vixo', 'glupi',
    'naxi', 'ponto', 'wavy', 'zorba', 'lumo', 'droppy', 'suki', 'fizz',
    'bimi', 'tuki', 'yopa', 'riki', 'miko', 'zeno', 'aquix', 'plof',
    'walu', 'kero', 'flub', 'zora', 'blip', 'drax', 'nuba', 'queli',
    'milo', 'xana', 'splish', 'gobi', 'yumi', 'zuka', 'frip', 'chofi'
  ];

  const EVOLVED_PREFIXES = ['Mega-', 'Super-', 'Gran-', 'Aero-', 'Ultra-', 'Aqua-'];

  // Estado del juego
  let board = []; // Matriz 8x8 conteniendo objetos de gota o null
  let score = 0;
  let mergesCount = 0;
  let maxLevel = 1;
  let soundEnabled = true;

  // Cañón / Shooter
  let currentDrop = null;
  let nextDrop = null;
  let isShooting = false;

  // Objetivo apuntado actualmente
  let target = {
    col: null,  // 0 a 7
    row: null,  // 0 a 7
    direction: 'top' // 'top', 'bottom', 'left', 'right'
  };

  // Web Audio Context
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Sintetizador de sonidos de agua (Web Audio API)
  function playWaterDropSound(freq = 600) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      osc.type = 'sine';
      // Rápida subida de tono (característico de la burbuja / gota de agua al nacer)
      osc.frequency.setValueAtTime(freq * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn(e);
    }
  }

  function playMergeSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      // Sonido de coalescencia / absorción líquida vibrante
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.3);

      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.exponentialRampToValueAtTime(550, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch (e) {
      console.warn(e);
    }
  }

  function playClashSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      // Sonido de choque elástico acuático con caída
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      console.warn(e);
    }
  }

  // Generador de nombres
  function getRandomName() {
    return INVENTED_NAMES[Math.floor(Math.random() * INVENTED_NAMES.length)];
  }

  function getEvolvedName(baseName, level) {
    const prefix = EVOLVED_PREFIXES[(level - 2) % EVOLVED_PREFIXES.length] || 'Mega-';
    return `${prefix}${baseName}`;
  }

  function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  // Crear una nueva gota
  function createDrop(col, row, forcedColor = null, forcedName = null, level = 1) {
    const colorObj = forcedColor || getRandomColor();
    const name = forcedName || getRandomName();
    return {
      id: `${COLS[col]}${ROWS[row]}`,
      col,
      row,
      color: colorObj.id,
      colorName: colorObj.name,
      name,
      level,
      wobbleOffset: Math.random() * 2
    };
  }

  // Inicializar el tablero 8x8 con una distribución inicial de gotas de agua
  function initBoard() {
    board = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      board[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        // Llenar las primeras 5 filas para dejar espacio de juego o llenar completo con variedad
        // Llenamos el tablero completo de inicio como solicita el usuario:
        // "tablero cuadrado de 8x8 lleno de bolas brilantes de colores"
        board[r][c] = createDrop(c, r);
      }
    }

    currentDrop = {
      color: getRandomColor().id,
      name: getRandomName(),
      level: 1
    };

    nextDrop = {
      color: getRandomColor().id,
      name: getRandomName(),
      level: 1
    };

    // Apuntar por defecto a la columna C (C3 o columna C)
    target.col = 2; // Columna C
    target.row = 2; // Fila 3 (C3)
    target.direction = 'top';

    score = 0;
    mergesCount = 0;
    maxLevel = 1;
    updateStatsDisplay();
    renderShooterPreview();
    renderBoard();
    updateTargetReticle();
  }

  // Elementos DOM
  const gridBoard = document.getElementById('gridBoard');
  const topColHeaders = document.getElementById('topColHeaders');
  const bottomColHeaders = document.getElementById('bottomColHeaders');
  const leftRowHeaders = document.getElementById('leftRowHeaders');
  const rightRowHeaders = document.getElementById('rightRowHeaders');
  const legendColors = document.getElementById('legendColors');

  const currentBubblePreview = document.getElementById('currentBubblePreview');
  const currentBubbleName = document.getElementById('currentBubbleName');
  const nextBubblePreview = document.getElementById('nextBubblePreview');
  const targetIndicatorBox = document.getElementById('targetIndicatorBox');
  const targetCoord = document.getElementById('targetCoord');
  const targetName = document.getElementById('targetName');
  const targetSize = document.getElementById('targetSize');

  const btnFireDrop = document.getElementById('btnFireDrop');
  const commandInput = document.getElementById('commandInput');
  const commandForm = document.getElementById('commandForm');
  const btnVoiceCommand = document.getElementById('btnVoiceCommand');
  const speechResult = document.getElementById('speechResult');
  const voiceStatusText = document.getElementById('voiceStatusText');

  const scoreDisplay = document.getElementById('scoreDisplay');
  const mergesDisplay = document.getElementById('mergesDisplay');
  const maxLevelDisplay = document.getElementById('maxLevelDisplay');
  const soundToggle = document.getElementById('soundToggle');
  const resetGameBtn = document.getElementById('resetGameBtn');
  const gameWrapper = document.getElementById('gameWrapper');

  // Sistema de partículas de agua en Canvas
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    if (gridBoard && canvas) {
      canvas.width = gridBoard.clientWidth;
      canvas.height = gridBoard.clientHeight;
    }
  }

  function spawnSplashParticles(x, y, colorHex) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: colorHex || '#38bdf8',
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // Gravedad suave de líquido
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Brillo especular en la partícula
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(updateParticles);
  }

  // Generar la botonera de flechas en los 4 bordes (A-H y 1-8)
  function buildBoardBorders() {
    // 1. Columnas superiores A - H con flecha hacia abajo (↓)
    topColHeaders.innerHTML = '';
    COLS.forEach((colLetter, cIndex) => {
      const btn = document.createElement('button');
      btn.className = 'col-btn';
      btn.dataset.col = cIndex;
      btn.dataset.dir = 'top';
      btn.title = `Apuntar a columna ${colLetter} desde arriba`;
      btn.innerHTML = `
        <span class="col-letter">${colLetter}</span>
        <span class="arrow-icon">↓</span>
      `;
      btn.addEventListener('click', () => {
        initAudio();
        target.col = cIndex;
        target.direction = 'top';
        // Seleccionar la gota disponible en esa columna
        target.row = findFirstOccupiedRowInCol(cIndex, 'top') ?? 0;
        playWaterDropSound(520);
        updateTargetReticle();
      });
      topColHeaders.appendChild(btn);
    });

    // 2. Columnas inferiores A - H con flecha hacia arriba (↑)
    bottomColHeaders.innerHTML = '';
    COLS.forEach((colLetter, cIndex) => {
      const btn = document.createElement('button');
      btn.className = 'col-btn';
      btn.dataset.col = cIndex;
      btn.dataset.dir = 'bottom';
      btn.title = `Apuntar a columna ${colLetter} desde abajo`;
      btn.innerHTML = `
        <span class="arrow-icon">↑</span>
        <span class="col-letter">${colLetter}</span>
      `;
      btn.addEventListener('click', () => {
        initAudio();
        target.col = cIndex;
        target.direction = 'bottom';
        target.row = findFirstOccupiedRowInCol(cIndex, 'bottom') ?? 7;
        playWaterDropSound(520);
        updateTargetReticle();
      });
      bottomColHeaders.appendChild(btn);
    });

    // 3. Filas izquierdas 1 - 8 con flecha hacia la derecha (→)
    leftRowHeaders.innerHTML = '';
    ROWS.forEach((rowNum, rIndex) => {
      const btn = document.createElement('button');
      btn.className = 'row-btn';
      btn.dataset.row = rIndex;
      btn.dataset.dir = 'left';
      btn.title = `Apuntar a fila ${rowNum} desde la izquierda`;
      btn.innerHTML = `
        <span class="row-num">${rowNum}</span>
        <span class="arrow-icon">→</span>
      `;
      btn.addEventListener('click', () => {
        initAudio();
        target.row = rIndex;
        target.direction = 'left';
        target.col = findFirstOccupiedColInRow(rIndex, 'left') ?? 0;
        playWaterDropSound(480);
        updateTargetReticle();
      });
      leftRowHeaders.appendChild(btn);
    });

    // 4. Filas derechas 1 - 8 con flecha hacia la izquierda (←)
    rightRowHeaders.innerHTML = '';
    ROWS.forEach((rowNum, rIndex) => {
      const btn = document.createElement('button');
      btn.className = 'row-btn';
      btn.dataset.row = rIndex;
      btn.dataset.dir = 'right';
      btn.title = `Apuntar a fila ${rowNum} desde la derecha`;
      btn.innerHTML = `
        <span class="arrow-icon">←</span>
        <span class="row-num">${rowNum}</span>
      `;
      btn.addEventListener('click', () => {
        initAudio();
        target.row = rIndex;
        target.direction = 'right';
        target.col = findFirstOccupiedColInRow(rIndex, 'right') ?? 7;
        playWaterDropSound(480);
        updateTargetReticle();
      });
      rightRowHeaders.appendChild(btn);
    });

    // 5. Leyenda de colores disponibles
    legendColors.innerHTML = '';
    COLORS.forEach(c => {
      const chip = document.createElement('div');
      chip.className = 'legend-chip';
      chip.innerHTML = `
        <span class="legend-dot" style="background: ${c.hex}"></span>
        <span>${c.name}</span>
      `;
      legendColors.appendChild(chip);
    });
  }

  function findFirstOccupiedRowInCol(c, dir) {
    if (dir === 'top') {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (board[r][c]) return r;
      }
    } else {
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (board[r][c]) return r;
      }
    }
    return null;
  }

  function findFirstOccupiedColInRow(r, dir) {
    if (dir === 'left') {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c]) return c;
      }
    } else {
      for (let c = GRID_SIZE - 1; c >= 0; c--) {
        if (board[r][c]) return c;
      }
    }
    return null;
  }

  // Renderizar la cuadrícula 8x8
  function renderBoard() {
    gridBoard.innerHTML = '';

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const coordName = `${COLS[c]}${ROWS[r]}`;
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.col = c;
        cell.dataset.row = r;
        cell.dataset.coord = coordName;

        // Indicador de coordenada de fondo
        const coordBg = document.createElement('span');
        coordBg.className = 'cell-coord-bg';
        coordBg.textContent = coordName;
        cell.appendChild(coordBg);

        const drop = board[r][c];
        if (drop) {
          const dropEl = document.createElement('div');
          dropEl.className = `water-drop drop-color-${drop.color} drop-lvl-${drop.level} wobble`;
          dropEl.dataset.col = c;
          dropEl.dataset.row = r;
          dropEl.dataset.name = drop.name.toLowerCase();

          dropEl.innerHTML = `
            <div class="bubble-reflection"></div>
            <div class="bubble-reflection-secondary"></div>
            <span class="bubble-name">${drop.name}</span>
            ${drop.level > 1 ? `<span class="bubble-size-badge">Niv.${drop.level}</span>` : ''}
          `;

          cell.appendChild(dropEl);
        }

        // Click en la celda para apuntar a ella
        cell.addEventListener('click', () => {
          initAudio();
          aimAt(c, r);
          playWaterDropSound(580);
        });

        gridBoard.appendChild(cell);
      }
    }

    resizeCanvas();
  }

  // Actualizar la vista previa del lanzador y siguiente gota
  function renderShooterPreview() {
    if (!currentDrop) return;

    // Quitar clases previas de color
    currentBubblePreview.className = 'liquid-bubble-preview';
    currentBubblePreview.classList.add(`drop-color-${currentDrop.color}`);
    currentBubbleName.textContent = currentDrop.name;

    // Siguiente gota
    nextBubblePreview.className = 'mini-drop';
    nextBubblePreview.classList.add(`drop-color-${nextDrop.color}`);
  }

  // Apuntar a una gota por columna y fila
  function aimAt(col, row) {
    target.col = col;
    target.row = row;
    updateTargetReticle();
  }

  // Actualizar el halo / flechas activas según el objetivo
  function updateTargetReticle() {
    // 1. Quitar clases activas en todas las flechas
    document.querySelectorAll('.col-btn').forEach(btn => btn.classList.remove('active-target'));
    document.querySelectorAll('.row-btn').forEach(btn => btn.classList.remove('active-target'));
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('selected-target'));

    if (target.col !== null) {
      document.querySelectorAll(`.col-btn[data-col="${target.col}"]`).forEach(btn => btn.classList.add('active-target'));
    }

    if (target.row !== null) {
      document.querySelectorAll(`.row-btn[data-row="${target.row}"]`).forEach(btn => btn.classList.add('active-target'));
    }

    if (target.col !== null && target.row !== null) {
      const cell = document.querySelector(`.cell[data-col="${target.col}"][data-row="${target.row}"]`);
      if (cell) cell.classList.add('selected-target');

      const drop = board[target.row][target.col];
      targetCoord.textContent = `${COLS[target.col]}${ROWS[target.row]}`;
      if (drop) {
        targetName.textContent = drop.name;
        targetSize.textContent = `(Niv. ${drop.level} - ${drop.colorName || drop.color})`;
      } else {
        targetName.textContent = 'Vacía';
        targetSize.textContent = '';
      }
    } else {
      targetCoord.textContent = '--';
      targetName.textContent = 'Ninguna';
      targetSize.textContent = '';
    }
  }

  // Sacudir la pantalla cuando chocan colores distintos
  function triggerScreenShake() {
    gameWrapper.classList.remove('screen-shake');
    // Forzar reflow para reiniciar la animación CSS
    void gameWrapper.offsetWidth;
    gameWrapper.classList.add('screen-shake');
    setTimeout(() => {
      gameWrapper.classList.remove('screen-shake');
    }, 500);
  }

  // Disparar gota hacia el objetivo apuntado
  async function fireDrop() {
    if (isShooting) return;
    initAudio();

    if (target.col === null || target.row === null) {
      // Apuntar a C3 por defecto si no hay nada seleccionado
      aimAt(2, 2);
    }

    isShooting = true;
    btnFireDrop.disabled = true;

    const col = target.col;
    const row = target.row;
    const projectile = { ...currentDrop };

    // Siguiente gota pasa a ser la actual
    currentDrop = { ...nextDrop };
    nextDrop = {
      color: getRandomColor().id,
      name: getRandomName(),
      level: 1
    };
    renderShooterPreview();

    playWaterDropSound(700);

    // Identificar el impacto en el carril elegido:
    // Si la celda objetivo tiene una gota: interactuamos directamente con ella.
    // Si no, buscamos la primera gota en esa línea.
    let targetRow = row;
    let targetCol = col;
    let hitDrop = board[targetRow][targetCol];

    if (!hitDrop) {
      // Buscar primera gota en la columna desde arriba o abajo
      if (target.direction === 'bottom') {
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (board[r][col]) {
            targetRow = r;
            hitDrop = board[r][col];
            break;
          }
        }
      } else {
        for (let r = 0; r < GRID_SIZE; r++) {
          if (board[r][col]) {
            targetRow = r;
            hitDrop = board[r][col];
            break;
          }
        }
      }
    }

    // Efecto de impacto
    if (hitDrop) {
      const cellTarget = document.querySelector(`.cell[data-col="${targetCol}"][data-row="${targetRow}"]`);
      const rect = cellTarget ? cellTarget.getBoundingClientRect() : null;
      const boardRect = gridBoard.getBoundingClientRect();
      const splashX = rect ? (rect.left - boardRect.left + rect.width / 2) : 100;
      const splashY = rect ? (rect.top - boardRect.top + rect.height / 2) : 100;

      // =========================================================================
      // CASO 1: MISMO COLOR -> ¡FUSIÓN Y CRECIMIENTO!
      // =========================================================================
      if (hitDrop.color === projectile.color) {
        // Coalescencia de agua: la bola se hace MÁS GRANDE
        hitDrop.level = Math.min(4, hitDrop.level + 1);
        if (hitDrop.level > maxLevel) {
          maxLevel = hitDrop.level;
        }

        // Nombre evolucionado
        hitDrop.name = getEvolvedName(hitDrop.name, hitDrop.level);
        mergesCount++;
        score += 150 * hitDrop.level;

        playMergeSound();
        spawnSplashParticles(splashX, splashY, COLORS.find(c => c.id === hitDrop.color)?.hex);

        renderBoard();
        updateTargetReticle();

        // Animación de pop en la celda
        const updatedCell = document.querySelector(`.cell[data-col="${targetCol}"][data-row="${targetRow}"] .water-drop`);
        if (updatedCell) {
          updatedCell.classList.add('drop-merging');
        }

        // Comprobar fusiones en cadena con vecinas adyacentes del mismo color
        await checkChainMerges(targetCol, targetRow, hitDrop.color);

      } else {
        // =========================================================================
        // CASO 2: DISTINTO COLOR -> ¡CHOCAN, SCREEN SHAKE Y CAMBIAN DE NOMBRE!
        // "cada vez que toque un color a otro los dos cambien a nombres nuevos inventados y se mueva la pantalla"
        // =========================================================================
        triggerScreenShake();
        playClashSound();

        // Cambiar a nuevos nombres inventados ambas gotas
        const oldTargetName = hitDrop.name;
        const oldProjectileName = projectile.name;
        hitDrop.name = getRandomName();
        projectile.name = getRandomName();

        // Partículas de choque de agua
        spawnSplashParticles(splashX, splashY, '#38bdf8');

        // Buscar una celda vacía vecina donde pueda asentarse la gota disparada
        const emptySlot = findAdjacentEmptyCell(targetCol, targetRow);
        if (emptySlot) {
          board[emptySlot.r][emptySlot.c] = {
            id: `${COLS[emptySlot.c]}${ROWS[emptySlot.r]}`,
            col: emptySlot.c,
            row: emptySlot.r,
            color: projectile.color,
            colorName: COLORS.find(c => c.id === projectile.color)?.name,
            name: projectile.name,
            level: 1,
            wobbleOffset: Math.random() * 2
          };
        }

        score += 25;
        renderBoard();
        updateTargetReticle();

        // Destello de cambio de nombre
        const dropEl = document.querySelector(`.cell[data-col="${targetCol}"][data-row="${targetRow}"] .water-drop`);
        if (dropEl) {
          dropEl.classList.add('name-changed');
        }
      }
    } else {
      // Si la celda estaba vacía, se coloca allí
      board[targetRow][targetCol] = {
        id: `${COLS[targetCol]}${ROWS[targetRow]}`,
        col: targetCol,
        row: targetRow,
        color: projectile.color,
        colorName: COLORS.find(c => c.id === projectile.color)?.name,
        name: projectile.name,
        level: 1,
        wobbleOffset: Math.random() * 2
      };
      playWaterDropSound(500);
      renderBoard();
      updateTargetReticle();
    }

    updateStatsDisplay();

    setTimeout(() => {
      isShooting = false;
      btnFireDrop.disabled = false;
    }, 300);
  }

  // Buscar celda vecina vacía
  function findAdjacentEmptyCell(col, row) {
    const deltas = [
      { c: 0, r: -1 }, { c: 0, r: 1 },
      { c: -1, r: 0 }, { c: 1, r: 0 }
    ];
    for (const d of deltas) {
      const nc = col + d.c;
      const nr = row + d.r;
      if (nc >= 0 && nc < GRID_SIZE && nr >= 0 && nr < GRID_SIZE && !board[nr][nc]) {
        return { c: nc, r: nr };
      }
    }
    return null;
  }

  // Fusiones en cadena de gotas del mismo color que se tocan
  async function checkChainMerges(col, row, color) {
    const neighbors = [
      { c: col, r: row - 1 },
      { c: col, r: row + 1 },
      { c: col - 1, r: row },
      { c: col + 1, r: row }
    ];

    for (const n of neighbors) {
      if (n.c >= 0 && n.c < GRID_SIZE && n.r >= 0 && n.r < GRID_SIZE) {
        const neighborDrop = board[n.r][n.c];
        if (neighborDrop && neighborDrop.color === color) {
          // Fusionar con la gota principal
          const mainDrop = board[row][col];
          if (mainDrop) {
            mainDrop.level = Math.min(4, mainDrop.level + 1);
            mainDrop.name = getEvolvedName(mainDrop.name, mainDrop.level);
            // La vecina absorbida queda vacía
            board[n.r][n.c] = null;
            mergesCount++;
            score += 200 * mainDrop.level;

            playMergeSound();
            renderBoard();
            updateTargetReticle();
            break;
          }
        }
      }
    }
  }

  // Actualizar marcador
  function updateStatsDisplay() {
    scoreDisplay.textContent = score.toLocaleString();
    mergesDisplay.textContent = mergesCount;
    maxLevelDisplay.textContent = `Niv. ${maxLevel}`;
  }

  // =========================================================================
  // SISTEMA DE COMANDOS DE TEXTO Y VOZ: "C3", "A1", O NOMBRES "ZUMI", "ONKA"
  // =========================================================================

  // Parsear texto para buscar coordenada o nombre
  function parseAndAim(rawQuery) {
    if (!rawQuery) return false;
    initAudio();
    const query = rawQuery.trim().toLowerCase().replace(/\s+/g, '');

    // 1. Verificar si coincide con coordenada A1 a H8
    const coordRegex = /^([a-h])([1-8])$/i;
    const coordMatch = query.match(coordRegex);

    if (coordMatch) {
      const colLetter = coordMatch[1].toUpperCase();
      const rowNum = parseInt(coordMatch[2], 10);
      const cIndex = COLS.indexOf(colLetter);
      const rIndex = ROWS.indexOf(rowNum);

      if (cIndex !== -1 && rIndex !== -1) {
        aimAt(cIndex, rIndex);
        playWaterDropSound(620);
        showFeedback(`🎯 Apuntando a coordenada ${colLetter}${rowNum}`);
        return true;
      }
    }

    // 2. Si no es coordenada, buscar por nombre de gota (ej. "zumi", "onka", "treli")
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const drop = board[r][c];
        if (drop && drop.name.toLowerCase().includes(query)) {
          aimAt(c, r);
          playWaterDropSound(620);
          showFeedback(`💧 ¡Encontrada gota "${drop.name}" en ${COLS[c]}${ROWS[r]}!`);
          return true;
        }
      }
    }

    // 3. Buscar por color (ej. "verde", "rojo", "azul", etc.)
    const colorMatch = COLORS.find(col => col.name.toLowerCase().includes(query) || col.id.toLowerCase().includes(query));
    if (colorMatch) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const drop = board[r][c];
          if (drop && drop.color === colorMatch.id) {
            aimAt(c, r);
            playWaterDropSound(620);
            showFeedback(`🎨 Apuntando a gota ${colorMatch.name} en ${COLS[c]}${ROWS[r]}`);
            return true;
          }
        }
      }
    }

    showFeedback(`❌ No se encontró ninguna gota con "${rawQuery}". Prueba con C3 o Zumi.`);
    return false;
  }

  function showFeedback(text) {
    speechResult.style.display = 'block';
    speechResult.textContent = text;
    setTimeout(() => {
      speechResult.style.display = 'none';
    }, 4500);
  }

  // Manejo del formulario de texto
  commandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = commandInput.value;
    if (val) {
      parseAndAim(val);
      commandInput.value = '';
    }
  });

  // Reconocimiento de voz (Web Speech API)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      btnVoiceCommand.classList.add('listening');
      voiceStatusText.textContent = 'Escuchando... Di ej. "C3" o "Zumi"';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      showFeedback(`🎤 Escuchado: "${transcript}"`);

      // Normalizar transcripciones comunes de voz como "c tres" -> "c3"
      let normalized = transcript.toLowerCase();
      normalized = normalized.replace(/\bce\b/g, 'c')
                             .replace(/\bse\b/g, 'c')
                             .replace(/\buno\b/g, '1')
                             .replace(/\bdos\b/g, '2')
                             .replace(/\btres\b/g, '3')
                             .replace(/\bcuatro\b/g, '4')
                             .replace(/\bcinco\b/g, '5')
                             .replace(/\bseis\b/g, '6')
                             .replace(/\bsiete\b/g, '7')
                             .replace(/\bocho\b/g, '8');

      parseAndAim(normalized);
    };

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error);
      isListening = false;
      btnVoiceCommand.classList.remove('listening');
      voiceStatusText.textContent = 'Presiona para decir "C3" o nombre';
      showFeedback(`⚠️ Micrófono: ${event.error === 'not-allowed' ? 'Permiso denegado' : 'No se detectó voz'}`);
    };

    recognition.onend = () => {
      isListening = false;
      btnVoiceCommand.classList.remove('listening');
      voiceStatusText.textContent = 'Presiona para decir "C3" o nombre';
    };

    btnVoiceCommand.addEventListener('click', () => {
      initAudio();
      if (!isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.warn(e);
        }
      } else {
        recognition.stop();
      }
    });

  } else {
    // Si el navegador no soporta Web Speech API
    btnVoiceCommand.title = 'Reconocimiento de voz no soportado en este navegador. Usa el campo de texto.';
    voiceStatusText.textContent = 'Voz no soportada (Usa el cuadro de texto)';
    btnVoiceCommand.disabled = true;
    btnVoiceCommand.style.opacity = '0.6';
  }

  // =========================================================================
  // BOTONES Y ATAJOS DE TECLADO
  // =========================================================================

  btnFireDrop.addEventListener('click', () => {
    fireDrop();
  });

  // Atajos de teclado: Barra espaciadora para disparar gota
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // Si está escribiendo, no interceptar
    if (e.code === 'Space') {
      e.preventDefault();
      fireDrop();
    }
  });

  // Alternar sonido
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    initAudio();
  });

  // Reiniciar juego
  resetGameBtn.addEventListener('click', () => {
    if (confirm('¿Deseas reiniciar el tablero de agua de colores?')) {
      initAudio();
      initBoard();
    }
  });

  // Iniciar al cargar
  window.addEventListener('DOMContentLoaded', () => {
    buildBoardBorders();
    initBoard();
    updateParticles();
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

})();


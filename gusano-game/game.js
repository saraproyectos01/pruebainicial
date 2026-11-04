/**
 * Gusanito Glotón - Arcade Worm Game
 * Hecho con HTML5 Canvas, Web Audio API y JavaScript Moderno
 */

(() => {
  // --- Elementos del DOM ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const soundBtn = document.getElementById('soundBtn');
  const soundIcon = document.getElementById('soundIcon');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseIcon = document.getElementById('pauseIcon');

  // Overlays
  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const startGameBtn = document.getElementById('startGameBtn');
  const resumeGameBtn = document.getElementById('resumeGameBtn');
  const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const changeSettingsBtn = document.getElementById('changeSettingsBtn');

  // Config Inputs
  const difficultySelect = document.getElementById('difficultySelect');
  const wallModeSelect = document.getElementById('wallModeSelect');

  // Game Over Results
  const finalScoreEl = document.getElementById('finalScore');
  const finalLengthEl = document.getElementById('finalLength');
  const finalFoodCountEl = document.getElementById('finalFoodCount');
  const deathReasonEl = document.getElementById('deathReason');
  const newRecordBadge = document.getElementById('newRecordBadge');

  // Mobile D-Pad
  const dpadBtns = document.querySelectorAll('.dpad-btn');

  // --- Dimensiones del Tablero ---
  const CANVAS_SIZE = 600;
  const GRID_COUNT = 20; // 20x20 celdas
  const CELL_SIZE = CANVAS_SIZE / GRID_COUNT; // 30px cada celda

  // --- Velocidades por dificultad (ms por tick) ---
  const SPEEDS = {
    easy: 140,
    normal: 100,
    hard: 70,
    insane: 48
  };

  // --- Variables de Estado ---
  let isRunning = false;
  let isPaused = false;
  let isMuted = false;
  let score = 0;
  let foodCount = 0;
  let highScore = parseInt(localStorage.getItem('gusanito_high_score') || '0', 10);
  highScoreEl.textContent = highScore;

  // Gusano
  let worm = [];
  let direction = { x: 1, y: 0 };
  let inputQueue = [];
  let growthPending = 0;

  // Comida y Bonos
  let regularFood = null;
  let bonusFood = null;
  let bonusTimer = 0;
  let tongueAnim = 0;

  // Partículas y Efectos
  let particles = [];
  let floatingTexts = [];
  let screenShake = 0;

  // Timing
  let lastTickTime = 0;
  let tickInterval = SPEEDS.normal;
  let wallMode = 'solid'; // 'solid' o 'portal'

  // --- Sistema de Audio (Web Audio API sintético sin dependencias) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'eat') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'bonus') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.08);
        osc.frequency.setValueAtTime(1040, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.41);
      } else if (type === 'turn') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // Ignorar si el audio falla silenciosamente
    }
  }

  // --- Inicialización de la partida ---
  function resetGame() {
    tickInterval = SPEEDS[difficultySelect.value] || SPEEDS.normal;
    wallMode = wallModeSelect.value;
    score = 0;
    foodCount = 0;
    growthPending = 0;
    scoreEl.textContent = '0';
    direction = { x: 1, y: 0 };
    inputQueue = [];

    // Gusano inicial de 4 segmentos en el centro
    const startX = 6;
    const startY = 10;
    worm = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY }
    ];

    particles = [];
    floatingTexts = [];
    bonusFood = null;
    bonusTimer = 0;

    spawnFood();
  }

  function spawnFood() {
    const occupied = new Set(worm.map(s => `${s.x},${s.y}`));
    const emptyCells = [];

    for (let x = 0; x < GRID_COUNT; x++) {
      for (let y = 0; y < GRID_COUNT; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) return; // Tablero lleno (Victoria total)

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    // Tipos de fruta regular
    const types = [
      { emoji: '🍎', points: 10, grow: 1, color: '#ef4444' },
      { emoji: '🍓', points: 15, grow: 1, color: '#f43f5e' },
      { emoji: '🍒', points: 15, grow: 1, color: '#e11d48' },
      { emoji: '🍊', points: 20, grow: 1, color: '#f97316' }
    ];
    const pickedType = types[Math.floor(Math.random() * types.length)];

    regularFood = {
      x: randomCell.x,
      y: randomCell.y,
      ...pickedType,
      pulse: 0
    };

    // Probabilidad de generar fruta dorada especial si no existe
    if (!bonusFood && foodCount > 0 && foodCount % 4 === 0) {
      spawnBonusFood(emptyCells.filter(c => c.x !== randomCell.x || c.y !== randomCell.y));
    }
  }

  function spawnBonusFood(availableCells) {
    if (!availableCells || availableCells.length === 0) return;
    const cell = availableCells[Math.floor(Math.random() * availableCells.length)];
    bonusFood = {
      x: cell.x,
      y: cell.y,
      emoji: '🌟',
      points: 50,
      grow: 2,
      duration: 120, // Ticks de duración
      maxDuration: 120,
      color: '#facc15'
    };
  }

  // --- Bucle y Lógica del Juego ---
  function update() {
    if (!isRunning || isPaused) return;

    // Actualizar dirección desde la cola de inputs
    if (inputQueue.length > 0) {
      const nextDir = inputQueue.shift();
      // Evitar giro 180° instantáneo sobre sí mismo
      if (nextDir.x !== -direction.x && nextDir.y !== -direction.y) {
        direction = nextDir;
        playSound('turn');
      }
    }

    // Nueva cabeza
    let headX = worm[0].x + direction.x;
    let headY = worm[0].y + direction.y;

    // Manejo de bordes
    if (wallMode === 'portal') {
      if (headX < 0) headX = GRID_COUNT - 1;
      else if (headX >= GRID_COUNT) headX = 0;
      if (headY < 0) headY = GRID_COUNT - 1;
      else if (headY >= GRID_COUNT) headY = 0;
    } else {
      // Paredes sólidas
      if (headX < 0 || headX >= GRID_COUNT || headY < 0 || headY >= GRID_COUNT) {
        gameOver('¡Chocaste contra la pared exterior!');
        return;
      }
    }

    // Colisión contra sí mismo (ignora la punta de la cola si no está creciendo)
    const tailCheckLimit = growthPending > 0 ? worm.length : worm.length - 1;
    for (let i = 0; i < tailCheckLimit; i++) {
      if (worm[i].x === headX && worm[i].y === headY) {
        gameOver('¡Te mordiste tu propia colita!');
        return;
      }
    }

    // Mover gusano
    const newHead = { x: headX, y: headY };
    worm.unshift(newHead);

    // Revisar si comió comida regular
    if (regularFood && headX === regularFood.x && headY === regularFood.y) {
      handleEatFood(regularFood);
      regularFood = null;
      spawnFood();
    } else if (bonusFood && headX === bonusFood.x && headY === bonusFood.y) {
      handleEatFood(bonusFood);
      bonusFood = null;
    } else {
      if (growthPending > 0) {
        growthPending--;
      } else {
        worm.pop();
      }
    }

    // Disminuir duración de bonus si existe
    if (bonusFood) {
      bonusFood.duration--;
      if (bonusFood.duration <= 0) {
        bonusFood = null;
      }
    }
  }

  function handleEatFood(foodItem) {
    foodCount++;
    score += foodItem.points;
    growthPending += foodItem.grow;
    scoreEl.textContent = score;

    // Efectos de sonido y partículas
    if (foodItem.points > 20) {
      playSound('bonus');
    } else {
      playSound('eat');
    }

    createEatParticles(foodItem.x * CELL_SIZE + CELL_SIZE / 2, foodItem.y * CELL_SIZE + CELL_SIZE / 2, foodItem.color);
    addFloatingText(`+${foodItem.points}`, foodItem.x * CELL_SIZE + CELL_SIZE / 2, foodItem.y * CELL_SIZE, foodItem.color);
  }

  function gameOver(reason) {
    isRunning = false;
    screenShake = 16;
    playSound('die');

    // Comprobar récord
    let isNewRecord = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('gusanito_high_score', highScore.toString());
      highScoreEl.textContent = highScore;
      isNewRecord = true;
    }

    // Actualizar modal de Game Over
    finalScoreEl.textContent = score;
    finalLengthEl.textContent = worm.length;
    finalFoodCountEl.textContent = foodCount;
    deathReasonEl.textContent = reason;
    newRecordBadge.style.display = isNewRecord ? 'inline-block' : 'none';

    setTimeout(() => {
      gameOverOverlay.classList.add('active');
    }, 400);
  }

  // --- Partículas y Efectos Visuales ---
  function createEatParticles(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  function addFloatingText(text, x, y, color) {
    floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      vy: -1.4
    });
  }

  // --- Renderizado en Canvas ---
  function render(time) {
    ctx.save();

    // Efecto de Sacudida de Pantalla
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
      screenShake *= 0.88;
      if (screenShake < 0.5) screenShake = 0;
    }

    // Fondo
    ctx.fillStyle = '#070d19';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Cuadrícula sutil
    drawGrid();

    // Comida regular
    if (regularFood) {
      drawFruit(regularFood, time);
    }

    // Comida bonus especial
    if (bonusFood) {
      drawBonusFood(bonusFood, time);
    }

    // Gusano
    drawWorm(time);

    // Partículas
    drawParticles();

    // Textos flotantes
    drawFloatingTexts();

    ctx.restore();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
    }
    ctx.stroke();

    // Borde iluminado
    if (wallMode === 'solid') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    }
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
  }

  function drawFruit(food, time) {
    const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const bob = Math.sin(time / 200) * 2;

    // Resplandor
    ctx.save();
    const glow = ctx.createRadialGradient(cx, cy + bob, 2, cx, cy + bob, CELL_SIZE * 0.8);
    glow.addColorStop(0, food.color + '66');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Emoji de la fruta
    ctx.font = `${CELL_SIZE * 0.72}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.emoji, cx, cy + bob);
    ctx.restore();
  }

  function drawBonusFood(food, time) {
    const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const scale = 1 + Math.sin(time / 140) * 0.15;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Círculo de aura brillante
    ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, CELL_SIZE * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Estrella
    ctx.font = `${CELL_SIZE * 0.8}px "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.emoji, 0, 0);

    // Barra de tiempo restante arriba
    const progress = food.duration / food.maxDuration;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2 - 4, CELL_SIZE, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2 - 4, CELL_SIZE * progress, 3);

    ctx.restore();
  }

  function drawWorm(time) {
    if (worm.length === 0) return;

    // Dibujar cuerpo desde la cola hacia la cabeza
    for (let i = worm.length - 1; i >= 0; i--) {
      const seg = worm[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;

      if (i === 0) {
        // --- CABEZA DEL GUSANO ---
        drawWormHead(cx, cy, time);
      } else {
        // --- SEGMENTO DEL CUERPO ---
        const progress = 1 - (i / worm.length);
        const radius = (CELL_SIZE / 2 - 2) * (0.65 + 0.35 * progress);

        // Degradado verde brillante a esmeralda
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);

        // Alternar tonalidad de anillos
        if (i % 2 === 0) {
          ctx.fillStyle = '#10b981';
        } else {
          ctx.fillStyle = '#059669';
        }
        ctx.fill();

        // Pequeño brillo superior para efecto 3D
        ctx.beginPath();
        ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawWormHead(cx, cy, time) {
    ctx.save();
    ctx.translate(cx, cy);

    // Rotar según dirección
    let angle = 0;
    if (direction.x === 1) angle = 0;
    else if (direction.x === -1) angle = Math.PI;
    else if (direction.y === 1) angle = Math.PI / 2;
    else if (direction.y === -1) angle = -Math.PI / 2;
    ctx.rotate(angle);

    const radius = CELL_SIZE / 2 - 1;

    // Resplandor de la cabeza
    const glow = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.4);
    glow.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Lengüita que sale y entra
    tongueAnim += 0.08;
    const tongueOut = Math.sin(tongueAnim) > 0.4;
    if (tongueOut) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(radius - 2, 0);
      ctx.lineTo(radius + 7, 0);
      ctx.stroke();

      // Punta bífida de la lengua
      ctx.beginPath();
      ctx.moveTo(radius + 7, 0);
      ctx.lineTo(radius + 10, -2);
      ctx.moveTo(radius + 7, 0);
      ctx.lineTo(radius + 10, 2);
      ctx.stroke();
    }

    // Cara / Cabeza base
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Ojos animados
    const eyeRadius = radius * 0.32;
    const pupilRadius = eyeRadius * 0.5;
    const eyeOffsetX = radius * 0.35;
    const eyeOffsetY = radius * 0.45;

    // Ojo Izquierdo y Derecho (blanco)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeOffsetX, -eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas mirando hacia el frente
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeOffsetX + 1.5, -eyeOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX + 1.5, eyeOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Brillo en los ojos
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeOffsetX + 2, -eyeOffsetY - 1, pupilRadius * 0.4, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX + 2, eyeOffsetY - 1, pupilRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Mejillas sonrosadas
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(-radius * 0.1, -eyeOffsetY * 0.95, 3, 0, Math.PI * 2);
    ctx.arc(-radius * 0.1, eyeOffsetY * 0.95, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;

      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // --- Bucle Principal con requestAnimationFrame ---
  function gameLoop(currentTime) {
    if (!lastTickTime) lastTickTime = currentTime;

    const delta = currentTime - lastTickTime;

    if (delta >= tickInterval) {
      update();
      lastTickTime = currentTime - (delta % tickInterval);
    }

    render(currentTime);
    requestAnimationFrame(gameLoop);
  }

  // --- Control de Entrada (Teclas, Toque y Gestos) ---
  function handleDirectionInput(dx, dy) {
    initAudio();
    if (!isRunning || isPaused) return;

    // Verificar contra la última dirección pendiente o la actual
    const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
    if (dx !== -lastDir.x && dy !== -lastDir.y && (dx !== lastDir.x || dy !== lastDir.y)) {
      if (inputQueue.length < 3) {
        inputQueue.push({ x: dx, y: dy });
      }
    }
  }

  window.addEventListener('keydown', (e) => {
    // Teclas de dirección
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        handleDirectionInput(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        handleDirectionInput(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        handleDirectionInput(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        handleDirectionInput(1, 0);
        break;
      case ' ':
      case 'p':
      case 'P':
      case 'Escape':
        e.preventDefault();
        togglePause();
        break;
    }
  });

  // Botones de cruceta táctil (D-Pad)
  dpadBtns.forEach((btn) => {
    const handlePress = (e) => {
      e.preventDefault();
      const dir = btn.dataset.dir;
      if (dir === 'UP') handleDirectionInput(0, -1);
      else if (dir === 'DOWN') handleDirectionInput(0, 1);
      else if (dir === 'LEFT') handleDirectionInput(-1, 0);
      else if (dir === 'RIGHT') handleDirectionInput(1, 0);
    };

    btn.addEventListener('touchstart', handlePress, { passive: false });
    btn.addEventListener('mousedown', handlePress);
  });

  // Gestos Swipe en el Canvas
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 25) {
      if (absDx > absDy) {
        // Horizontal
        handleDirectionInput(dx > 0 ? 1 : -1, 0);
      } else {
        // Vertical
        handleDirectionInput(0, dy > 0 ? 1 : -1);
      }
    }
  }, { passive: true });

  // --- Controles de Pausa y Sonido ---
  function togglePause() {
    if (!isRunning) return;
    initAudio();
    isPaused = !isPaused;
    if (isPaused) {
      pauseOverlay.classList.add('active');
      pauseIcon.textContent = '▶️';
    } else {
      pauseOverlay.classList.remove('active');
      pauseIcon.textContent = '⏸️';
    }
  }

  pauseBtn.addEventListener('click', togglePause);
  resumeGameBtn.addEventListener('click', togglePause);

  restartFromPauseBtn.addEventListener('click', () => {
    pauseOverlay.classList.remove('active');
    isPaused = false;
    pauseIcon.textContent = '⏸️';
    resetGame();
    isRunning = true;
  });

  soundBtn.addEventListener('click', () => {
    initAudio();
    isMuted = !isMuted;
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
  });

  // Iniciar partida
  startGameBtn.addEventListener('click', () => {
    initAudio();
    startOverlay.classList.remove('active');
    resetGame();
    isRunning = true;
  });

  playAgainBtn.addEventListener('click', () => {
    initAudio();
    gameOverOverlay.classList.remove('active');
    resetGame();
    isRunning = true;
  });

  changeSettingsBtn.addEventListener('click', () => {
    gameOverOverlay.classList.remove('active');
    startOverlay.classList.add('active');
  });

  // Ajuste de tamaño responsivo de canvas
  function resizeCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    const displaySize = Math.min(wrapper.clientWidth, 600);
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Iniciar loop
  requestAnimationFrame(gameLoop);
})();


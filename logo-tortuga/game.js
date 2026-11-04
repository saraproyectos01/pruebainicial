/**
 * ============================================================================
 * TORTUGA LOGO - JUEGO EDUCATIVO DE PROGRAMACIÓN
 * Motor interactivo, intérprete Logo en español/inglés, visualización y misiones
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. SISTEMA DE AUDIO (Web Audio API)
  // ==========================================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      const saved = localStorage.getItem('logo_turtle_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('logo_turtle_sound', this.enabled);
      return this.enabled;
    }

    playStep() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 40, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (e) { }
    }

    playTurn() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      } catch (e) { }
    }

    playPen() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (e) { }
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do agudo
        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const startTime = this.ctx.currentTime + i * 0.1;
          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.3);
        });
      } catch (e) { }
    }

    playError() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      } catch (e) { }
    }
  }

  // ==========================================================================
  // 2. INTÉRPRETE Y PARSER LOGO (Español / Inglés)
  // ==========================================================================
  const COLOR_MAP = {
    'rojo': '#ef4444',
    'red': '#ef4444',
    'verde': '#10b981',
    'green': '#10b981',
    'azul': '#3b82f6',
    'blue': '#3b82f6',
    'amarillo': '#f59e0b',
    'yellow': '#f59e0b',
    'naranja': '#f97316',
    'orange': '#f97316',
    'morado': '#8b5cf6',
    'purple': '#8b5cf6',
    'violeta': '#a855f7',
    'violet': '#a855f7',
    'rosa': '#ec4899',
    'pink': '#ec4899',
    'cian': '#06b6d4',
    'cyan': '#06b6d4',
    'turquesa': '#14b8a6',
    'blanco': '#ffffff',
    'white': '#ffffff',
    'negro': '#000000',
    'black': '#000000',
    'gris': '#94a3b8',
    'gray': '#94a3b8',
    'arcoiris': 'rainbow',
    'rainbow': 'rainbow'
  };

  class LogoParser {
    static tokenize(code) {
      // Remover comentarios con #, ; o //
      const cleanLines = code.split('\n').map(line => {
        let l = line.split('#')[0];
        l = l.split(';')[0];
        l = l.split('//')[0];
        return l;
      }).join(' ');

      // Separar corchetes y espacios
      const spaced = cleanLines
        .replace(/\[/g, ' [ ')
        .replace(/\]/g, ' ] ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!spaced) return [];
      return spaced.split(' ');
    }

    static parse(tokens) {
      let i = 0;

      function parseBlock() {
        const commands = [];

        while (i < tokens.length) {
          const rawToken = tokens[i];
          const token = rawToken.toUpperCase();

          if (token === ']') {
            i++; // consumir cierre
            break;
          }

          // AVANZA / AV / FORWARD / FD
          if (token === 'AVANZA' || token === 'AV' || token === 'FORWARD' || token === 'FD') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le falta el número de pasos. Ejemplo: ${token} 100`);
            }
            const val = parseFloat(tokens[i]);
            commands.push({ type: 'FORWARD', distance: val });
            i++;
          }
          // RETROCEDE / RE / BACK / BK
          else if (token === 'RETROCEDE' || token === 'RE' || token === 'BACK' || token === 'BK') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le falta el número de pasos. Ejemplo: ${token} 50`);
            }
            const val = parseFloat(tokens[i]);
            commands.push({ type: 'BACK', distance: val });
            i++;
          }
          // GIRADERECHA / GD / RIGHT / RT
          else if (token === 'GIRADERECHA' || token === 'GD' || token === 'RIGHT' || token === 'RT') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le faltan los grados de giro. Ejemplo: ${token} 90`);
            }
            const val = parseFloat(tokens[i]);
            commands.push({ type: 'RIGHT', angle: val });
            i++;
          }
          // GIRAIZQUIERDA / GI / LEFT / LT
          else if (token === 'GIRAIZQUIERDA' || token === 'GI' || token === 'LEFT' || token === 'LT') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le faltan los grados de giro. Ejemplo: ${token} 90`);
            }
            const val = parseFloat(tokens[i]);
            commands.push({ type: 'LEFT', angle: val });
            i++;
          }
          // SUBEPLUMA / SP / PENUP / PU
          else if (token === 'SUBEPLUMA' || token === 'SP' || token === 'PENUP' || token === 'PU') {
            commands.push({ type: 'PENUP' });
            i++;
          }
          // BAJAPLUMA / BP / PENDOWN / PD
          else if (token === 'BAJAPLUMA' || token === 'BP' || token === 'PENDOWN' || token === 'PD') {
            commands.push({ type: 'PENDOWN' });
            i++;
          }
          // COLOR / COL / SETPENCOLOR
          else if (token === 'COLOR' || token === 'COL' || token === 'SETPENCOLOR') {
            i++;
            if (i >= tokens.length) {
              throw new Error(`A "${token}" le falta el color (ej: COLOR rojo, COLOR azul, COLOR arcoiris).`);
            }
            const colorStr = tokens[i].toLowerCase();
            const resolvedColor = COLOR_MAP[colorStr] || tokens[i];
            commands.push({ type: 'COLOR', color: resolvedColor });
            i++;
          }
          // ARCOIRIS / RAINBOW
          else if (token === 'ARCOIRIS' || token === 'RAINBOW') {
            commands.push({ type: 'COLOR', color: 'rainbow' });
            i++;
          }
          // GROSOR / ANCHO / SETWIDTH / WIDTH
          else if (token === 'GROSOR' || token === 'ANCHO' || token === 'SETWIDTH' || token === 'WIDTH') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le falta el número de grosor. Ejemplo: ${token} 4`);
            }
            const val = Math.max(1, Math.min(50, parseFloat(tokens[i])));
            commands.push({ type: 'WIDTH', width: val });
            i++;
          }
          // CENTRO / INICIO / HOME
          else if (token === 'CENTRO' || token === 'INICIO' || token === 'HOME') {
            commands.push({ type: 'HOME' });
            i++;
          }
          // BORRA / LIMPIAR / BPANTALLA / CLEAR / CS
          else if (token === 'BORRA' || token === 'LIMPIAR' || token === 'BPANTALLA' || token === 'CLEAR' || token === 'CS') {
            commands.push({ type: 'CLEAR' });
            i++;
          }
          // OCULTATORTUGA / OT / HIDETURTLE / HT
          else if (token === 'OCULTATORTUGA' || token === 'OT' || token === 'HIDETURTLE' || token === 'HT') {
            commands.push({ type: 'HIDETURTLE' });
            i++;
          }
          // MUESTRATORTUGA / MT / SHOWTURTLE / ST
          else if (token === 'MUESTRATORTUGA' || token === 'MT' || token === 'SHOWTURTLE' || token === 'ST') {
            commands.push({ type: 'SHOWTURTLE' });
            i++;
          }
          // RUMBO / SETHEADING / SETH
          else if (token === 'RUMBO' || token === 'SETHEADING' || token === 'SETH') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le faltan los grados absolutos (0=Norte, 90=Este).`);
            }
            const val = parseFloat(tokens[i]);
            commands.push({ type: 'SETHEADING', angle: val });
            i++;
          }
          // POSICION / IR / SETPOS
          else if (token === 'POSICION' || token === 'IR' || token === 'SETPOS') {
            i++;
            if (i + 1 >= tokens.length || isNaN(Number(tokens[i])) || isNaN(Number(tokens[i + 1]))) {
              throw new Error(`A "${token}" le faltan las coordenadas X e Y. Ejemplo: IR 50 -30`);
            }
            const x = parseFloat(tokens[i]);
            const y = parseFloat(tokens[i + 1]);
            commands.push({ type: 'SETPOS', x, y });
            i += 2;
          }
          // ESPERA / WAIT
          else if (token === 'ESPERA' || token === 'WAIT') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "${token}" le faltan los milisegundos. Ejemplo: ESPERA 200`);
            }
            const val = parseFloat(tokens[i]);
            commands.push({ type: 'WAIT', ms: val });
            i++;
          }
          // REPITE / REPEAT
          else if (token === 'REPITE' || token === 'REPEAT') {
            i++;
            if (i >= tokens.length || isNaN(Number(tokens[i]))) {
              throw new Error(`A "REPITE" le falta el número de repeticiones. Ejemplo: REPITE 4 [ AV 100 GD 90 ]`);
            }
            const count = Math.max(0, Math.min(2000, parseInt(tokens[i], 10)));
            i++;
            if (i >= tokens.length || tokens[i] !== '[') {
              throw new Error(`Se esperaba un corchete abierto "[" después de "REPITE ${count}".`);
            }
            i++; // consumir '['
            const innerCommands = parseBlock();
            commands.push({ type: 'REPEAT', count, commands: innerCommands });
          }
          else {
            throw new Error(`Comando desconocido: "${rawToken}". Revisa la ortografía o consulta la Ayuda ❓.`);
          }
        }

        return commands;
      }

      return parseBlock();
    }

    // Aplanar comandos expandiendo los REPITE para animación uniforme
    static flatten(commands, maxSteps = 10000) {
      const flat = [];
      let stepCount = 0;

      function traverse(list) {
        for (const cmd of list) {
          if (stepCount >= maxSteps) {
            throw new Error(`El programa excedió el límite de pasos seguros (${maxSteps}). ¡Cuidado con bucles infinitos!`);
          }
          if (cmd.type === 'REPEAT') {
            for (let r = 0; r < cmd.count; r++) {
              traverse(cmd.commands);
            }
          } else {
            flat.push(cmd);
            stepCount++;
          }
        }
      }

      traverse(commands);
      return flat;
    }
  }

  // ==========================================================================
  // 3. DEFINICIÓN DE NIVELES Y MISIONES
  // ==========================================================================
  const MISSIONS = [
    {
      id: 1,
      title: "¡Primeros Pasos!",
      icon: "🥬",
      objective: "Lleva a la tortuguita hambrienta hasta la deliciosa lechuga 🥬 avanzando en línea recta.",
      hint: "Escribe <code>AVANZA 150</code> y pulsa <strong>Ejecutar</strong>.",
      starterCode: "AVANZA 150",
      target: { x: 0, y: 150, radius: 25, label: "🥬 Lechuga" },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 2,
      checkGoal: (state) => {
        const dist = Math.hypot(state.x - 0, state.y - 150);
        return dist <= 30;
      }
    },
    {
      id: 2,
      title: "El Giro Recto",
      icon: "💎",
      objective: "Avanza 100 pasos hacia adelante, gira 90° a la derecha y avanza otros 100 pasos para alcanzar la gema azul 💎.",
      hint: "Usa:<br><code>AVANZA 100</code><br><code>GIRADERECHA 90</code><br><code>AVANZA 100</code>",
      starterCode: "AVANZA 100\nGIRADERECHA 90\nAVANZA 100",
      target: { x: 100, y: 100, radius: 25, label: "💎 Gema" },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 4,
      checkGoal: (state) => {
        const dist = Math.hypot(state.x - 100, state.y - 100);
        return dist <= 30;
      }
    },
    {
      id: 3,
      title: "La Escalera Mágica",
      icon: "🚩",
      objective: "Sube dos escalones de 50 pasos hasta alcanzar la bandera de la victoria 🚩.",
      hint: "Avanza 50, gira der 90, avanza 50, gira izq 90... ¡y repite para el segundo escalón!",
      starterCode: "AVANZA 50\nGIRADERECHA 90\nAVANZA 50\nGIRAIZQUIERDA 90\nAVANZA 50\nGIRADERECHA 90\nAVANZA 50",
      target: { x: 100, y: 100, radius: 25, label: "🚩 Bandera" },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 8,
      checkGoal: (state) => {
        const dist = Math.hypot(state.x - 100, state.y - 100);
        return dist <= 30;
      }
    },
    {
      id: 4,
      title: "El Cuadrado Sagrado",
      icon: "🟩",
      objective: "Dibuja un cuadrado perfecto de 100 pasos por lado y regresa al punto de inicio.",
      hint: "Para hacer un cuadrado: avanza 100 y gira 90° cuatro veces.",
      starterCode: "AVANZA 100\nGIRADERECHA 90\nAVANZA 100\nGIRADERECHA 90\nAVANZA 100\nGIRADERECHA 90\nAVANZA 100\nGIRADERECHA 90",
      target: { x: 0, y: 0, radius: 25, label: "🟩 Cerrar Cuadrado", guideShape: 'square', size: 100 },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 9,
      checkGoal: (state, history) => {
        const forwardMoves = history.filter(h => h.type === 'FORWARD' && Math.abs(h.distance - 100) < 15);
        const distToOrigin = Math.hypot(state.x, state.y);
        return forwardMoves.length >= 4 && distToOrigin <= 20;
      }
    },
    {
      id: 5,
      title: "El Poder de REPITE",
      icon: "🔁",
      objective: "¡No escribas tanto! Dibuja el mismo cuadrado de 100 pasos pero usando una sola orden con <code>REPITE 4 [ ... ]</code>.",
      hint: "Escribe: <code>REPITE 4 [ AVANZA 100 GIRADERECHA 90 ]</code>",
      starterCode: "REPITE 4 [ AVANZA 100 GIRADERECHA 90 ]",
      target: { x: 0, y: 0, radius: 25, label: "🔁 Bucle Óptimo", guideShape: 'square', size: 100 },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 1, // Requiere usar REPITE para las 3 estrellas!
      checkGoal: (state, history, rawCode) => {
        const usesRepeat = /repite\s*4|repeat\s*4/i.test(rawCode);
        const distToOrigin = Math.hypot(state.x, state.y);
        return usesRepeat && distToOrigin <= 25;
      }
    },
    {
      id: 6,
      title: "El Triángulo Equilátero",
      icon: "🔺",
      objective: "Dibuja un triángulo equilátero de 120 pasos por lado. ¡Atento al ángulo exterior!",
      hint: "Como un giro completo son 360°, para 3 lados debes girar 360/3 = <strong>120°</strong>.<br><code>REPITE 3 [ AVANZA 120 GIRADERECHA 120 ]</code>",
      starterCode: "REPITE 3 [ AVANZA 120 GIRADERECHA 120 ]",
      target: { x: 0, y: 0, radius: 25, label: "🔺 Triángulo", guideShape: 'triangle', size: 120 },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 4,
      checkGoal: (state, history) => {
        const forwardMoves = history.filter(h => h.type === 'FORWARD' && h.distance >= 100);
        const distToOrigin = Math.hypot(state.x, state.y);
        return forwardMoves.length >= 3 && distToOrigin <= 25;
      }
    },
    {
      id: 7,
      title: "La Estrella Mágica",
      icon: "⭐",
      objective: "Dibuja una hermosa estrella de 5 puntas. El ángulo secreto para la estrella es 144°.",
      hint: "Usa: <code>REPITE 5 [ AVANZA 130 GIRADERECHA 144 ]</code>",
      starterCode: "REPITE 5 [ AVANZA 130 GIRADERECHA 144 ]",
      target: { x: 0, y: 0, radius: 25, label: "⭐ Estrella", guideShape: 'star', size: 130 },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 2,
      checkGoal: (state, history) => {
        const forwardMoves = history.filter(h => h.type === 'FORWARD' && h.distance >= 100);
        const distToOrigin = Math.hypot(state.x, state.y);
        return forwardMoves.length >= 5 && distToOrigin <= 25;
      }
    },
    {
      id: 8,
      title: "El Hexágono Multicolor",
      icon: "⬡",
      objective: "Dibuja un hexágono (6 lados de 70 pasos). ¡Gira 60° en cada esquina y pinta con trazo de arcoíris!",
      hint: "Escribe:<br><code>COLOR arcoiris</code><br><code>REPITE 6 [ AVANZA 70 GIRADERECHA 60 ]</code>",
      starterCode: "COLOR arcoiris\nREPITE 6 [ AVANZA 70 GIRADERECHA 60 ]",
      target: { x: 0, y: 0, radius: 25, label: "⬡ Hexágono", guideShape: 'hexagon', size: 70 },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 3,
      checkGoal: (state, history) => {
        const forwardMoves = history.filter(h => h.type === 'FORWARD');
        const distToOrigin = Math.hypot(state.x, state.y);
        return forwardMoves.length >= 6 && distToOrigin <= 25;
      }
    },
    {
      id: 9,
      title: "La Casita Soñada",
      icon: "🏠",
      objective: "Construye una casita: primero las 4 paredes (cuadrado de 90 pasos) y luego el techo (triángulo).",
      hint: "Haz el cuadrado de 90, sube al techo y haz un triángulo girando 120°.",
      starterCode: "# Paredes:\nREPITE 4 [ AVANZA 90 GIRADERECHA 90 ]\n# Techo:\nAVANZA 90\nGIRADERECHA 30\nAVANZA 90\nGIRADERECHA 120\nAVANZA 90",
      target: { x: 90, y: 90, radius: 30, label: "🏠 Casa Terminada" },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 10,
      checkGoal: (state, history) => {
        const forwardMoves = history.filter(h => h.type === 'FORWARD');
        return forwardMoves.length >= 6;
      }
    },
    {
      id: 10,
      title: "El Mandala Floral",
      icon: "🌸",
      objective: "¡La prueba maestra de los bucles anidados! Dibuja un mandala repitiendo 8 cuadrados girados.",
      hint: "Escribe:<br><code>COLOR arcoiris</code><br><code>REPITE 8 [ REPITE 4 [ AVANZA 60 GIRADERECHA 90 ] GIRADERECHA 45 ]</code>",
      starterCode: "COLOR arcoiris\nREPITE 8 [\n  REPITE 4 [ AVANZA 60 GIRADERECHA 90 ]\n  GIRADERECHA 45\n]",
      target: { x: 0, y: 0, radius: 30, label: "🌸 Mandala Supremo" },
      startTurtle: { x: 0, y: 0, angle: 0 },
      maxCommandsFor3Stars: 5,
      checkGoal: (state, history, rawCode) => {
        const forwardMoves = history.filter(h => h.type === 'FORWARD');
        return forwardMoves.length >= 24;
      }
    }
  ];

  // ==========================================================================
  // 4. GALERÍA DE FIGURAS PARA ESTUDIO LIBRE
  // ==========================================================================
  const EXAMPLES = {
    square: `COLOR #3b82f6\nGROSOR 3\nREPITE 4 [\n  AVANZA 120\n  GIRADERECHA 90\n]`,
    triangle: `COLOR #10b981\nGROSOR 3\nREPITE 3 [\n  AVANZA 140\n  GIRADERECHA 120\n]`,
    star: `COLOR #f59e0b\nGROSOR 3\nREPITE 5 [\n  AVANZA 140\n  GIRADERECHA 144\n]`,
    flower: `COLOR arcoiris\nGROSOR 2\nREPITE 12 [\n  REPITE 4 [\n    AVANZA 70\n    GIRADERECHA 90\n  ]\n  GIRADERECHA 30\n]`,
    spiral: `COLOR arcoiris\nGROSOR 2\n# Espiral geométrica\nREPITE 72 [\n  AVANZA 4\n  GIRADERECHA 10\n  AVANZA 6\n  GIRADERECHA 5\n]`,
    snowflake: `COLOR #06b6d4\nGROSOR 2\n# Copo de nieve de 6 ramas\nREPITE 6 [\n  AVANZA 80\n  REPITE 3 [\n    RETROCEDE 20\n    GIRAIZQUIERDA 45\n    AVANZA 20\n    RETROCEDE 20\n    GIRADERECHA 90\n    AVANZA 20\n    RETROCEDE 20\n    GIRAIZQUIERDA 45\n  ]\n  RETROCEDE 20\n  GIRADERECHA 60\n]`,
    house: `COLOR #ef4444\nGROSOR 3\n# Paredes\nREPITE 4 [\n  AVANZA 100\n  GIRADERECHA 90\n]\n# Techo\nAVANZA 100\nCOLOR #f59e0b\nGIRADERECHA 30\nAVANZA 100\nGIRADERECHA 120\nAVANZA 100`,
    tree: `COLOR #10b981\nGROSOR 3\n# Tronco\nAVANZA 70\n# Rama derecha\nGIRADERECHA 30\nAVANZA 40\nRETROCEDE 40\n# Rama izquierda\nGIRAIZQUIERDA 60\nAVANZA 40\nRETROCEDE 40\n# Centro\nGIRADERECHA 30\nAVANZA 30\nRETROCEDE 100`
  };

  // ==========================================================================
  // 5. CLASE PRINCIPAL: CONTROLADOR DEL JUEGO
  // ==========================================================================
  class TurtleGame {
    constructor() {
      // Elementos DOM
      this.gridCanvas = document.getElementById('gridCanvas');
      this.drawingCanvas = document.getElementById('drawingCanvas');
      this.overlayCanvas = document.getElementById('overlayCanvas');

      this.gridCtx = this.gridCanvas.getContext('2d');
      this.drawCtx = this.drawingCanvas.getContext('2d');
      this.overlayCtx = this.overlayCanvas.getContext('2d');

      this.codeEditor = document.getElementById('codeEditor');
      this.lineNumbers = document.getElementById('lineNumbers');
      this.terminalLogs = document.getElementById('terminalLogs');
      this.terminalForm = document.getElementById('terminalForm');
      this.terminalInput = document.getElementById('terminalInput');

      // Botones de ejecución
      this.runCodeBtn = document.getElementById('runCodeBtn');
      this.stepCodeBtn = document.getElementById('stepCodeBtn');
      this.stopCodeBtn = document.getElementById('stopCodeBtn');
      this.resetTurtleBtn = document.getElementById('resetTurtleBtn');
      this.clearCanvasBtn = document.getElementById('clearCanvasBtn');
      this.clearEditorBtn = document.getElementById('clearEditorBtn');
      this.saveImageBtn = document.getElementById('saveImageBtn');

      // Estado de la Tortuga
      this.turtle = {
        x: 0,          // Coordenada lógica Logo (0 es el centro)
        y: 0,          // Hacia arriba es +Y
        angle: 0,      // 0° = Norte (arriba), 90° = Este, etc.
        penDown: true,
        color: '#10b981',
        isRainbow: false,
        rainbowHue: 0,
        width: 3,
        visible: true,
        walkCycle: 0   // Para mover las patitas al avanzar
      };

      // Telemetría UI
      this.turtlePosDisplay = document.getElementById('turtlePosDisplay');
      this.turtleHeadingDisplay = document.getElementById('turtleHeadingDisplay');
      this.turtlePenDisplay = document.getElementById('turtlePenDisplay');
      this.penDotIndicator = document.getElementById('penDotIndicator');
      this.penStateText = document.getElementById('penStateText');
      this.compassNeedle = document.getElementById('compassNeedle');
      this.compassWidget = document.getElementById('compassWidget');
      this.executionStatus = document.getElementById('executionStatus');

      // Modos y Misiones
      this.currentMode = 'missions'; // 'missions' o 'playground'
      this.currentLevelIndex = 0;
      this.levelProgress = this.loadProgress();

      // Audio
      this.sound = new SoundManager();

      // Configuración de ejecución
      this.speedSetting = 3; // 1: lento, 3: normal, 5: instantáneo
      this.stepDelays = [180, 80, 30, 8, 0];
      this.isRunning = false;
      this.isPaused = false;
      this.abortController = false;
      this.commandQueue = [];
      this.queueIndex = 0;
      this.executionHistory = []; // Para verificar objetivos de nivel

      // Partículas de confeti
      this.confettiParticles = [];
      this.animFrameId = null;

      // Opciones visuales
      this.showGrid = true;
      this.showCompass = false;

      // Inicializar
      this.initCanvasSize();
      this.initEvents();
      this.renderGrid();
      this.loadLevel(0);
      this.updateTelemetry();
      this.updateProgressBadge();
      this.startOverlayAnimationLoop();

      this.log('🐢 ¡Tortuguita lista para recibir tus órdenes! Pulsa Ejecutar o usa los Bloques Rápidos.', 'system');
    }

    // Inicializar tamaños de canvas en alta resolución
    initCanvasSize() {
      const w = 800;
      const h = 600;
      [this.gridCanvas, this.drawingCanvas, this.overlayCanvas].forEach(c => {
        c.width = w;
        c.height = h;
      });
      this.drawCtx.lineCap = 'round';
      this.drawCtx.lineJoin = 'round';
    }

    // Convertir de coordenadas Logo (origen en centro) a Canvas (0,0 en esquina superior izq)
    toCanvasCoords(x, y) {
      const centerX = this.drawingCanvas.width / 2;
      const centerY = this.drawingCanvas.height / 2;
      return {
        cx: centerX + x,
        cy: centerY - y // En Logo +Y es hacia arriba
      };
    }

    loadProgress() {
      try {
        const data = localStorage.getItem('logo_turtle_levels');
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    }

    saveProgress(levelId, stars) {
      const prev = this.levelProgress[levelId] || 0;
      if (stars > prev) {
        this.levelProgress[levelId] = stars;
        localStorage.setItem('logo_turtle_levels', JSON.stringify(this.levelProgress));
      }
      this.updateProgressBadge();
      this.renderLevelsGrid();
    }

    updateProgressBadge() {
      let totalStars = 0;
      let completedCount = 0;
      for (let i = 1; i <= MISSIONS.length; i++) {
        const s = this.levelProgress[i] || 0;
        totalStars += s;
        if (s > 0) completedCount++;
      }
      const badge = document.getElementById('totalStarsBadge');
      if (badge) badge.textContent = `⭐ ${totalStars}/${MISSIONS.length * 3}`;

      const prog = document.getElementById('levelProgressBadge');
      if (prog) prog.textContent = `${completedCount} de ${MISSIONS.length} completadas`;
    }

    // ========================================================================
    // EVENTOS Y ENLACES DE UI
    // ========================================================================
    initEvents() {
      // Cambio de Modos
      const missionsBtn = document.getElementById('modeMissionsBtn');
      const playgroundBtn = document.getElementById('modePlaygroundBtn');
      const missionPanel = document.getElementById('missionPanel');
      const levelsGridCard = document.getElementById('levelsGridCard');
      const examplesDropdownWrapper = document.getElementById('examplesDropdownWrapper');
      const paletteColorsBar = document.getElementById('paletteColorsBar');

      missionsBtn.addEventListener('click', () => {
        missionsBtn.classList.add('active');
        playgroundBtn.classList.remove('active');
        missionsBtn.setAttribute('aria-selected', 'true');
        playgroundBtn.setAttribute('aria-selected', 'false');
        this.currentMode = 'missions';
        missionPanel.style.display = 'block';
        levelsGridCard.style.display = 'block';
        examplesDropdownWrapper.style.display = 'none';
        paletteColorsBar.style.display = 'none';
        this.loadLevel(this.currentLevelIndex);
      });

      playgroundBtn.addEventListener('click', () => {
        playgroundBtn.classList.add('active');
        missionsBtn.classList.remove('active');
        playgroundBtn.setAttribute('aria-selected', 'true');
        missionsBtn.setAttribute('aria-selected', 'false');
        this.currentMode = 'playground';
        missionPanel.style.display = 'none';
        levelsGridCard.style.display = 'none';
        examplesDropdownWrapper.style.display = 'block';
        paletteColorsBar.style.display = 'flex';
        this.resetTurtle();
        this.log('🎨 Entraste en el Estudio Libre. ¡Dibuja lo que quieras o prueba la Galería de Figuras!', 'system');
      });

      // Galería dropdown
      const examplesBtn = document.getElementById('examplesBtn');
      const examplesMenu = document.getElementById('examplesMenu');
      examplesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        examplesMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        examplesMenu.classList.add('hidden');
      });

      document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const exKey = e.currentTarget.dataset.example;
          if (EXAMPLES[exKey]) {
            this.codeEditor.value = EXAMPLES[exKey];
            this.updateLineNumbers();
            this.log(`✨ Ejemplo cargado: ${e.currentTarget.textContent}`, 'system');
            this.runProgram();
          }
        });
      });

      // Navegación de niveles
      document.getElementById('prevLevelBtn').addEventListener('click', () => {
        if (this.currentLevelIndex > 0) {
          this.loadLevel(this.currentLevelIndex - 1);
        }
      });
      document.getElementById('nextLevelBtn').addEventListener('click', () => {
        if (this.currentLevelIndex < MISSIONS.length - 1) {
          this.loadLevel(this.currentLevelIndex + 1);
        }
      });

      // Pista desplegable
      const hintToggleBtn = document.getElementById('hintToggleBtn');
      const hintContent = document.getElementById('hintContent');
      hintToggleBtn.addEventListener('click', () => {
        hintContent.classList.toggle('hidden');
        this.sound.playStep();
      });

      // Números de línea en editor
      this.codeEditor.addEventListener('input', () => this.updateLineNumbers());
      this.codeEditor.addEventListener('scroll', () => {
        this.lineNumbers.scrollTop = this.codeEditor.scrollTop;
      });

      // Atajo Ctrl+Enter para ejecutar
      this.codeEditor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.runProgram();
        }
      });

      // Botones de ejecución
      this.runCodeBtn.addEventListener('click', () => this.runProgram());
      this.stepCodeBtn.addEventListener('click', () => this.stepProgram());
      this.stopCodeBtn.addEventListener('click', () => this.stopProgram());
      this.resetTurtleBtn.addEventListener('click', () => this.resetTurtle());
      this.clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
      this.clearEditorBtn.addEventListener('click', () => {
        this.codeEditor.value = '';
        this.updateLineNumbers();
      });

      // Botonera de Bloques Rápidos
      document.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const codeSnippet = btn.dataset.code;
          if (!codeSnippet) return;
          this.insertCodeAtCursor(codeSnippet + '\n');
          this.sound.playStep();
        });
      });

      // Terminal interactiva
      this.terminalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmd = this.terminalInput.value.trim();
        if (!cmd) return;
        this.log(`> ${cmd}`, 'system');
        this.terminalInput.value = '';
        this.executeSingleCommandString(cmd);
      });

      document.getElementById('clearTerminalBtn').addEventListener('click', () => {
        this.terminalLogs.innerHTML = '';
      });

      // Barra de velocidad
      const speedSlider = document.getElementById('speedSlider');
      const speedLabel = document.getElementById('speedLabel');
      const speedTexts = ['🐢 Muy Lento', '🐢 Lento', '⚡ Normal', '🚀 Rápido', '⚡ Rayo'];
      speedSlider.addEventListener('input', (e) => {
        this.speedSetting = parseInt(e.target.value, 10);
        speedLabel.textContent = speedTexts[this.speedSetting - 1];
      });

      // Sonido toggle
      const soundToggle = document.getElementById('soundToggle');
      soundToggle.addEventListener('click', () => {
        const isEnabled = this.sound.toggle();
        soundToggle.textContent = isEnabled ? '🔊' : '🔇';
        soundToggle.title = isEnabled ? 'Sonido activado' : 'Sonido silenciado';
        this.log(isEnabled ? '🔊 Sonido activado.' : '🔇 Sonido silenciado.', 'system');
      });

      // Botones de vista de lienzo
      const toggleGridBtn = document.getElementById('toggleGridBtn');
      toggleGridBtn.addEventListener('click', () => {
        this.showGrid = !this.showGrid;
        toggleGridBtn.classList.toggle('active', this.showGrid);
        this.renderGrid();
      });

      const toggleCompassBtn = document.getElementById('toggleCompassBtn');
      toggleCompassBtn.addEventListener('click', () => {
        this.showCompass = !this.showCompass;
        toggleCompassBtn.classList.toggle('active', this.showCompass);
        this.compassWidget.classList.toggle('hidden', !this.showCompass);
      });

      // Guardar imagen PNG
      this.saveImageBtn.addEventListener('click', () => this.exportDrawingPNG());

      // Paleta de Colores
      document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          const col = swatch.dataset.color;
          if (col === 'rainbow') {
            this.turtle.isRainbow = true;
            this.insertCodeAtCursor('COLOR arcoiris\n');
          } else {
            this.turtle.isRainbow = false;
            this.turtle.color = col;
            this.insertCodeAtCursor(`COLOR ${col}\n`);
          }
          this.updateTelemetry();
          this.sound.playPen();
        });
      });

      // Grosor
      document.querySelectorAll('.width-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.width-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const w = parseInt(btn.dataset.width, 10);
          this.turtle.width = w;
          this.insertCodeAtCursor(`GROSOR ${w}\n`);
          this.sound.playPen();
        });
      });

      // Modales
      const helpModal = document.getElementById('helpModal');
      document.getElementById('helpModalBtn').addEventListener('click', () => {
        helpModal.classList.remove('hidden');
      });
      document.getElementById('closeHelpModalBtn').addEventListener('click', () => {
        helpModal.classList.add('hidden');
      });
      document.getElementById('understoodHelpBtn').addEventListener('click', () => {
        helpModal.classList.add('hidden');
      });

      // Píldoras de código en ayuda para insertar
      document.querySelectorAll('.code-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          this.insertCodeAtCursor(pill.dataset.insert + '\n');
          helpModal.classList.add('hidden');
          this.sound.playStep();
        });
      });

      // Modal Victoria
      const victoryModal = document.getElementById('victoryModal');
      document.getElementById('retryLevelBtn').addEventListener('click', () => {
        victoryModal.classList.add('hidden');
        this.loadLevel(this.currentLevelIndex);
      });
      document.getElementById('nextLevelModalBtn').addEventListener('click', () => {
        victoryModal.classList.add('hidden');
        if (this.currentLevelIndex < MISSIONS.length - 1) {
          this.loadLevel(this.currentLevelIndex + 1);
        }
      });

      this.renderLevelsGrid();
    }

    insertCodeAtCursor(text) {
      const editor = this.codeEditor;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const val = editor.value;
      editor.value = val.substring(0, start) + text + val.substring(end);
      editor.selectionStart = editor.selectionEnd = start + text.length;
      editor.focus();
      this.updateLineNumbers();
    }

    updateLineNumbers() {
      const lines = this.codeEditor.value.split('\n').length;
      let numbersHtml = '';
      for (let i = 1; i <= Math.max(1, lines); i++) {
        numbersHtml += `${i}<br>`;
      }
      this.lineNumbers.innerHTML = numbersHtml;
    }

    log(message, type = 'normal') {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      entry.innerHTML = `<span class="time">[${timeStr}]</span> ${message}`;
      this.terminalLogs.appendChild(entry);
      this.terminalLogs.scrollTop = this.terminalLogs.scrollHeight;
    }

    // ========================================================================
    // CARGAR Y CAMBIAR DE NIVEL
    // ========================================================================
    loadLevel(index) {
      if (index < 0 || index >= MISSIONS.length) return;
      this.currentLevelIndex = index;
      const mission = MISSIONS[index];

      document.getElementById('levelNumberLabel').textContent = `Misión ${mission.id} de ${MISSIONS.length}`;
      document.getElementById('levelTitle').textContent = `${mission.icon} ${mission.title}`;
      document.getElementById('levelObjective').innerHTML = mission.objective;
      document.getElementById('hintContent').innerHTML = mission.hint;
      document.getElementById('hintContent').classList.add('hidden');

      // Deshabilitar navegación en límites
      document.getElementById('prevLevelBtn').disabled = index === 0;
      document.getElementById('nextLevelBtn').disabled = index === MISSIONS.length - 1;

      // Estrellas conseguidas previamente
      const starsEarned = this.levelProgress[mission.id] || 0;
      let starsStr = '';
      for (let i = 0; i < 3; i++) {
        starsStr += i < starsEarned ? '⭐' : '☆';
      }
      document.getElementById('levelStarsDisplay').textContent = starsStr;

      // Cargar código inicial
      this.codeEditor.value = mission.starterCode;
      this.updateLineNumbers();

      // Reiniciar tortuga a la posición inicial de este nivel
      this.resetTurtle(mission.startTurtle);
      this.clearCanvas();
      this.renderLevelsGrid();

      this.log(`🎯 Iniciando <strong>Misión ${mission.id}: ${mission.title}</strong>`, 'system');
    }

    renderLevelsGrid() {
      const container = document.getElementById('levelsGridContainer');
      if (!container) return;

      container.innerHTML = MISSIONS.map((m, idx) => {
        const stars = this.levelProgress[m.id] || 0;
        const isActive = idx === this.currentLevelIndex;
        let starStr = '';
        for (let s = 0; s < 3; s++) {
          starStr += s < stars ? '⭐' : '☆';
        }
        return `
          <div class="level-tile ${isActive ? 'active' : ''} ${stars > 0 ? 'completed' : ''}" data-idx="${idx}">
            <span class="level-tile-num">Nivel ${m.id}</span>
            <span class="level-tile-name">${m.icon} ${m.title}</span>
            <span class="level-tile-stars">${starStr}</span>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.level-tile').forEach(tile => {
        tile.addEventListener('click', () => {
          const idx = parseInt(tile.dataset.idx, 10);
          this.loadLevel(idx);
        });
      });
    }

    // ========================================================================
    // REINICIO Y LIMPIEZA
    // ========================================================================
    resetTurtle(customState = null) {
      this.stopProgram();
      this.turtle.x = customState ? customState.x : 0;
      this.turtle.y = customState ? customState.y : 0;
      this.turtle.angle = customState ? customState.angle : 0;
      this.turtle.penDown = true;
      this.turtle.color = '#10b981';
      this.turtle.isRainbow = false;
      this.turtle.width = 3;
      this.turtle.visible = true;
      this.turtle.walkCycle = 0;

      this.executionHistory = [];
      this.updateTelemetry();
    }

    clearCanvas() {
      this.drawCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
      this.log('🧹 Lienzo de trazos limpiado.', 'normal');
    }

    renderGrid() {
      const ctx = this.gridCtx;
      const w = this.gridCanvas.width;
      const h = this.gridCanvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!this.showGrid) return;

      const centerX = w / 2;
      const centerY = h / 2;
      const step = 25;

      // Líneas finas de cuadrícula
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      for (let x = centerX % step; x < w; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = centerY % step; y < h; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Cuadrícula mayor cada 100px
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.beginPath();
      for (let x = centerX % 100; x < w; x += 100) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = centerY % 100; y < h; y += 100) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Ejes principales Cartesianos X e Y
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, h);
      ctx.stroke();

      // Etiquetas de coordenadas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText('(0, 0)', centerX + 4, centerY - 4);
      ctx.fillText('+Y (Norte)', centerX + 4, 16);
      ctx.fillText('+X (Este)', w - 54, centerY - 4);
    }

    // ========================================================================
    // MOTOR DE EJECUCIÓN (PROGRAM RUNNER)
    // ========================================================================
    runProgram() {
      if (this.isRunning) return;

      const rawCode = this.codeEditor.value;
      if (!rawCode.trim()) {
        this.log('⚠️ El editor está vacío. Escribe alguna orden como AVANZA 100.', 'warning');
        return;
      }

      try {
        const tokens = LogoParser.tokenize(rawCode);
        const parsed = LogoParser.parse(tokens);
        this.commandQueue = LogoParser.flatten(parsed);
        this.queueIndex = 0;
        this.executionHistory = [];
      } catch (err) {
        this.sound.playError();
        this.log(`❌ Error de sintaxis: ${err.message}`, 'error');
        this.setExecutionStatus('Error', 'error');
        return;
      }

      if (this.commandQueue.length === 0) return;

      this.isRunning = true;
      this.abortController = false;
      this.runCodeBtn.disabled = true;
      this.stepCodeBtn.disabled = true;
      this.stopCodeBtn.disabled = false;
      this.setExecutionStatus('Ejecutando...', 'running');

      this.log(`🚀 Ejecutando programa (${this.commandQueue.length} acciones)...`, 'system');
      this.processQueue();
    }

    stepProgram() {
      if (this.isRunning) return;

      // Si no hay cola cargada o ya terminó, preparar una nueva
      if (this.queueIndex >= this.commandQueue.length) {
        const rawCode = this.codeEditor.value;
        try {
          const tokens = LogoParser.tokenize(rawCode);
          const parsed = LogoParser.parse(tokens);
          this.commandQueue = LogoParser.flatten(parsed);
          this.queueIndex = 0;
          this.executionHistory = [];
        } catch (err) {
          this.sound.playError();
          this.log(`❌ Error: ${err.message}`, 'error');
          return;
        }
      }

      if (this.queueIndex < this.commandQueue.length) {
        const cmd = this.commandQueue[this.queueIndex];
        this.executeCommand(cmd);
        this.queueIndex++;
        this.updateTelemetry();
        this.log(`Paso [${this.queueIndex}/${this.commandQueue.length}]: ${cmd.type}`, 'normal');

        if (this.queueIndex >= this.commandQueue.length) {
          this.onExecutionFinished();
        }
      }
    }

    stopProgram() {
      this.abortController = true;
      this.isRunning = false;
      this.runCodeBtn.disabled = false;
      this.stepCodeBtn.disabled = false;
      this.stopCodeBtn.disabled = true;
      this.setExecutionStatus('Detenido', 'warning');
      this.log('⏹️ Ejecución detenida.', 'warning');
    }

    setExecutionStatus(text, type = 'normal') {
      this.executionStatus.textContent = text;
      this.executionStatus.className = `badge ${type}`;
    }

    async processQueue() {
      // Modo instantáneo (velocidad 5)
      if (this.speedSetting === 5) {
        while (this.queueIndex < this.commandQueue.length && !this.abortController) {
          const cmd = this.commandQueue[this.queueIndex];
          this.executeCommand(cmd);
          this.queueIndex++;
        }
        this.updateTelemetry();
        this.onExecutionFinished();
        return;
      }

      // Modos animados paso a paso
      const delay = this.stepDelays[this.speedSetting - 1];

      while (this.queueIndex < this.commandQueue.length && !this.abortController) {
        const cmd = this.commandQueue[this.queueIndex];
        this.executeCommand(cmd);
        this.queueIndex++;
        this.updateTelemetry();

        if (delay > 0) {
          await new Promise(r => setTimeout(r, delay));
        }
      }

      if (!this.abortController) {
        this.onExecutionFinished();
      }
    }

    onExecutionFinished() {
      this.isRunning = false;
      this.runCodeBtn.disabled = false;
      this.stepCodeBtn.disabled = false;
      this.stopCodeBtn.disabled = true;
      this.setExecutionStatus('Listo', 'normal');
      this.log('✅ Programa completado con éxito.', 'success');

      // Verificar objetivos en Modo Misiones
      if (this.currentMode === 'missions') {
        this.checkMissionGoal();
      }
    }

    executeSingleCommandString(str) {
      try {
        const tokens = LogoParser.tokenize(str);
        const parsed = LogoParser.parse(tokens);
        const flat = LogoParser.flatten(parsed);
        flat.forEach(cmd => this.executeCommand(cmd));
        this.updateTelemetry();
        if (this.currentMode === 'missions') {
          this.checkMissionGoal();
        }
      } catch (e) {
        this.sound.playError();
        this.log(`❌ Error: ${e.message}`, 'error');
      }
    }

    // Ejecutar una sola instrucción geométrica
    executeCommand(cmd) {
      this.executionHistory.push(cmd);

      switch (cmd.type) {
        case 'FORWARD':
        case 'BACK': {
          const dist = cmd.type === 'FORWARD' ? cmd.distance : -cmd.distance;
          // Ángulo en radianes (0° es hacia arriba / Norte)
          const rad = (this.turtle.angle * Math.PI) / 180;
          const dx = dist * Math.sin(rad);
          const dy = dist * Math.cos(rad);

          const startCoords = this.toCanvasCoords(this.turtle.x, this.turtle.y);
          this.turtle.x += dx;
          this.turtle.y += dy;
          const endCoords = this.toCanvasCoords(this.turtle.x, this.turtle.y);

          // Si el lápiz está abajo, pintar en el canvas persistente
          if (this.turtle.penDown) {
            const ctx = this.drawCtx;
            ctx.beginPath();
            ctx.moveTo(startCoords.cx, startCoords.cy);
            ctx.lineTo(endCoords.cx, endCoords.cy);

            if (this.turtle.isRainbow) {
              this.turtle.rainbowHue = (this.turtle.rainbowHue + 15) % 360;
              ctx.strokeStyle = `hsl(${this.turtle.rainbowHue}, 90%, 55%)`;
            } else {
              ctx.strokeStyle = this.turtle.color;
            }

            ctx.lineWidth = this.turtle.width;
            ctx.stroke();
          }

          // Ciclo de patitas al caminar
          this.turtle.walkCycle = (this.turtle.walkCycle + 1) % 4;
          this.sound.playStep();
          break;
        }

        case 'RIGHT': {
          this.turtle.angle = (this.turtle.angle + cmd.angle) % 360;
          if (this.turtle.angle < 0) this.turtle.angle += 360;
          this.sound.playTurn();
          break;
        }

        case 'LEFT': {
          this.turtle.angle = (this.turtle.angle - cmd.angle) % 360;
          if (this.turtle.angle < 0) this.turtle.angle += 360;
          this.sound.playTurn();
          break;
        }

        case 'SETHEADING': {
          this.turtle.angle = ((cmd.angle % 360) + 360) % 360;
          this.sound.playTurn();
          break;
        }

        case 'SETPOS': {
          const startCoords = this.toCanvasCoords(this.turtle.x, this.turtle.y);
          this.turtle.x = cmd.x;
          this.turtle.y = cmd.y;
          const endCoords = this.toCanvasCoords(this.turtle.x, this.turtle.y);

          if (this.turtle.penDown) {
            const ctx = this.drawCtx;
            ctx.beginPath();
            ctx.moveTo(startCoords.cx, startCoords.cy);
            ctx.lineTo(endCoords.cx, endCoords.cy);
            ctx.strokeStyle = this.turtle.isRainbow ? `hsl(${this.turtle.rainbowHue}, 90%, 55%)` : this.turtle.color;
            ctx.lineWidth = this.turtle.width;
            ctx.stroke();
          }
          break;
        }

        case 'PENUP': {
          this.turtle.penDown = false;
          this.sound.playPen();
          break;
        }

        case 'PENDOWN': {
          this.turtle.penDown = true;
          this.sound.playPen();
          break;
        }

        case 'COLOR': {
          if (cmd.color === 'rainbow') {
            this.turtle.isRainbow = true;
          } else {
            this.turtle.isRainbow = false;
            this.turtle.color = cmd.color;
          }
          this.sound.playPen();
          break;
        }

        case 'WIDTH': {
          this.turtle.width = cmd.width;
          break;
        }

        case 'HOME': {
          this.turtle.x = 0;
          this.turtle.y = 0;
          this.turtle.angle = 0;
          this.sound.playTurn();
          break;
        }

        case 'CLEAR': {
          this.clearCanvas();
          break;
        }

        case 'HIDETURTLE': {
          this.turtle.visible = false;
          break;
        }

        case 'SHOWTURTLE': {
          this.turtle.visible = true;
          break;
        }
      }
    }

    // ========================================================================
    // TELEMETRÍA Y CONTROLES UI
    // ========================================================================
    updateTelemetry() {
      const roundedX = Math.round(this.turtle.x);
      const roundedY = Math.round(this.turtle.y);
      const roundedAngle = Math.round(this.turtle.angle);

      this.turtlePosDisplay.textContent = `X: ${roundedX}, Y: ${roundedY}`;

      // Dirección cardinal
      let card = 'N';
      if (roundedAngle > 22 && roundedAngle < 68) card = 'NE';
      else if (roundedAngle >= 68 && roundedAngle <= 112) card = 'E';
      else if (roundedAngle > 112 && roundedAngle < 158) card = 'SE';
      else if (roundedAngle >= 158 && roundedAngle <= 202) card = 'S';
      else if (roundedAngle > 202 && roundedAngle < 248) card = 'SO';
      else if (roundedAngle >= 248 && roundedAngle <= 292) card = 'O';
      else if (roundedAngle > 292 && roundedAngle < 338) card = 'NO';

      this.turtleHeadingDisplay.textContent = `${roundedAngle}° (${card})`;

      // Brújula
      if (this.compassNeedle) {
        this.compassNeedle.style.transform = `translate(-50%, -50%) rotate(${roundedAngle}deg)`;
      }

      // Lápiz
      if (this.turtle.penDown) {
        const c = this.turtle.isRainbow ? '🌈 Arcoíris' : this.turtle.color;
        this.penStateText.textContent = `Abajo (${c})`;
        this.penDotIndicator.style.background = this.turtle.isRainbow
          ? 'linear-gradient(135deg, red, yellow, blue)'
          : this.turtle.color;
      } else {
        this.penStateText.textContent = 'Arriba (Sin pintar)';
        this.penDotIndicator.style.background = '#64748b';
      }
    }

    // ========================================================================
    // VERIFICACIÓN DE OBJETIVOS DE NIVEL
    // ========================================================================
    checkMissionGoal() {
      const mission = MISSIONS[this.currentLevelIndex];
      if (!mission) return;

      const passed = mission.checkGoal(this.turtle, this.executionHistory, this.codeEditor.value);
      if (passed) {
        // Calcular estrellas conseguidas
        const rawCode = this.codeEditor.value;
        const totalLines = rawCode.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith(';')).length;
        
        let stars = 1;
        if (totalLines <= mission.maxCommandsFor3Stars) {
          stars = 3;
        } else if (totalLines <= mission.maxCommandsFor3Stars + 3) {
          stars = 2;
        }

        this.saveProgress(mission.id, stars);
        this.sound.playSuccess();
        this.triggerConfetti();

        // Mostrar Modal de Victoria
        setTimeout(() => {
          this.showVictoryModal(mission, stars, totalLines);
        }, 500);
      }
    }

    showVictoryModal(mission, stars, commandCount) {
      const modal = document.getElementById('victoryModal');
      document.getElementById('victoryTitle').textContent = `¡Misión ${mission.id} Superada!`;
      document.getElementById('victorySubtitle').textContent = `${mission.icon} ${mission.title}`;

      // Estrellas
      let starHtml = '';
      for (let i = 0; i < 3; i++) {
        starHtml += `<span class="star-item" style="animation-delay: ${i * 0.15}s">${i < stars ? '⭐' : '☆'}</span>`;
      }
      document.getElementById('victoryStarsContainer').innerHTML = starHtml;

      document.getElementById('statsCommandsCount').textContent = commandCount;
      document.getElementById('statsBonus').textContent = stars === 3 ? '¡Perfección Total! 🌟' : stars === 2 ? '¡Muy Bien! 👍' : '¡Completado! 🐢';

      const feedbackTexts = [
        '¡Genial! Has alcanzado la meta. Intenta usar menos líneas o bucles REPITE para obtener las 3 estrellas.',
        '¡Gran trabajo de programación! Tu solución es muy limpia y efectiva.',
        '¡Impresionante maestría de la lógica Logo! Solución óptima con 3 estrellas máximas.'
      ];
      document.getElementById('victoryFeedbackText').textContent = feedbackTexts[stars - 1];

      modal.classList.remove('hidden');
    }

    // ========================================================================
    // RENDERIZADO DEL OVERLAY (TORTUGA, METAS Y CONFETI)
    // ========================================================================
    startOverlayAnimationLoop() {
      const render = () => {
        this.renderOverlay();
        this.animFrameId = requestAnimationFrame(render);
      };
      this.animFrameId = requestAnimationFrame(render);
    }

    renderOverlay() {
      const ctx = this.overlayCtx;
      const w = this.overlayCanvas.width;
      const h = this.overlayCanvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Dibujar meta/objetivo si está en modo Misiones
      if (this.currentMode === 'missions') {
        const mission = MISSIONS[this.currentLevelIndex];
        if (mission && mission.target) {
          this.drawMissionTarget(ctx, mission.target);
        }
      }

      // 2. Dibujar a la Tortuguita Vectorial
      if (this.turtle.visible) {
        this.drawTurtle(ctx);
      }

      // 3. Dibujar confeti
      this.drawConfetti(ctx);
    }

    drawMissionTarget(ctx, target) {
      const coords = this.toCanvasCoords(target.x, target.y);
      const time = Date.now() / 300;
      const pulse = Math.sin(time) * 4;

      // Halo pulsante
      ctx.save();
      ctx.beginPath();
      ctx.arc(coords.cx, coords.cy, target.radius + pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      // Guía visual de figura de la misión si existe
      if (target.guideShape === 'square') {
        const center = this.toCanvasCoords(0, 0);
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(center.cx, center.cy - target.size, target.size, target.size);
        ctx.restore();
      }

      // Etiqueta del objetivo
      ctx.save();
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(target.label || '🎯 Meta', coords.cx, coords.cy - target.radius - 8);
      ctx.restore();
    }

    // Dibujar la Tortuguita animada
    drawTurtle(ctx) {
      const coords = this.toCanvasCoords(this.turtle.x, this.turtle.y);
      ctx.save();
      ctx.translate(coords.cx, coords.cy);

      // Rotar según el rumbo de la tortuga (0° apunta hacia arriba)
      ctx.rotate((this.turtle.angle * Math.PI) / 180);

      const cycle = this.turtle.walkCycle;
      const legOffset = (cycle % 2 === 0 ? 2 : -2);

      // Patitas (Aletas)
      ctx.fillStyle = '#059669';
      // Patita delantera izquierda
      ctx.beginPath();
      ctx.ellipse(-14, -10 + legOffset, 5, 8, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      // Patita delantera derecha
      ctx.beginPath();
      ctx.ellipse(14, -10 - legOffset, 5, 8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      // Patita trasera izquierda
      ctx.beginPath();
      ctx.ellipse(-13, 12 - legOffset, 4, 7, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      // Patita trasera derecha
      ctx.beginPath();
      ctx.ellipse(13, 12 + legOffset, 4, 7, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Colita
      ctx.beginPath();
      ctx.moveTo(-3, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(0, 23);
      ctx.closePath();
      ctx.fillStyle = '#047857';
      ctx.fill();

      // Caparazón principal (Óvalo verde brillante con borde)
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 17, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#065f46';
      ctx.stroke();

      // Patrón de placas del caparazón
      ctx.beginPath();
      ctx.arc(0, 1, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cabecita
      ctx.beginPath();
      ctx.ellipse(0, -17, 7, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.stroke();

      // Ojos tiernos
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3.5, -19, 2.8, 0, Math.PI * 2);
      ctx.arc(3.5, -19, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Pupilas
      ctx.fillStyle = '#090e17';
      ctx.beginPath();
      ctx.arc(-3.5, -20, 1.4, 0, Math.PI * 2);
      ctx.arc(3.5, -20, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Brillo en los ojos
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -20.5, 0.7, 0, Math.PI * 2);
      ctx.arc(3, -20.5, 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Pluma / Lápiz sostenido en la cola
      if (this.turtle.penDown) {
        ctx.beginPath();
        ctx.arc(0, 19, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.turtle.isRainbow ? '#f59e0b' : this.turtle.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    // ========================================================================
    // CONFETI Y CELEBRACIÓN
    // ========================================================================
    triggerConfetti() {
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ffffff'];
      for (let i = 0; i < 90; i++) {
        this.confettiParticles.push({
          x: this.overlayCanvas.width / 2,
          y: this.overlayCanvas.height / 2,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.7) * 18,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          opacity: 1
        });
      }
    }

    drawConfetti(ctx) {
      if (this.confettiParticles.length === 0) return;

      for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
        const p = this.confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravedad
        p.rotation += p.rotSpeed;
        p.opacity -= 0.012;

        if (p.opacity <= 0) {
          this.confettiParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
    }

    // ========================================================================
    // EXPORTAR DIBUJO A IMAGEN PNG
    // ========================================================================
    exportDrawingPNG() {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = this.drawingCanvas.width;
      exportCanvas.height = this.drawingCanvas.height;
      const ctx = exportCanvas.getContext('2d');

      // Fondo oscuro elegante
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Opcionalmente dibujar la cuadrícula sutil
      if (this.showGrid) {
        ctx.drawImage(this.gridCanvas, 0, 0);
      }

      // Dibujar trazos
      ctx.drawImage(this.drawingCanvas, 0, 0);

      // Marca de agua sutil
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('🐢 Creado con Tortuga LOGO', 16, exportCanvas.height - 16);

      // Descargar enlace
      const link = document.createElement('a');
      link.download = `dibujo-tortuga-logo-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      this.log('📸 ¡Dibujo exportado como imagen PNG con éxito!', 'success');
      this.sound.playSuccess();
    }
  }

  // Iniciar el juego cuando el DOM esté listo
  window.addEventListener('DOMContentLoaded', () => {
    window.logoTurtleGame = new TurtleGame();
  });
})();


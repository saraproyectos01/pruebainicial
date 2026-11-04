# 💧 Aqua Colores · Gotas Líquidas 8x8 Bubble Shooter

Juego web interactivo de agua de colores con un tablero cuadrado de 8x8 lleno de gotas líquidas brillantes, efectos acuáticos orgánicos, control por texto o voz y nombres inventados dinámicos.

---

## 🎮 Características del Juego

1. **Tablero 8x8 con Coordenadas Claras:**
   - **Columnas A - H** de izquierda a derecha.
   - **Filas 1 al 8** de arriba hacia abajo.
   - Esquinas rotuladas (ej. `A1` arriba a la izquierda, `H8` abajo a la derecha).
   - Flechas interactivas en los 4 bordes:
     - Flechas hacia abajo (↓) en la parte superior de cada columna.
     - Flechas hacia arriba (↑) en la parte inferior de cada columna.
     - Flechas hacia la derecha (→) en el lado izquierdo de cada fila.
     - Flechas hacia la izquierda (←) en el lado derecho de cada fila.

2. **Aspecto Visual de Agua Líquida:**
   - Gotas con brillo especular translúcido curvo, sombras profundas y oscilación orgánica (*wobble* elástico de agua).
   - Paleta de colores vivos: Verde Esmeralda, Rojo Rubí, Azul Océano, Amarillo Ámbar, Naranja Cítrico, Púrpura Amatista y Cian Cristalino.

3. **Mecánica de Fusión y Crecimiento:**
   - Al tocarse dos gotas del **mismo color**, se fusionan en una gota más grande (*coalescencia líquida*), incrementando su nivel y tamaño.
   - Su nombre evoluciona a versiones más poderosas (ej. *Mega-Zumi*, *Ultra-Onka*).

4. **Choque de Distinto Color y Screen Shake:**
   - Cuando chocan gotas de **colores diferentes**, la pantalla se sacude (*screen shake* de líquido).
   - Ambas gotas mutan inmediatamente a **nuevos nombres inventados** (ej. *Zumi*, *Onka*, *Treli*, *Bloop*, *Pluki*, *Vixa*, etc.).

5. **Control por Texto y por Voz (Micrófono):**
   - Puedes escribir en el cuadro de texto coordenadas como `C3` o nombres como `Zumi` para apuntar a esa gota.
   - Puedes activar el botón de micrófono 🎙️ (usando Web Speech API) y decir en voz alta *"C3"*, *"Zumi"* o el nombre de cualquier gota o color para seleccionarla.

6. **Audio Nativo Acuático:**
   - Efectos de sonido sintetizados en tiempo real mediante la **Web Audio API** (sin librerías ni archivos externos).

---

## 🚀 Despliegue en Vercel

Este proyecto está integrado en el **Hub Multi-Proyecto** de la raíz del repositorio y optimizado para Vercel:
- Enlace de retorno al Hub: `<a href="../" class="btn-back">🏠 Volver al Hub</a>`
- Ruta en producción: `https://<tu-app>.vercel.app/aqua-colores/`


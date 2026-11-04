# 🐢 Tortuga LOGO: Juego Educativo de Programación

Un entorno interactivo y gamificado inspirado en el legendario lenguaje **LOGO** (creado por Seymour Papert en el MIT), diseñado para enseñar conceptos de programación, lógica secuencial, ángulos, geometría y pensamiento computacional a través del dibujo con una simpática tortuguita animada.

---

## ✨ Características Principales

1. **🌟 Modo Misiones y Desafíos (10 Niveles Pedagógicos)**:
   - Progresión guiada paso a paso:
     1. *¡Primeros Pasos!*: Movimiento lineal hacia la lechuga 🥬.
     2. *El Giro Recto*: Giros de 90° hacia la gema azul 💎.
     3. *La Escalera Mágica*: Secuencias combinadas y coordinación.
     4. *El Cuadrado Sagrado*: Cerrar formas geométricas de 4 lados.
     5. *El Poder de REPITE*: Introducción a bucles (`REPITE 4 [ ... ]`).
     6. *El Triángulo Equilátero*: Ángulos exteriores (360 / 3 = 120°).
     7. *La Estrella Mágica*: Geometría avanzada con giros de 144°.
     8. *El Hexágono Multicolor*: Bucles de 6 pasos con modo arcoíris.
     9. *La Casita Soñada*: Composición de figuras (cuadrado + triángulo).
     10. *El Mandala Floral*: Bucles anidados (`REPITE [ REPITE [ ... ] ]`).
   - Sistema de calificación con hasta **3 estrellas** según la optimización del código.
   - Pistas pedagógicas desplegables para ayudar al estudiante.
   - Efectos de confeti y fanfarria al superar cada misión.

2. **🎨 Modo Estudio Libre (Playground)**:
   - Lienzo ilimitado para crear figuras artísticas y experimentar.
   - **Galería de figuras clásicas en 1 clic**: Cuadrado, Triángulo, Estrella, Flor Mandala, Espiral Arcoíris, Copo de Nieve Fractal, Casita y Mini Árbol.
   - Paleta de colores directos (Verde, Azul, Rojo, Ámbar, Púrpura, Rosa, Cian, Blanco, Modo Arcoíris dinámico) y selector de grosor de lápiz.
   - **Exportación en alta resolución**: Descarga tu arte como imagen PNG con 1 clic.

3. **🐢 Intérprete LOGO Bilingüe (Español / Inglés)**:
   - Soporta sintaxis en español y en inglés, tanto completa como abreviada:
     - `AVANZA` / `AV` / `FORWARD` / `FD`
     - `RETROCEDE` / `RE` / `BACK` / `BK`
     - `GIRADERECHA` / `GD` / `RIGHT` / `RT`
     - `GIRAIZQUIERDA` / `GI` / `LEFT` / `LT`
     - `SUBEPLUMA` / `SP` / `PENUP` / `PU`
     - `BAJAPLUMA` / `BP` / `PENDOWN` / `PD`
     - `COLOR` / `COL` / `SETPENCOLOR` (nombres en español/inglés, hex o arcoíris)
     - `GROSOR` / `ANCHO` / `SETWIDTH`
     - `REPITE` / `REPEAT` (con soporte para bucles anidados)
     - `CENTRO` / `HOME`
     - `BORRA` / `LIMPIAR` / `CLEAR` / `CS`
     - `RUMBO` / `SETH`
     - `POSICION` / `IR` / `SETPOS`
     - `ESPERA` / `WAIT`
   - Comentarios con `#`, `;` o `//`.

4. **🕹️ Bloques y Botonera Rápida**:
   - Ideal para principiantes o niños: botones visuales que insertan órdenes al instante sin necesidad de teclear.

5. **⚡ Control de Animación & Telemetría**:
   - Selector de velocidad desde ultra lenta (para entender cada instrucción) hasta instantánea (rayo).
   - Botón de **Paso a Paso** para depurar la ejecución comando a comando.
   - Cuadrícula milimétrica cartesiana con ejes `X / Y`.
   - Brújula / Transportador interactivo que muestra los grados de orientación en tiempo real.

6. **🎵 Efectos de Sonido Sintetizados**:
   - Pasitos de la tortuga, giros, sonido de lápiz, errores pedagógicos y fanfarria de victoria sintetizados mediante Web Audio API (sin dependencias externas).

---

## 🚀 Cómo Ejecutar

Abre el archivo `index.html` en cualquier navegador web moderno, o navega desde el portal central de proyectos en `../`.


# 🐛 Gusanito Glotón (Snake Arcade Game)

Juego arcade moderno y responsivo del gusano que come frutas, crece en tamaño, genera efectos visuales, partículas, efectos de sonido y registra récords. Listo para desplegar en **Vercel** en un clic.

---

## 🌟 Características

- **Visuales Modernos y Fluídos:** Gráficos en HTML5 Canvas a 60 FPS con animaciones de cabeza, ojitos dinámicos, cola cónica y resplandor.
- **Sistema de Comida y Bonos:** Frutas normales (manzana, fresa, cerezas, naranja) y estrellas doradas de bonificación con cuenta regresiva.
- **Efectos de Partículas y Sacudida de Pantalla:** Salpicaduras de jugo al comer y vibración de impacto al perder.
- **Efectos de Sonido Sintéticos (Web Audio API):** Sonidos nativos generados en tiempo real sin dependencias de archivos de audio externos.
- **Control Total y Multiplataforma:**
  - 💻 **Teclado:** Flechas de dirección o teclas `W`, `A`, `S`, `D`.
  - ⏸️ **Pausa:** Tecla `Espacio`, `P`, `Esc` o botón en pantalla.
  - 📱 **Móviles y Tablets:** Cruceta virtual (D-Pad táctil) y soporte para gestos táctiles (Swipe).
- **Selector de Dificultad y Reglas:**
  - Velocidades: *Tranquilo*, *Normal*, *Rápido*, *Extremo*.
  - Reglas de Pared: *Paredes Sólidas* o modo *Sin Fin (Portal)* atravesando los bordes.
- **Persistencia de Récord:** Guarda tu mejor puntuación en `localStorage`.

---

## 🚀 Despliegue en Vercel

Este proyecto está optimizado con `vercel.json` para despliegues instantáneos sin configuración compleja.

### Opción A: Desplegando el repositorio `pruebainicial` completo
Si conectas todo tu repositorio `pruebainicial` a Vercel:
1. En la configuración del proyecto en Vercel, en la sección **Root Directory**, selecciona la carpeta `gusano-game`.
2. Haz clic en **Deploy**. ¡Listo!

*(Nota: También se incluye un enrutador en la raíz del repositorio para que funcione automáticamente si no configuras el Root Directory).*

### Opción B: Con Vercel CLI
```bash
cd gusano-game
vercel
```

---

## 🎮 Probar en Local

Puedes abrir directamente el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Edge, Firefox, Safari) o utilizar un servidor local como `Live Server` de VS Code o `npx serve`.


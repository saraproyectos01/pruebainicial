# pruebainicial · Hub Multi-Proyecto Web

Repositorio monorepo/multi-proyecto conectado a GitHub y optimizado para despliegue estático continuo en **Vercel**:  
🔗 [https://github.com/saraproyectos01/pruebainicial.git](https://github.com/saraproyectos01/pruebainicial.git)

---

## 🧭 Arquitectura y Reglas del Repositorio (Guía para Desarrolladores e IA)

> [!IMPORTANT]
> **REGLA FUNDAMENTAL DE ARQUITECTURA:**  
> La raíz del repositorio **NUNCA** debe redirigir a un solo proyecto en particular. La raíz es un **Hub / Portal Central Dinámico** que lista y permite navegar entre todas las aplicaciones y experimentos web alojados en este repositorio.

### 📁 Estructura del Directorio

```text
pruebainicial/
├── index.html            # Hub Principal Dinámico (Portal de Proyectos)
├── projects.json         # Registro centralizado de proyectos (Metadata)
├── vercel.json           # Configuración de hosting estático en Vercel
├── README.md             # Esta documentación y guía de estándares
├── .scripts/
│   └── gitpush.ps1       # Script automatizado de push a GitHub (Método Tanque)
│
├── gusano-game/          # PROYECTO 1: Gusanito Glotón (Arcade Canvas)
│   ├── index.html        # Entrypoint del proyecto (con botón de retorno al Hub)
│   ├── style.css         # Estilos específicos del proyecto
│   ├── game.js           # Lógica del proyecto
│   └── README.md         # Documentación propia del proyecto
│
└── [nuevo-proyecto]/     # CADA NUEVO PROYECTO VA EN SU PROPIA CARPETA
    ├── index.html
    └── ...
```

---

## 🤖 Protocolo Obligatorio para Crear Nuevos Proyectos (Instrucciones para IA)

Cada vez que se solicite crear una nueva aplicación, juego, herramienta o experimento en este repositorio, la IA o el desarrollador **DEBE** seguir rigurosamente este procedimiento:

### 1. Crear una Carpeta Aislada
- Nombre de la carpeta en minúsculas y separado por guiones (kebab-case), e.g. `calculadora-pro`, `pomodoro-timer`, `gusano-game`.
- Ubicación: directamente en la raíz de `pruebainicial/<nombre-proyecto>/`.
- La carpeta debe contener su propio `index.html` autoportante y sus assets/código (`style.css`, `app.js`, etc.).

### 2. Incluir Navegación de Regreso al Hub
- En el `index.html` del nuevo proyecto (preferiblemente en el navbar, header o esquina superior), se debe incluir un enlace o botón para regresar al Portal Central:
  ```html
  <a href="../" class="btn-back" title="Volver al Portal Central">🏠 Volver al Hub</a>
  ```

### 3. Registrar el Proyecto en `projects.json`
- Añadir el nuevo objeto dentro del array en `projects.json` con la estructura oficial:
  ```json
  {
    "id": "nombre-proyecto",
    "title": "Nombre Presentable del Proyecto",
    "description": "Descripción breve y clara de qué hace la aplicación.",
    "category": "Juegos | Herramientas | Web | Utilidades",
    "icon": "🚀",
    "path": "./nombre-proyecto/",
    "status": "Listo",
    "tags": ["Tecnología 1", "Tecnología 2", "Tema"],
    "date": "Mes Año"
  }
  ```

### 4. Mantener Sincronizado el Fallback en `index.html` (Raíz)
- En `index.html` de la raíz existe una constante `DEFAULT_PROJECTS`. Si se agrega un proyecto nuevo, también se debe añadir al arreglo de fallback para garantizar que funcione tanto en Vercel como al abrirse localmente vía `file://` sin problemas de CORS.

### 5. Conservar la Configuración de Vercel
- El archivo `vercel.json` en la raíz debe mantenerse con:
  ```json
  {
    "version": 2,
    "cleanUrls": true,
    "trailingSlash": true
  }
  ```
  > **Nota Técnica:** `"trailingSlash": true` es indispensable en proyectos con subcarpetas para que URLs como `/gusano-game/` mantengan la barra final. Sin ella, el navegador resuelve los archivos relativos (`style.css`, `game.js`) en la raíz del dominio arrojando errores 404.

---

## 📋 Lista de Proyectos Activos

| Proyecto | Carpeta | Categoría | Tecnologías | Enlace Relativo |
| :--- | :--- | :--- | :--- | :--- |
| **Gusanito Glotón** | `/gusano-game/` | Juegos | HTML5 Canvas, Web Audio API, Vanilla JS | [`./gusano-game/`](./gusano-game/) |

---

## 🚀 Despliegue en Vercel

Este repositorio está preparado para funcionar de forma **Plug & Play**:
1. Conectar el repositorio de GitHub `pruebainicial` en [Vercel](https://vercel.com).
2. Dejar la opción **Root Directory** en la raíz (`./`).
3. Vercel desplegará automáticamente:
   - La raíz `https://<tu-app>.vercel.app/` mostrando el **Hub de Proyectos**.
   - Cada proyecto bajo su subdirectorio: `https://<tu-app>.vercel.app/gusano-game/`.

---

## 🛡️ Script de Push Automático (Método Tanque Anti-Choque)

Para sincronizar tus cambios a GitHub evitando conflictos de forma automática:

Ubicación: `.scripts\gitpush.ps1`

### Uso en PowerShell:
```powershell
# Push automático estándar
.\.scripts\gitpush.ps1

# Push con mensaje descriptivo personalizado
.\.scripts\gitpush.ps1 -Mensaje "Agregado nuevo proyecto y actualizado registro"
```

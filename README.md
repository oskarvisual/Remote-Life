# Remote Life

Juego de simulación en pixel-art para navegador sobre sobrevivir al teletrabajo, las demandas familiares, el dinero, el alquiler y el estrés.

## Ejecución local

```bash
npm install
npm run dev
```

Abre la URL que Vite muestra en la consola (por defecto `http://localhost:5173`).

### Scripts disponibles

- `npm test` o `npm run test` — Ejecuta la suite de pruebas unitarias con **Vitest**.
- `npm run check` — Ejecuta verificación completa (typecheck + linter + formateo + tests).
- `npm run build` — Compila el proyecto con TypeScript y empaqueta con Vite para producción.
- `npm run lint` — Ejecuta ESLint en todo el código fuente.
- `npm run format` — Formatea el código con Prettier.

---

## Controles

- **A / D** o **Flechas izquierda / derecha** — Caminar por el apartamento.
- **E** — Interactuar según la estación:
  - **BED**: Descansar / siesta (recupera energía y reduce estrés).
  - **FRIDGE**: Comer comida del refrigerador (satisface el hambre).
  - **DESK**: Abrir la computadora del trabajo (`REMOTE//OS`).
  - **BABY CRIB**: Cuidar y calmar al bebé.
- En la computadora:
  - **WORK**: Completar tareas de clientes con clicks en _DO WORK_.
  - **EMAIL**: Leer avisos y acceder rápidamente a apps.
  - **CALENDAR**: Consultar la reunión del día (10:30 en el reloj del juego).
  - **JOBS**: Aceptar encargos freelance para ganar dinero adicional.
  - **MARKET**: Comprar víveres para la nevera, café, app de meditación o juguetes.
  - **BANK**: Monitorear fondos y cuenta regresiva del alquiler ($700 cada 7 días).
  - **Reunión en vivo**: Mueve el mouse en la ventana para mantener la atención del equipo y responde la pregunta del lead.

---

## Arquitectura del Proyecto

El código está estructurado en TypeScript utilizando **Programación Orientada a Objetos** limpia y altamente extensible:

```
src/
├── game/
│   ├── activities/      # Clases de actividades (NapActivity, CareActivity, EatActivity...)
│   ├── config/          # Ajustes de balance, dificultad, contenidos y textos de fin de juego
│   ├── core/            # Núcleo desacoplado: GameState, EventBus tipado, GameSystem base, Time, Random
│   ├── scenes/          # Escena visual en Phaser (ApartmentScene)
│   ├── systems/         # Sistemas modulares (Clock, Task, Meeting, Baby, Needs, Economy, Market, Jobs...)
│   └── GameSession.ts   # Orquestador del juego (Composition Root desacoplado del DOM/Phaser)
├── ui/                  # Componentes de interfaz reactiva usando lit-html y <dialog> nativo
│   ├── Component.ts     # Clase base para componentes con suscripción a eventos
│   ├── Computer.ts      # Computadora de escritorio y videollamada interactiva
│   ├── HUD.ts           # Estadísticas vitales, reloj y avisos
│   ├── Notifications.ts # Toasts de notificaciones
│   ├── StartMenu.ts     # Menú modal de dificultad
│   └── GameOverModal.ts # Modal de victoria o fin de juego con reinicio
└── main.ts              # Inicialización y ciclo de vida de la aplicación
```

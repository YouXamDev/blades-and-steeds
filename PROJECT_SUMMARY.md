# Blades & Steeds (买刀买马) - Project Summary

A real-time multiplayer strategic battle game built on Cloudflare Workers + Durable Objects with React frontend.

## ✅ Completed Features

### Backend (Cloudflare Workers + Durable Objects)

1. **Durable Object Game Room** (`worker/gameRoom.ts`)
   - WebSocket support with hibernation API
   - Game state persistence
   - Player session management
   - Class selection system
   - Turn-based game logic foundation

2. **Worker Entry Point** (`worker/index.ts`)
   - Room creation API
   - Room listing API
   - WebSocket routing to Durable Objects

3. **Configuration** (`wrangler.jsonc`)
   - Durable Objects binding
   - Migration configuration
   - Asset handling for SPA

### Frontend (React + TailwindCSS)

1. **Authentication System** (`src/utils/auth.ts`)
   - Cookie-based user identification
   - Persistent user profiles
   - QQ avatar integration

2. **Type System** (`src/types/game.ts`)
   - Complete game state types
   - All 9 player classes
   - Item types and actions
   - WebSocket message types

3. **Internationalization** (`src/i18n/`)
   - English and Chinese translations
   - Dynamic language switching
   - Persistent language preference

4. **Theme System** (`src/contexts/ThemeContext.tsx`)
   - Light/Dark/System modes
   - Automatic system preference detection
   - Persistent theme preference

5. **Pages**
   - **Home** (`src/pages/Home.tsx`) - Main lobby with room list
   - **Profile** (`src/pages/Profile.tsx`) - User profile setup with QQ avatar
   - **Create Room** (`src/pages/CreateRoom.tsx`) - Public/Private room creation
   - **Game Room** (`src/pages/GameRoom.tsx`) - Full game interface
     - Waiting room with player list
     - Class selection phase
     - Game board (foundation ready for expansion)
   - **Settings** (`src/pages/Settings.tsx`) - Language and theme settings

6. **Hooks**
   - `useWebSocket` - WebSocket connection management with auto-reconnect
   - `useTheme` - Theme management

7. **Responsive Design**
   - Mobile-first approach
   - Desktop optimizations
   - Flexible grid layouts

## 🎮 Game Features Implemented

### Core Systems
- ✅ Room management (public/private)
- ✅ Player authentication
- ✅ WebSocket real-time communication
- ✅ Class selection (2 random classes per player)
- ✅ Turn-based game structure
- ✅ Player inventory system
- ✅ Health and steps tracking

### Game Classes (From game.py)
All 9 classes are defined with initial inventory and purchase rights:
1. Mage (法师) - Potion healing
2. Archer (弓箭手) - Bow and arrow
3. Rocketeer (火箭兵) - Rocket launcher
4. Bomber (爆破手) - Bombs
5. Boxer (拳击手) - Gloves (bronze/silver/gold)
6. Monk (武僧) - Belts (bronze/silver/gold)
7. Alien (外星人) - UFO teleportation
8. Fatty (胖子) - Special fat armor
9. Vampire (吸血鬼) - Lifesteal mechanic

## 🚧 Game Logic To Be Implemented

The following game mechanics from `game.py` need to be implemented in the Durable Object:

1. **Combat System**
   - Damage calculation: `(weapon_damage) - (armor_count) + 1`
   - Knife attacks (base damage 1)
   - Horse attacks (base damage 3 + forced movement)
   - Special class attacks (bow, rocket, punch, kick, etc.)

2. **Movement System**
   - City <-> Central movement
   - Step cost calculation
   - Random step distribution

3. **Purchase System**
   - City-only purchases
   - Purchase rights validation
   - Item acquisition

4. **Action System**
   - Rob action
   - Special abilities (teleport, hug, bomb placement, etc.)
   - Delayed effects (potions, rockets)

5. **Win Condition**
   - Last player standing
   - Bomber co-destruction victory

6. **Item Management**
   - Class-specific item restrictions
   - Item drop on death
   - Loot selection

## 📁 Project Structure

```
blades-and-steeds/
├── worker/
│   ├── index.ts           # Worker entry point
│   └── gameRoom.ts        # Durable Object implementation
├── src/
│   ├── pages/             # React pages
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utilities
│   ├── types/             # TypeScript types
│   ├── i18n/              # Internationalization
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── wrangler.jsonc         # Cloudflare configuration
├── package.json
└── vite.config.ts
```

## 🚀 Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm run dev

# Build
pnpm run build

# Deploy to Cloudflare
pnpm run deploy  # (needs to be added to package.json)
```

## 📝 Next Steps

1. Implement complete game logic in `gameRoom.ts`:
   - Combat calculations
   - Movement validation
   - Purchase system
   - Special abilities

2. Enhance game UI:
   - Game board visualization
   - Action buttons
   - Animation effects
   - Sound effects

3. Add features:
   - Chat system
   - Game replay
   - Statistics tracking
   - Leaderboard

4. Testing:
   - Unit tests
   - Integration tests
   - Load testing

5. Deployment:
   - Add deploy script
   - Environment configuration
   - CI/CD pipeline

## 🎨 Design Features

- Clean, modern UI with glassmorphism effects
- Smooth transitions and animations
- Accessible color schemes
- Mobile-responsive layout
- Lucide icons throughout
- Gradient accents

## 🌐 Supported Browsers

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

## 📄 License

[Your chosen license]

# Tetris Game - Change Log

## [2.0.0] - 2026-09-02

### 🔐 Major Feature: Player Authentication System
- **Email & Password Authentication**: Full in-app registration, secure sign-in, and password reset workflows.
- **Native Google Sign-In**: One-tap sign in with official 4-color Google "G" logo and native Android bottom sheet support.
- **Offline Guest Protection**: Local guest play is fully supported; guest high scores remain safely on device without cloud pollution.
- **Account Pill & Dialog**: Top-right live status pill showing active player name, online status dot, and account management dialog.

### 🏆 Major Feature: Cloud Global Leaderboard
- **Live Cloud Leaderboard**: Real-time rankings synced across all devices via Firebase Cloud Firestore.
- **Podium Display**: Retro arcade podium honoring #1 Gold (👑🥇), #2 Silver (🥈), and #3 Bronze (🥉).
- **Automated Rank Sync**: Personal best scores, lines cleared, and levels automatically save to cloud for signed-in players upon game over.
- **Guest Access**: Guest players can view the entire global leaderboard with zero restrictions.

### 👥 Major Feature: Arcade Friend System
- **Arcade Friend Codes**: Every player receives a unique, memorable Friend Code (e.g. `TR-84B91F`) with 1-tap copy.
- **Search & Add**: Look up any player across the globe by their Friend Code.
- **Real-Time Requests**: Incoming friend requests tab with instant Accept (✓) and Decline (✕) buttons.
- **Friends-Only Leaderboard Filter**: Toggle between `[🌐 GLOBAL]` and `[👥 FRIENDS]` on the Leaderboard to compete directly against your friends!
- **Burger Menu Integration**: Direct "👥 Friends" access from the slide-out menu on the title screen.

### 🎯 Major Feature: Multi-Tier Recommendation Engine
- **50% Related & Nearby Players**: Future-proof stepping stone architecture detecting location proximity and family/contact connections.
- **35% Close Skill Rivals**: Finds players with high scores within competitive striking distance of yours.
- **10% Pro Masters**: Highlights inspirational top players with scores several times higher (2x to 22x) than yours.
- **5% Rising Players**: Suggests players with lower high scores (`<= 0.75x`) to mentor or compete with.
- **Dynamic Neon Badges**: Distinct purple (📍 Nearby), blue (⚔️ Rival), gold (👑 Pro), and green (🌱 Rising) badges.

### 🎮 Gameplay & Quality of Life Fixes
- **Game Over Navigation**: Added dedicated "MAIN MENU" button in game-over overlay and restored menu navigation upon game over.
- **Screen Wake Lock Guard**: Safely handled `activateKeepAwakeAsync` and added `android.permission.WAKE_LOCK` to eliminate random screen lock crashes.
- **Firestore Query Fix**: Switched to single-field indexing with in-memory tie-breakers to resolve the composite index bug.

## [1.1.0] - 2026-01-04

### Visual Enhancements

- **Ghost Piece Preview**

  - Added colored outline showing exactly where blocks will land
  - Unique colors for each block type for easy identification
  - Transparent outline that doesn't interfere with gameplay
  - Real-time position updates as piece moves or rotates

- **Motion Blur Animation**

  - Stunning trail effect when using hard drop
  - Multiple blur lines with varying opacity and thickness
  - Glowing effect that follows the falling piece
  - Smooth 60fps animation using native driver
  - Trail fades as piece reaches destination

- **Second Next Piece Preview**
  - Display the next 2 upcoming pieces
  - Helps with strategic planning
  - Smaller preview for second piece
  - Located in right panel below first next piece

### Gameplay Improvements

- **New Block Types**

  - Diagonal Block: 3x3 diagonal pattern (rare)
  - Reverse Diagonal Block: Mirrored diagonal (rare)
  - Straight Z Block: Extended Z-shape, 4 cells wide (uncommon)
  - Reverse Straight Z Block: Mirrored straight Z (uncommon)
  - Long L Block: 5-cell L-shape (very rare)
  - Reverse Long L Block: Mirrored long L (very rare)

- **Weighted Block Spawning**

  - Classic pieces (I, O, T, S, Z, J, L) spawn 85-90% of the time
  - Special pieces are uncommon to rare
  - Cross block remains super rare (1% spawn rate)
  - Balanced difficulty progression

- **Enhanced Hard Drop**
  - Instant piece placement without snap-back bug
  - Smooth animation completion before next piece spawns
  - Motion blur visual feedback
  - Improved collision detection

### Controls Update

- **Redesigned Layout**

  - Separated right-side controls for better accessibility
  - Hold button (top-left), Rotate button (top-right)
  - Hard Drop button centered at bottom
  - Increased spacing between D-pad buttons
  - Better touch target sizes

- **Improved Responsiveness**
  - Visual feedback for all button presses
  - Continuous hold support for movement and rotation
  - Reduced input delay
  - Better pressure detection

### Technical Improvements

- **Audio System Migration**

  - Migrated from deprecated expo-av to expo-audio
  - Improved audio performance with AudioPlayer API
  - Better sound effect pooling and reusability
  - Reduced memory footprint for audio playback

- **Keep-Awake Functionality**

  - Screen stays on during active gameplay
  - Automatically deactivates when paused or in menu
  - Graceful error handling for device compatibility

- **Metro Bundler Optimization**

  - Fixed symlink resolution issues
  - Improved module path handling

- **Performance**
  - Native driver for all animations (60fps)
  - Optimized rendering for ghost piece
  - Enhanced audio playback efficiency

### User Interface

- **Patch Notes Screen**

  - Accessible from burger menu
  - Detailed version history
  - Organized by feature categories
  - Easy-to-read formatting

- **Updated Help Screen**
  - Documented ghost piece feature
  - Explained motion blur animation
  - Added all new block types
  - Enhanced pro tips section
  - Visual features section

### Bug Fixes

- Fixed piece snapping back after hard drop placement
- Resolved ghost piece color matching real piece
- Fixed Metro bundler path resolution errors
- Corrected block spawning probability calculations
- Fixed keep-awake activation errors

---

## [1.0.0] - 2026-01-02

### Released [https://github.com/jhonkeithman123/Tetris/releases]

Production release for Android

### Added

- **Core Gameplay**

  - Classic Tetris mechanics with 7 piece types + special cross block
  - Full piece rotation with wall kick support
  - Hard drop functionality for instant piece placement
  - Hold/swap piece feature to save pieces for later use

- **Scoring System**

  - Dynamic scoring based on lines cleared and current level
  - Line multipliers: 1 line = 100pts, 2 lines = 200pts, 3 lines = 300pts, 4 lines = 400pts
  - Level-based difficulty scaling (1-10 levels)
  - High score tracking with persistent storage

- **Combo System**

  - Consecutive line clear combo multiplier (up to 7x)
  - Combo bonus: +10 points × combo count
  - 6-second combo timer resets after each line clear
  - Combo sound effects and visual feedback

- **Game Features**

  - Responsive game board with preview of next piece
  - Level progression system (every 10 lines cleared = +1 level)
  - Game speed increases with each level
  - Pause/Resume functionality
  - Game over detection with restart option
  - New high score notification

- **Audio System**

  - Background game music
  - Sound effects for actions (move, rotate, hard drop, swap, etc.)
  - Combo celebration sounds (combo1 through combo7)
  - Adjustable music and SFX volume controls
  - Toggle audio on/off independently

- **Settings & Storage**

  - Persistent settings storage (AsyncStorage)
  - Customizable audio preferences
  - Game statistics tracking (high score, high lines, high level, games played)
  - Game history (last 10 games)

- **User Interface**

  - Main menu with Play, Settings, and Help options
  - In-game HUD showing score, lines, time, level, and combo
  - Intuitive touch controls with visual feedback
  - Pause overlay and game over screen
  - Help/Tutorial screen with combo system explanation

- **Controls**
  - D-Pad navigation (left/right movement)
  - Down button for faster drop
  - Rotate button with continuous hold support
  - Hard drop button for instant placement
  - Pause button in top-right corner
  - Hold button for piece swapping

### Technical

- Built with React Native and Expo
- TypeScript for type safety
- State management with React Hooks
- Responsive design for various Android devices
- Sound management with expo-av
- Local storage with AsyncStorage

### Known Limitations

- Maximum level cap at level 10
- Maximum combo at 7x multiplier
- Game history limited to last 10 games

---

## Future Versions

### Planned Features

- Multiplayer mode
- Cloud save synchronization
- Online leaderboard system
- Additional difficulty modes (Hard, Easy)
- Customizable themes and color schemes
- Accessibility features (colorblind modes)
- Game replay system
- Achievements and badges
- Profile system with account management
- Social features (friend challenges)

import LineClearEffect from "./components/LineClearEffect";
import PauseMenuModal from "./components/PauseMenuModal";
import ditroyService, {
  AdaptiveDifficultyState,
} from "./services/ditroyService";
import useSound from "@/app/hooks/useSound";
import storeManager from "@/app/utils/storeManager";
import leaderboardService from "@/app/services/leaderboardService";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Board from "./board";
import Controls from "./controls";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BoardCell,
  calculateScore,
  checkCollision,
  clearLines,
  createEmptyBoard,
  createPiece,
  findFullRows,
  getStackHeight,
  hardDrop,
  mergePiece,
  movePiece,
  Piece,
  renderBoardWithPieceAndGhost,
  rotatePiece,
} from "./engine";

const { width, height } = Dimensions.get("window");
const CELL_SIZE = Math.min(
  (width * 0.6) / BOARD_WIDTH,
  (height * 0.65) / BOARD_HEIGHT
);

const COMBO_TIMEOUT = 6000; // 6 seconds

interface TetrisGameProps {
  onBackToMenu: () => void;
  soundHook: ReturnType<typeof useSound>;
}

export default function TetrisGame({
  onBackToMenu,
  soundHook,
}: TetrisGameProps) {
  // Game stat states
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [lines, setLines] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Game states
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Button & Modal States
  const [restartPressed, setRestartPressed] = useState<boolean>(false);
  const [menuPressed, setMenuPressed] = useState<boolean>(false);
  const [pauseMenuVisible, setPauseMenuVisible] = useState<boolean>(false);

  // Line Clear Animation State
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [linesToClearCount, setLinesToClearCount] = useState<number>(0);
  const isLineClearingRef = useRef<boolean>(false);

  // DITroy Adaptive Online Difficulty & Timing State
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<AdaptiveDifficultyState>({
    isOnline: false,
    dropIntervalMs: 1000,
    difficultyTier: "standard",
    speedMultiplier: 1.0,
  });

  // Game Board
  const [board, setBoard] = useState<BoardCell[][]>(createEmptyBoard());

  // Game Effects
  const [isDropAnimating, setIsDropAnimating] = useState<boolean>(false);
  const [dropStartY, setDropStartY] = useState<number>(0);
  const [dropEndY, setDropEndY] = useState<number>(0);
  const dropAnimation = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;

  // Game Logic States
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null); // First next piece
  const [nextNextPiece, setNextNextPiece] = useState<Piece | null>(null); // Second next piece
  const [heldPiece, setHeldPiece] = useState<Piece | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDropTimeRef = useRef<number>(Date.now());
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPieceRef = useRef<Piece | null>(null);
  const boardRef = useRef<BoardCell[][]>(createEmptyBoard());
  const isPausedRef = useRef<boolean>(false);
  const gameOverRef = useRef<boolean>(false);
  const rotationRef = useRef<number>(0);
  const canHoldRef = useRef<boolean>(true);
  const heldPieceRef = useRef<Piece | null>(null);
  const nextPieceRef = useRef<Piece | null>(null);
  const nextNextPieceRef = useRef<Piece | null>(null);
  const isDropAnimatingRef = useRef<boolean>(false);
  const lastMoveSoundRef = useRef<number>(0);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Load high score and DITroy online status on component mount
  useEffect(() => {
    loadHighScore();
    ditroyService.checkOnlineStatus().then(() => {
      const initial = ditroyService.calculateAdaptiveDropInterval({
        score: 0,
        level: 1,
        lines: 0,
        combo: 0,
        stackHeight: 0,
        timeElapsed: 0,
      });
      setAdaptiveDifficulty(initial);
    });
  }, []);

  const loadHighScore = async () => {
    const savedHighScore = await storeManager.getHighScore();
    setHighScore(savedHighScore);
  };

  // Check and update high score (local & cloud if authenticated)
  const checkAndUpdateHighScore = async () => {
    if (score > highScore) {
      await storeManager.updateGameStats(score, lines, level);
      setIsNewHighScore(true);
      setHighScore(score);
    } else {
      // Still update stats even if not a high score
      await storeManager.updateGameStats(score, lines, level);
    }

    // Submit to cloud leaderboard ONLY if authenticated (local accounts do not upload)
    if (score > 0) {
      await leaderboardService.submitScoreIfAuthenticated(score, lines, level);
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused]);

  // Level up based on lines cleared
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level && newLevel <= 10) {
      setLevel(newLevel);
      soundHook.playEffect("spawn"); // Play level up sound
    }
  }, [lines]);

  // Calculate combo bonus score
  const calculateComboBonus = (comboCount: number): number => {
    return comboCount * 10; // +10, +20, +30, etc.
  };

  // Reset combo after timeout
  const resetComboTimer = () => {
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }

    if (combo > 0) {
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, COMBO_TIMEOUT);
    }
  };

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    canHoldRef.current = canHold;
  }, [canHold]);

  useEffect(() => {
    heldPieceRef.current = heldPiece;
  }, [heldPiece]);

  useEffect(() => {
    nextPieceRef.current = nextPiece;
  }, [nextPiece]);

  useEffect(() => {
    nextNextPieceRef.current = nextNextPiece;
  }, [nextNextPiece]);

  useEffect(() => {
    isDropAnimatingRef.current = isDropAnimating;
  }, [isDropAnimating]);

  // Clear combo timer on unmount or game over
  useEffect(() => {
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
    };
  }, []);

  // Reset combo timer when game is paused or over
  useEffect(() => {
    if (isPaused || gameOver) {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = null;
      }
    } else if (combo > 0 && gameStarted) {
      resetComboTimer();
    }
  }, [isPaused, gameOver, gameStarted]);

  // Process piece lock and trigger artistic line elimination
  const processPieceLock = (pieceToLock: Piece, targetBoard: BoardCell[][]) => {
    const mergedBoard = mergePiece(pieceToLock, targetBoard);
    const fullRows = findFullRows(mergedBoard);

    if (fullRows.length > 0) {
      // Freeze controls & drops during elimination animation
      isLineClearingRef.current = true;
      setCurrentPiece(null);
      setBoard(mergedBoard);
      setClearingRows(fullRows);
      setLinesToClearCount(fullRows.length);
      soundHook.playEffect("disappear");

      // Dynamic AI coach commentary on notable events
      ditroyService.requestEventCommentary(
        fullRows.length >= 4 ? "tetris" : "high_combo",
        {
          score,
          level,
          lines: lines + fullRows.length,
          combo: combo + 1,
          stackHeight: getStackHeight(mergedBoard),
          timeElapsed: time,
        }
      );
    } else {
      soundHook.playEffect("drop");
      setBoard(mergedBoard);
      setCurrentPiece(null);

      // Reset combo if no lines cleared
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = null;
      }
      setCombo(0);

      spawnNewPiece();
    }
  };

  // Called when LineClearEffect finishes its artistic flash & sweep animation
  const handleLineClearAnimationComplete = () => {
    const { newBoard, linesCleared } = clearLines(boardRef.current);
    setBoard(newBoard);
    setClearingRows([]);
    isLineClearingRef.current = false;

    if (linesCleared > 0) {
      const newCombo = Math.min(combo + 1, 7);
      setCombo(newCombo);

      const baseScore = calculateScore(linesCleared, level);
      const comboBonus = calculateComboBonus(newCombo);
      const totalScore = baseScore + comboBonus;

      setLines((prev) => prev + linesCleared);
      setScore((prev) => prev + totalScore);

      resetComboTimer();

      if (newCombo === 1) soundHook.playCombo("combo1");
      else if (newCombo === 2) soundHook.playCombo("combo2");
      else if (newCombo === 3) soundHook.playCombo("combo3");
      else if (newCombo === 4) soundHook.playCombo("combo4");
      else if (newCombo === 5) soundHook.playCombo("combo5");
      else if (newCombo === 6) soundHook.playCombo("combo6");
      else if (newCombo === 7) soundHook.playCombo("combo7");
    }

    spawnNewPiece();
  };

  // Move piece down (for automatic drops only)
  const moveDown = () => {
    const piece = currentPieceRef.current;
    const currentBoard = boardRef.current;

    if (!piece || isPausedRef.current || gameOverRef.current || isLineClearingRef.current) return;

    const movedPiece = movePiece(piece, currentBoard, "down");

    if (movedPiece) {
      setCurrentPiece(movedPiece);
    } else {
      processPieceLock(piece, currentBoard);
    }
  };

  // Spawn new piece
  const spawnNewPiece = () => {
    const piece = nextPiece || createPiece();
    const currentBoard = boardRef.current;

    if (checkCollision(piece, currentBoard)) {
      setGameOver(true);
      checkAndUpdateHighScore();
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = null;
      }
      return;
    }

    setCurrentPiece(piece);
    setNextPiece(nextNextPiece || createPiece());
    setNextNextPiece(createPiece());
    setRotation(0);
    setCanHold(true);
    lastDropTimeRef.current = Date.now();
  };

  const startGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(0);
    setTime(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    setHeldPiece(null);
    setCanHold(true);
    setIsNewHighScore(false);
    setClearingRows([]);
    isLineClearingRef.current = false;

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }

    const firstPiece = createPiece();
    const second = createPiece();
    const third = createPiece();

    setCurrentPiece(firstPiece);
    setNextPiece(second);
    setNextNextPiece(third);
    setRotation(0);
    lastDropTimeRef.current = Date.now();
  };

  // Game loop with DITroy Adaptive Timing
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused && !isLineClearingRef.current) {
      const stackH = getStackHeight(boardRef.current);
      const adaptive = ditroyService.calculateAdaptiveDropInterval({
        score,
        level,
        lines,
        combo,
        stackHeight: stackH,
        timeElapsed: time,
      });
      setAdaptiveDifficulty(adaptive);

      const interval = adaptive.dropIntervalMs;

      gameLoopRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastDropTimeRef.current >= interval) {
          moveDown();
          lastDropTimeRef.current = now;
        }
      }, 40);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, level, lines, combo, time]);

  // Play game music when game starts
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const timer = setTimeout(() => {
        soundHook.playMusic("game_sound");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, gameOver, isPaused]);

  // Stop music on game over
  useEffect(() => {
    if (gameOver) {
      soundHook.stopMusic();
      soundHook.playEffect("game_over");
    }
  }, [gameOver]);

  // Start Game
  useEffect(() => {
    startGame();
  }, []);

  // Back to menu / Pause combined handlers
  const handleOpenPauseMenu = () => {
    if (gameOver) {
      handleQuitToMenu();
      return;
    }
    setIsPaused(true);
    isPausedRef.current = true;
    soundHook.pauseMusic();
    setPauseMenuVisible(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    soundHook.resumeMusic();
    setPauseMenuVisible(false);
  };

  const handleRestartGame = () => {
    setPauseMenuVisible(false);
    soundHook.playEffect("spawn");
    startGame();
  };

  const handleQuitToMenu = () => {
    setPauseMenuVisible(false);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    soundHook.stopMusic();
    onBackToMenu();
  };

  // Hardware Back button triggers Pause Menu
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleOpenPauseMenu();
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  // Hold piece handler
  // Throttled sound effect to prevent native audio bridge bottlenecks
  const playMoveSound = useCallback(() => {
    const now = Date.now();
    if (now - lastMoveSoundRef.current > 70) {
      lastMoveSoundRef.current = now;
      soundHook.playEffect("move");
    }
  }, [soundHook]);

  // Hold piece handler (memoized for low latency)
  const handleHold = useCallback(() => {
    if (
      !currentPieceRef.current ||
      !canHoldRef.current ||
      isPausedRef.current ||
      gameOverRef.current ||
      isLineClearingRef.current
    )
      return;

    soundHook.playEffect("swap");

    const piece = currentPieceRef.current;
    const held = heldPieceRef.current;

    if (held) {
      const temp = {
        ...piece,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
      };
      const swapped = {
        ...held,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
      };

      setHeldPiece(temp);
      setCurrentPiece(swapped);
      currentPieceRef.current = swapped;
      setRotation(0);
      rotationRef.current = 0;
    } else {
      setHeldPiece({
        ...piece,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
      });
      const nextP = nextPieceRef.current || createPiece();
      setCurrentPiece(nextP);
      currentPieceRef.current = nextP;
      setNextPiece(nextNextPieceRef.current || createPiece());
      setNextNextPiece(createPiece());
      setRotation(0);
      rotationRef.current = 0;
    }

    setCanHold(false);
    canHoldRef.current = false;
  }, [soundHook]);

  // Control handlers (memoized with stable identities to prevent re-renders)
  const handleRotate = useCallback(() => {
    if (isPausedRef.current || gameOverRef.current || isLineClearingRef.current) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const result = rotatePiece(prev, rotationRef.current, boardRef.current);
      if (result) {
        rotationRef.current = result.rotation;
        setRotation(result.rotation);
        currentPieceRef.current = result.piece;
        soundHook.playEffect("rotate");
        return result.piece;
      }
      return prev;
    });
  }, [soundHook]);

  const handleMoveLeft = useCallback(() => {
    if (isPausedRef.current || gameOverRef.current || isLineClearingRef.current) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const movedPiece = movePiece(prev, boardRef.current, "left");
      if (movedPiece) {
        currentPieceRef.current = movedPiece;
        playMoveSound();
        return movedPiece;
      }
      return prev;
    });
  }, [playMoveSound]);

  const handleMoveDown = useCallback(() => {
    if (isPausedRef.current || gameOverRef.current || isLineClearingRef.current) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const movedPiece = movePiece(prev, boardRef.current, "down");
      if (movedPiece) {
        currentPieceRef.current = movedPiece;
        playMoveSound();
        return movedPiece;
      }
      return prev;
    });
  }, [playMoveSound]);

  const handleMoveRight = useCallback(() => {
    if (isPausedRef.current || gameOverRef.current || isLineClearingRef.current) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const movedPiece = movePiece(prev, boardRef.current, "right");
      if (movedPiece) {
        currentPieceRef.current = movedPiece;
        playMoveSound();
        return movedPiece;
      }
      return prev;
    });
  }, [playMoveSound]);

  const handleHardDrop = useCallback(() => {
    const piece = currentPieceRef.current;
    if (
      !piece ||
      isPausedRef.current ||
      gameOverRef.current ||
      isDropAnimatingRef.current ||
      isLineClearingRef.current
    )
      return;

    const currentBoard = boardRef.current;
    const droppedPiece = hardDrop(piece, currentBoard);
    const dropDistance = droppedPiece.y - piece.y;

    if (dropDistance === 0) {
      processPieceLock(piece, currentBoard);
      return;
    }

    setDropStartY(piece.y);
    setDropEndY(droppedPiece.y);
    setIsDropAnimating(true);
    isDropAnimatingRef.current = true;
    soundHook.playEffect("hard_drop");

    // Animate drop
    dropAnimation.setValue(0);
    trailOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(dropAnimation, {
        toValue: 1,
        duration: Math.min(220, dropDistance * 20),
        useNativeDriver: true,
      }),
      Animated.timing(trailOpacity, {
        toValue: 0,
        duration: Math.min(300, dropDistance * 30),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDropAnimating(false);
      isDropAnimatingRef.current = false;
      processPieceLock(droppedPiece, boardRef.current);
    });
  }, [soundHook]);

  const handleRestart = () => {
    soundHook.playEffect("spawn");
    startGame();
  };

  return (
    <View style={styles.container}>
      <PauseMenuModal
        visible={pauseMenuVisible}
        score={score}
        level={level}
        lines={lines}
        isOnline={adaptiveDifficulty.isOnline}
        difficultyTier={adaptiveDifficulty.difficultyTier}
        musicEnabled={soundHook.musicEnabled}
        sfxEnabled={soundHook.sfxEnabled}
        onToggleMusic={soundHook.setMusicEnabled}
        onToggleSfx={soundHook.setSfxEnabled}
        onResume={handleResume}
        onRestart={handleRestartGame}
        onQuitToMenu={handleQuitToMenu}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        keyboardShouldPersistTaps="always"
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TETRIS</Text>
        </View>

        {/* Main Game Area */}
        <View style={styles.mainContent}>
          {/* Left Panel */}
          <View style={styles.leftPanel}>
            {/* Hold Box */}
            <View style={styles.holdBox}>
              <Text style={styles.holdLabel}>HOLD</Text>
              <View style={styles.holdPieceContainer}>
                {heldPiece && (
                  <View>
                    {heldPiece.shape.map((row, y) => (
                      <View key={y} style={{ flexDirection: "row" }}>
                        {row.map((cell, x) => (
                          <View
                            key={`${y}-${x}`}
                            style={{
                              width: 8,
                              height: 8,
                              backgroundColor: cell ? "#3498db" : "transparent",
                            }}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LINES</Text>
              <Text style={styles.statValue}>{lines}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTime(time)}</Text>
            </View>

            {/* Combo Box */}
            <View style={[styles.statBox, styles.comboBox]}>
              <Text style={styles.statLabel}>COMBO</Text>
              <Text style={[styles.statValue, styles.comboValue]}>
                {combo > 0 ? `x${combo}` : "-"}
              </Text>
              {combo > 0 && (
                <>
                  <Text style={styles.comboBonus}>
                    +{calculateComboBonus(combo)}
                  </Text>
                  <Text style={styles.comboTimer}>6s</Text>
                </>
              )}
            </View>

            {/* Menu Button - Triggers Unified Pause Menu */}
            <Pressable
              onPressIn={() => setMenuPressed(true)}
              onPressOut={() => setMenuPressed(false)}
              onPress={handleOpenPauseMenu}
            >
              <Image
                source={
                  menuPressed
                    ? require("@/assets/images/buttons/menu/Touched.png")
                    : require("@/assets/images/buttons/menu/Default.png")
                }
                style={styles.menuButton}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          {/* Game Board */}
          <View style={styles.boardWrapper}>
            <Board
              board={renderBoardWithPieceAndGhost(board, currentPiece)}
              cellSize={CELL_SIZE}
              boardWidth={BOARD_WIDTH}
              boardHeight={BOARD_HEIGHT}
            />

            {/* Artistic Line Elimination Animation */}
            <LineClearEffect
              clearingRows={clearingRows}
              cellSize={CELL_SIZE}
              boardWidth={BOARD_WIDTH}
              linesCount={linesToClearCount}
              comboCount={combo}
              onAnimationEnd={handleLineClearAnimationComplete}
            />

            {/* Motion blur trail effect during hard drop */}
            {isDropAnimating && currentPiece && (
              <Animated.View
                style={[
                  styles.motionTrailContainer,
                  {
                    opacity: trailOpacity,
                  },
                ]}
              >
                {/* Create more trail lines for denser effect */}
                {[...Array(Math.max(5, Math.ceil(dropEndY - dropStartY)))].map(
                  (_, index) => {
                    const totalLines = Math.max(
                      5,
                      Math.ceil(dropEndY - dropStartY)
                    );
                    const progress = index / totalLines;
                    const startY =
                      (dropStartY + progress * (dropEndY - dropStartY)) *
                      CELL_SIZE;
                    const endY = (dropEndY - (1 - progress) * 0.5) * CELL_SIZE;

                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.trailLine,
                          {
                            top: startY,
                            left: currentPiece.x * CELL_SIZE + 1,
                            width: currentPiece.shape[0].length * CELL_SIZE - 2,
                            height: 2 + progress * 2, // Varying thickness
                            opacity: trailOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 0.8 - progress * 0.6],
                            }),
                            transform: [
                              {
                                translateY: dropAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, endY - startY],
                                }),
                              },
                              {
                                scaleY: dropAnimation.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [
                                    0.5,
                                    2 + progress * 2,
                                    1.5 + progress,
                                  ],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    );
                  }
                )}

                {/* Main piece glow effect */}
                <Animated.View
                  style={[
                    styles.glowEffect,
                    {
                      top: dropStartY * CELL_SIZE,
                      left: currentPiece.x * CELL_SIZE,
                      width: currentPiece.shape[0].length * CELL_SIZE,
                      height: currentPiece.shape.length * CELL_SIZE,
                      opacity: trailOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.5],
                      }),
                      transform: [
                        {
                          translateY: dropAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                              0,
                              (dropEndY - dropStartY) * CELL_SIZE,
                            ],
                          }),
                        },
                        {
                          scale: dropAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.2, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            )}

            {gameOver && (
              <View style={styles.gameOverOverlay}>
                {isNewHighScore && (
                  <Text style={styles.newHighScoreText}>NEW HIGH SCORE!</Text>
                )}
                <Text style={styles.gameOverText}>GAME OVER</Text>
                <Text style={styles.finalScore}>Score: {score}</Text>
                <Text style={styles.finalTime}>Time: {formatTime(time)}</Text>
                <Pressable
                  onPressIn={() => setRestartPressed(true)}
                  onPressOut={() => setRestartPressed(false)}
                  onPress={handleRestart}
                >
                  <Image
                    source={
                      restartPressed
                        ? require("@/assets/images/buttons/restart/Touched.png")
                        : require("@/assets/images/buttons/restart/Default.png")
                    }
                    style={styles.restartButtonImage}
                    resizeMode="contain"
                  />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.gameOverMenuButton,
                    pressed && styles.gameOverMenuButtonPressed,
                  ]}
                  onPress={handleQuitToMenu}
                >
                  <Text style={styles.gameOverMenuButtonText}>MAIN MENU</Text>
                </Pressable>
              </View>
            )}

            {isPaused && !gameOver && (
              <View style={styles.pauseOverlay}>
                <Text style={styles.pauseText}>PAUSED</Text>
              </View>
            )}
          </View>

          {/* Right Panel - Next Piece */}
          <View style={styles.rightPanel}>
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>NEXT</Text>
              <View style={styles.nextPieceContainer}>
                {nextPiece && (
                  <View>
                    {nextPiece.shape.map((row, y) => (
                      <View key={y} style={{ flexDirection: "row" }}>
                        {row.map((cell, x) => (
                          <View
                            key={`${y}-${x}`}
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: cell ? "#3498db" : "transparent",
                            }}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Second next peice box */}
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>NEXT 2</Text>
              <View style={styles.nextPieceContainer}>
                {nextNextPiece && (
                  <View style={{ opacity: 0.7 }}>
                    {nextNextPiece.shape.map((row, y) => (
                      <View key={y} style={{ flexDirection: "row" }}>
                        {row.map((cell, x) => (
                          <View
                            key={`${y}-${x}`}
                            style={{
                              width: 8,
                              height: 8,
                              backgroundColor: cell ? "#3498db" : "transparent",
                            }}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Level Box */}
            <View style={styles.levelBox}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={styles.levelValue}>{level}</Text>
              <View style={styles.levelProgressContainer}>
                <View
                  style={[
                    styles.levelProgressBar,
                    {
                      width: `${((lines % 10) / 10) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.levelProgressText}>
                {lines % 10}/10 lines
              </Text>
            </View>

            {/* High Score Box */}
            {highScore > 0 && (
              <View style={styles.highScoreBox}>
                <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
                <Text style={styles.highScoreValue}>{highScore}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <Controls
          onRotate={handleRotate}
          onMoveLeft={handleMoveLeft}
          onMoveDown={handleMoveDown}
          onMoveRight={handleMoveRight}
          onHardDrop={handleHardDrop}
          onHold={handleHold}
          canHold={canHold}
          isPaused={isPaused}
          gameOver={gameOver}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3498db",
    letterSpacing: 4,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 8,
    marginBottom: 15,
  },
  leftPanel: {
    gap: 8,
  },
  holdBox: {
    backgroundColor: "#1a1a2e",
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#9b59b6",
    minWidth: 70,
    alignItems: "center",
  },
  holdLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    fontWeight: "600",
    marginBottom: 4,
  },
  holdPieceContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f1e",
    borderRadius: 4,
    marginBottom: 6,
  },
  holdButtonText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  statBox: {
    backgroundColor: "#1a1a2e",
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3498db",
    minWidth: 70,
    alignItems: "center",
  },
  comboBox: {
    borderColor: "#e67e22",
  },
  statLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "bold",
  },
  comboValue: {
    color: "#e67e22",
  },
  comboBonus: {
    fontSize: 12,
    color: "#f39c12",
    fontWeight: "600",
    marginTop: 2,
  },
  comboTimer: {
    fontSize: 9,
    color: "#95a5a6",
    marginTop: 2,
    fontStyle: "italic",
  },
  menuButton: {
    width: 70,
    height: 40,
  },
  boardWrapper: {
    position: "relative",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  newHighScoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f1c40f",
    marginBottom: 10,
    textShadowColor: "#f39c12",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 20,
    color: "#ffffff",
    marginBottom: 5,
  },
  finalTime: {
    fontSize: 18,
    color: "#95a5a6",
    marginBottom: 15,
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e67e22",
  },
  restartButtonImage: {
    width: 180,
    height: 50,
  },
  gameOverMenuButton: {
    marginTop: 12,
    backgroundColor: "rgba(26, 26, 46, 0.95)",
    borderWidth: 1.5,
    borderColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  gameOverMenuButtonPressed: {
    backgroundColor: "#3498db",
    opacity: 0.9,
  },
  gameOverMenuButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  rightPanel: {
    gap: 8,
  },
  nextBox: {
    backgroundColor: "#1a1a2e",
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3498db",
    minWidth: 70,
    alignItems: "center",
  },
  nextLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    fontWeight: "600",
    marginBottom: 4,
  },
  nextPieceContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f1e",
    borderRadius: 4,
  },
  motionTrailContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 10,
  },
  trailLine: {
    position: "absolute",
    backgroundColor: "#00FFFF",
    borderRadius: 1,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  glowEffect: {
    position: "absolute",
    backgroundColor: "rgba(0, 255, 255, 0.4)",
    borderRadius: 4,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  levelBox: {
    backgroundColor: "#1a1a2e",
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#27ae60",
    minWidth: 70,
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    fontWeight: "600",
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 24,
    color: "#27ae60",
    fontWeight: "bold",
    marginBottom: 6,
  },
  levelProgressContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#0f0f1e",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  levelProgressBar: {
    height: "100%",
    backgroundColor: "#27ae60",
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: 8,
    color: "#95a5a6",
    fontWeight: "600",
  },
  highScoreBox: {
    backgroundColor: "#1a1a2e",
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#f1c40f",
    minWidth: 70,
    alignItems: "center",
  },
  highScoreLabel: {
    fontSize: 9,
    color: "#f1c40f",
    fontWeight: "600",
    marginBottom: 4,
  },
  highScoreValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },
});

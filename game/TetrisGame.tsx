import DialogBox from "@/app/components/Dialog";
import useSound from "@/app/hooks/useSound";
import storeManager from "@/app/utils/storeManager";
import React, { useEffect, useRef, useState } from "react";
import {
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
  hardDrop,
  mergePiece,
  movePiece,
  Piece,
  renderBoardWithPiece,
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

  // Button States
  const [restartPressed, setRestartPressed] = useState<boolean>(false);
  const [menuPressed, setMenuPressed] = useState<boolean>(false);
  const [backDialogVisible, setBackDialogVisible] = useState<boolean>(false);
  const [holdPressed, setHoldPressed] = useState<boolean>(false);
  const [pausePressed, setPausePressed] = useState<boolean>(false);

  const [board, setBoard] = useState<BoardCell[][]>(createEmptyBoard());

  // Game Logic States
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
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

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Load high score on component mount
  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    const savedHighScore = await storeManager.getHighScore();
    setHighScore(savedHighScore);
  };

  // Check and update high score
  const checkAndUpdateHighScore = async () => {
    if (score > highScore) {
      await storeManager.updateGameStats(score, lines, level);
      setIsNewHighScore(true);
      setHighScore(score);
    } else {
      // Still update stats even if not a high score
      await storeManager.updateGameStats(score, lines, level);
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

  // Move piece down (for automatic drops only)
  const moveDown = () => {
    const piece = currentPieceRef.current;
    const currentBoard = boardRef.current;

    if (!piece || isPausedRef.current || gameOverRef.current) return;

    const movedPiece = movePiece(piece, currentBoard, "down");

    if (movedPiece) {
      setCurrentPiece(movedPiece);
    } else {
      // Merge and spawn new piece
      soundHook.playEffect("hard_drop");
      const mergedBoard = mergePiece(piece, currentBoard);
      const { newBoard, linesCleared } = clearLines(mergedBoard);

      setBoard(newBoard);

      if (linesCleared > 0) {
        // Increment combo
        const newCombo = Math.min(combo + 1, 7);
        setCombo(newCombo);

        // Calculate score with combo bonus
        const baseScore = calculateScore(linesCleared, level);
        const comboBonus = calculateComboBonus(newCombo);
        const totalScore = baseScore + comboBonus;

        setLines((prev) => prev + linesCleared);
        setScore((prev) => prev + totalScore);

        // Reset combo timer
        resetComboTimer();

        // Play combo sounds based on combo count
        if (newCombo === 1) soundHook.playCombo("combo1");
        else if (newCombo === 2) soundHook.playCombo("combo2");
        else if (newCombo === 3) soundHook.playCombo("combo3");
        else if (newCombo === 4) soundHook.playCombo("combo4");
        else if (newCombo === 5) soundHook.playCombo("combo5");
        else if (newCombo === 6) soundHook.playCombo("combo6");
        else if (newCombo === 7) soundHook.playCombo("combo7");
      } else {
        // Clear combo timer if no lines cleared
        if (comboTimerRef.current) {
          clearTimeout(comboTimerRef.current);
          comboTimerRef.current = null;
        }
        setCombo(0);
      }

      spawnNewPiece();
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
    setNextPiece(createPiece());
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

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }

    const firstPiece = createPiece();
    const second = createPiece();
    setCurrentPiece(firstPiece);
    setNextPiece(second);
    setRotation(0);
    lastDropTimeRef.current = Date.now();
  };

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const interval = Math.max(100, 1000 - (level - 1) * 100);

      gameLoopRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastDropTimeRef.current >= interval) {
          moveDown();
          lastDropTimeRef.current = now;
        }
      }, 50);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, level]);

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

  // Back to menu loop
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setBackDialogVisible(true);
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handlePauseToggle = () => {
    if (isPaused) {
      soundHook.resumeMusic();
    } else {
      soundHook.pauseMusic();
    }
    setIsPaused(!isPaused);
  };

  const handleBackToMenu = () => {
    setBackDialogVisible(false);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    onBackToMenu();
  };

  // Hold piece handler
  const handleHold = () => {
    if (!currentPiece || !canHold || isPaused || gameOver) return;

    soundHook.playEffect("swap");

    if (heldPiece) {
      const temp = {
        ...currentPiece,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
      };
      const swapped = {
        ...heldPiece,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
      };

      setHeldPiece(temp);
      setCurrentPiece(swapped);
      setRotation(0);
    } else {
      setHeldPiece({
        ...currentPiece,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
      });
      const piece = nextPiece || createPiece();
      setCurrentPiece(piece);
      setNextPiece(createPiece());
      setRotation(0);
    }

    setCanHold(false);
  };

  // Control handlers
  const handleRotate = () => {
    if (isPaused || gameOver) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const result = rotatePiece(prev, rotation, boardRef.current);
      if (result) {
        soundHook.playEffect("rotate");
        setRotation(result.rotation);
        return result.piece;
      }
      return prev;
    });
  };

  const handleMoveLeft = () => {
    if (isPaused || gameOver) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const movedPiece = movePiece(prev, boardRef.current, "left");
      if (movedPiece) {
        soundHook.playEffect("move");
        return movedPiece;
      }
      return prev;
    });
  };

  const handleMoveDown = () => {
    if (isPaused || gameOver) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const movedPiece = movePiece(prev, boardRef.current, "down");
      if (movedPiece) {
        soundHook.playEffect("move");
        return movedPiece;
      }
      return prev;
    });
  };

  const handleMoveRight = () => {
    if (isPaused || gameOver) return;

    setCurrentPiece((prev) => {
      if (!prev) return prev;
      const movedPiece = movePiece(prev, boardRef.current, "right");
      if (movedPiece) {
        soundHook.playEffect("move");
        return movedPiece;
      }
      return prev;
    });
  };

  const handleHardDrop = () => {
    if (!currentPiece || isPaused || gameOver) return;

    const droppedPiece = hardDrop(currentPiece, board);
    soundHook.playEffect("hard_drop");
    setCurrentPiece(droppedPiece);

    setTimeout(() => {
      const mergedBoard = mergePiece(droppedPiece, board);
      const { newBoard, linesCleared } = clearLines(mergedBoard);

      setBoard(newBoard);

      if (linesCleared > 0) {
        // Increment combo
        const newCombo = Math.min(combo + 1, 7);
        setCombo(newCombo);

        // Calculate score with combo bonus
        const baseScore = calculateScore(linesCleared, level);
        const comboBonus = calculateComboBonus(newCombo);
        const totalScore = baseScore + comboBonus;

        setLines((prev) => prev + linesCleared);
        setScore((prev) => prev + totalScore);

        // Reset combo timer
        resetComboTimer();

        // Play combo sounds
        if (newCombo === 1) soundHook.playCombo("combo1");
        else if (newCombo === 2) soundHook.playCombo("combo2");
        else if (newCombo === 3) soundHook.playCombo("combo3");
        else if (newCombo === 4) soundHook.playCombo("combo4");
        else if (newCombo === 5) soundHook.playCombo("combo5");
        else if (newCombo === 6) soundHook.playCombo("combo6");
        else if (newCombo === 7) soundHook.playCombo("combo7");
      } else {
        // Clear combo timer
        if (comboTimerRef.current) {
          clearTimeout(comboTimerRef.current);
          comboTimerRef.current = null;
        }
        setCombo(0);
      }

      spawnNewPiece();
    }, 50);
  };

  const handleRestart = () => {
    soundHook.playEffect("spawn");
    startGame();
  };

  return (
    <View style={styles.container}>
      <DialogBox
        visible={backDialogVisible}
        title="Return to Menu"
        message="Are you sure you want to go back to the menu? Your progress will be lost."
        type="confirm"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleBackToMenu}
        onCancel={() => setBackDialogVisible(false)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <Pressable
                onPressIn={() => setHoldPressed(true)}
                onPressOut={() => setHoldPressed(false)}
                onPress={handleHold}
                disabled={!canHold}
                style={[
                  styles.holdButton,
                  !canHold && styles.holdButtonDisabled,
                  holdPressed && styles.holdButtonPressed,
                ]}
              >
                <Text style={styles.holdButtonText}>
                  {canHold ? "HOLD" : "LOCKED"}
                </Text>
              </Pressable>
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

            {/* Menu Button */}
            <Pressable
              onPressIn={() => setMenuPressed(true)}
              onPressOut={() => setMenuPressed(false)}
              onPress={() => setBackDialogVisible(true)}
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
              board={renderBoardWithPiece(board, currentPiece)}
              cellSize={CELL_SIZE}
              boardWidth={BOARD_WIDTH}
              boardHeight={BOARD_HEIGHT}
            />

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

            <Pressable
              style={[
                styles.pauseButton,
                pausePressed && styles.pauseButtonPressed,
              ]}
              onPressIn={() => setPausePressed(true)}
              onPressOut={() => setPausePressed(false)}
              onPress={handlePauseToggle}
            >
              <Text style={styles.pauseButtonText}>{isPaused ? "▶" : "⏸"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Controls */}
        <Controls
          onRotate={handleRotate}
          onMoveLeft={handleMoveLeft}
          onMoveDown={handleMoveDown}
          onMoveRight={handleMoveRight}
          onHardDrop={handleHardDrop}
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
  holdButton: {
    backgroundColor: "#9b59b6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    minWidth: 60,
    alignItems: "center",
  },
  holdButtonDisabled: {
    backgroundColor: "#555",
    opacity: 0.5,
  },
  holdButtonPressed: {
    backgroundColor: "#8e44ad",
    transform: [{ scale: 0.95 }],
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
  pauseButton: {
    backgroundColor: "#e67e22",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  pauseButtonPressed: {
    backgroundColor: "#d35400",
    transform: [{ scale: 0.95 }],
  },
  pauseButtonText: {
    fontSize: 20,
    color: "#ffffff",
  },
});

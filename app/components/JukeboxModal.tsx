import {
  casualMusicService,
  CHILL_STATIONS,
  LOCAL_TRACKS,
  JukeboxStation,
  JukeboxState,
  YTMusicTrack,
} from "@/app/services/casualMusicService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface JukeboxModalProps {
  visible: boolean;
  onClose: () => void;
}

const HISTORY_KEY = "@tetris_music_search_history";

const POPULAR_GENRES = [
  { label: "☕ Lofi Beats", query: "lofi chill beats" },
  { label: "🌴 Synthwave", query: "80s synthwave retro" },
  { label: "🎹 Cafe Jazz", query: "cozy cafe piano jazz" },
  { label: "🎮 Tetris Remix", query: "tetris theme 8 bit remix" },
  { label: "🎧 Calm Ambient", query: "calm ambient space" },
  { label: "🌧️ Rainy Piano", query: "rainy day lofi piano" },
  { label: "⚡ Arcade Groove", query: "retro arcade game beat" },
];

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function JukeboxModal({ visible, onClose }: JukeboxModalProps) {
  const [state, setState] = useState<JukeboxState>(
    casualMusicService.getState()
  );
  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResults, setYtResults] = useState<YTMusicTrack[]>([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const unsub = casualMusicService.subscribe(setState);
    return () => unsub();
  }, []);

  // Load search history from storage
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        if (stored) {
          setSearchHistory(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      }
    };
    loadHistory();
  }, []);

  // Live autocomplete suggestions as user types
  useEffect(() => {
    const q = ytQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const list = await casualMusicService.getSearchSuggestions(q);
      setSuggestions(list);
    }, 280);

    return () => clearTimeout(timer);
  }, [ytQuery]);

  const saveHistoryItem = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;
    const updated = [
      clean,
      ...searchHistory.filter((h) => h.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 8);
    setSearchHistory(updated);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const removeHistoryItem = async (queryToRemove: string) => {
    const updated = searchHistory.filter((h) => h !== queryToRemove);
    setSearchHistory(updated);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearAllHistory = async () => {
    setSearchHistory([]);
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      // ignore
    }
  };

  const executeSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setYtQuery(q);
    setSuggestions([]);
    setYtLoading(true);
    setLastSearchedQuery(q);
    await saveHistoryItem(q);

    const tracks = await casualMusicService.searchYTMusic(q);
    setYtResults(tracks);
    setYtLoading(false);
  };

  const handlePlayNow = async (station: JukeboxStation) => {
    await casualMusicService.playNow(station);
  };

  const handleAddToQueue = async (station: JukeboxStation) => {
    await casualMusicService.addToQueue(station);
  };

  const handlePlayYTRapid = async (tr: YTMusicTrack) => {
    await casualMusicService.playYTMusicTrack(tr);
  };

  const handleQueueYT = async (tr: YTMusicTrack) => {
    const station: JukeboxStation = {
      id: `yt_${tr.id}`,
      name: tr.title,
      tag: tr.uploaderName || "YouTube",
      description: "YouTube Music Stream",
      category: "yt",
      streamUrl: tr.audioUrl,
      icon: "▶",
    };
    await casualMusicService.addToQueue(station);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>📻 CASUAL JUKEBOX</Text>
              <Text style={styles.subtitle}>
                One active player • Instant switch • Queue control
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Now Playing & Queue Controller Dock */}
            <View style={styles.dock}>
              <View style={styles.dockTopRow}>
                <View style={styles.dockInfo}>
                  <View style={styles.dockStatusBadgeRow}>
                    <Text style={styles.dockLabel}>NOW PLAYING</Text>
                    {state.isPlaying && (
                      <View style={styles.playingIndicator}>
                        <Text style={styles.playingIndicatorText}>● LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.dockTitle} numberOfLines={1}>
                    {state.isLoading
                      ? "Buffering audio..."
                      : state.activeTrackTitle}
                  </Text>
                  <Text style={styles.dockArtist} numberOfLines={1}>
                    {state.activeTrackArtist}
                  </Text>
                </View>

                {/* Player Transport Controls */}
                <View style={styles.transportRow}>
                  {/* Stop Button */}
                  <Pressable
                    style={styles.stopBtn}
                    onPress={() => casualMusicService.stop()}
                  >
                    <Text style={styles.stopBtnText}>⏹</Text>
                  </Pressable>

                  {/* Play / Pause Toggle */}
                  <Pressable
                    style={styles.dockPlayBtn}
                    onPress={() => casualMusicService.togglePlay()}
                  >
                    <Text style={styles.dockPlayBtnText}>
                      {state.isPlaying ? "⏸" : "▶"}
                    </Text>
                  </Pressable>

                  {/* Skip Next Button */}
                  {state.queue.length > 0 && (
                    <Pressable
                      style={styles.skipBtn}
                      onPress={() => casualMusicService.playNext()}
                    >
                      <Text style={styles.skipBtnText}>⏭</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Volume Slider */}
              <View style={styles.volumeRow}>
                <Text style={styles.volumeLabel}>🔈</Text>
                <Slider
                  style={styles.volumeSlider}
                  minimumValue={0}
                  maximumValue={1}
                  value={state.volume}
                  onValueChange={(val) => casualMusicService.setVolume(val)}
                  minimumTrackTintColor="#00ffff"
                  maximumTrackTintColor="#2c3066"
                  thumbTintColor="#ffffff"
                />
                <Text style={styles.volumeLabel}>🔊</Text>
                <Text style={styles.volumePercent}>
                  {Math.round(state.volume * 100)}%
                </Text>
              </View>
            </View>

            {/* Retain Music in Tetris Game Checkbox Option */}
            <Pressable
              style={[
                styles.retainCard,
                state.retainInGame && styles.retainCardActive,
              ]}
              onPress={() =>
                casualMusicService.setRetainInGame(!state.retainInGame)
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  state.retainInGame && styles.checkboxBoxActive,
                ]}
              >
                {state.retainInGame && (
                  <Text style={styles.checkboxCheckmark}>✓</Text>
                )}
              </View>

              <View style={styles.retainInfo}>
                <Text style={styles.retainTitle}>
                  Keep Music in Tetris Game
                </Text>
                <Text style={styles.retainDesc}>
                  {state.retainInGame
                    ? "Music continues playing during gameplay"
                    : "Switches to classic arcade theme in game"}
                </Text>
              </View>

              <View
                style={[
                  styles.retainBadge,
                  state.retainInGame && styles.retainBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.retainBadgeText,
                    state.retainInGame && styles.retainBadgeTextActive,
                  ]}
                >
                  {state.retainInGame ? "ENABLED" : "OFF"}
                </Text>
              </View>
            </Pressable>

            {/* Up Next Queue Section */}
            <View style={styles.queueSection}>
              <View style={styles.queueHeaderRow}>
                <Text style={styles.queueTitle}>
                  📜 UP NEXT IN QUEUE ({state.queue.length})
                </Text>
                {state.queue.length > 0 && (
                  <Pressable
                    style={styles.clearQueueBtn}
                    onPress={() => casualMusicService.clearQueue()}
                  >
                    <Text style={styles.clearQueueText}>Clear Queue</Text>
                  </Pressable>
                )}
              </View>

              {state.queue.length === 0 ? (
                <Text style={styles.emptyQueueText}>
                  Queue is empty. Tap "+ Queue" on any song to queue it next!
                </Text>
              ) : (
                <View style={styles.queueList}>
                  {state.queue.map((item, idx) => (
                    <View key={`${item.id}_${idx}`} style={styles.queueItem}>
                      <Text style={styles.queueIndex}>#{idx + 1}</Text>
                      <View style={styles.queueItemInfo}>
                        <Text style={styles.queueItemTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.queueItemTag} numberOfLines={1}>
                          {item.tag}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.removeQueueBtn}
                        onPress={() => casualMusicService.removeFromQueue(idx)}
                      >
                        <Text style={styles.removeQueueBtnText}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* YouTube Music Search & Discovery Section */}
            <View style={styles.ytSection}>
              <Pressable
                style={styles.ytHeader}
                onPress={() => setYtOpen(!ytOpen)}
              >
                <View style={styles.ytHeaderLeft}>
                  <Text style={styles.ytHeaderIcon}>🔍</Text>
                  <Text style={styles.ytHeaderText}>
                    Search on YouTube Music
                  </Text>
                </View>
                <Text style={styles.ytHeaderChevron}>{ytOpen ? "▲" : "▼"}</Text>
              </Pressable>

              {ytOpen && (
                <View style={styles.ytContent}>
                  {/* Search Input Box */}
                  <View style={styles.ytSearchRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputSearchIcon}>🔍</Text>
                      <TextInput
                        style={styles.ytInput}
                        placeholder="Search songs, artists, lofi..."
                        placeholderTextColor="#7f8c8d"
                        value={ytQuery}
                        onChangeText={setYtQuery}
                        autoCapitalize="none"
                        onSubmitEditing={() => executeSearch(ytQuery)}
                      />
                      {ytQuery.length > 0 && (
                        <Pressable
                          style={styles.clearInputBtn}
                          onPress={() => {
                            setYtQuery("");
                            setSuggestions([]);
                          }}
                        >
                          <Text style={styles.clearInputText}>✕</Text>
                        </Pressable>
                      )}
                    </View>

                    <Pressable
                      style={styles.ytSearchBtn}
                      onPress={() => executeSearch(ytQuery)}
                    >
                      <Text style={styles.ytSearchBtnText}>Search</Text>
                    </Pressable>
                  </View>

                  {/* Autocomplete Suggestions Menu */}
                  {suggestions.length > 0 && (
                    <View style={styles.suggestionsMenu}>
                      <Text style={styles.suggestionsHeader}>
                        💡 SUGGESTED SEARCHES
                      </Text>
                      {suggestions.map((sug, i) => (
                        <Pressable
                          key={`sug_${i}`}
                          style={styles.suggestionRow}
                          onPress={() => executeSearch(sug)}
                        >
                          <Text style={styles.suggestionIcon}>🔍</Text>
                          <Text style={styles.suggestionText} numberOfLines={1}>
                            {sug}
                          </Text>
                          <Text style={styles.suggestionFill}>↗</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Search History Chips Menu */}
                  {searchHistory.length > 0 && suggestions.length === 0 && (
                    <View style={styles.historySection}>
                      <View style={styles.historyHeaderRow}>
                        <Text style={styles.historyTitle}>
                          🕒 RECENT SEARCHES
                        </Text>
                        <Pressable onPress={clearAllHistory}>
                          <Text style={styles.clearHistoryText}>Clear All</Text>
                        </Pressable>
                      </View>
                      <View style={styles.historyChipsWrap}>
                        {searchHistory.map((item, i) => (
                          <View key={`hist_${i}`} style={styles.historyChip}>
                            <Pressable
                              style={styles.historyChipTouch}
                              onPress={() => executeSearch(item)}
                            >
                              <Text style={styles.historyClock}>🕒</Text>
                              <Text
                                style={styles.historyChipText}
                                numberOfLines={1}
                              >
                                {item}
                              </Text>
                            </Pressable>
                            <Pressable
                              style={styles.historyRemoveBtn}
                              onPress={() => removeHistoryItem(item)}
                            >
                              <Text style={styles.historyRemoveText}>✕</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Popular Genres & Recommended Searches Menu */}
                  {suggestions.length === 0 && (
                    <View style={styles.genresSection}>
                      <Text style={styles.genresTitle}>
                        ✨ POPULAR GENRES & SEARCHES
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.genresScrollContent}
                      >
                        {POPULAR_GENRES.map((g, i) => (
                          <Pressable
                            key={`gen_${i}`}
                            style={styles.genreChip}
                            onPress={() => executeSearch(g.query)}
                          >
                            <Text style={styles.genreChipText}>{g.label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Loading Spinner */}
                  {ytLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#00ffff" />
                      <Text style={styles.loadingText}>
                        Searching tracks...
                      </Text>
                    </View>
                  )}

                  {/* Search Results Menu */}
                  {!ytLoading && ytResults.length > 0 && (
                    <View style={styles.resultsMenuContainer}>
                      <View style={styles.resultsHeaderRow}>
                        <Text style={styles.resultsTitle}>
                          🎶 RESULTS FOR "{lastSearchedQuery}" (
                          {ytResults.length})
                        </Text>
                      </View>

                      <View style={styles.ytResultsContainer}>
                        {ytResults.map((tr) => (
                          <View key={tr.id} style={styles.ytResultCard}>
                            <View style={styles.ytIconBadge}>
                              <Text style={styles.ytIconBadgeText}>🎵</Text>
                            </View>

                            <View style={styles.ytResultText}>
                              <Text style={styles.ytTitle} numberOfLines={1}>
                                {tr.title}
                              </Text>
                              <View style={styles.ytSubRow}>
                                <Text
                                  style={styles.ytArtist}
                                  numberOfLines={1}
                                >
                                  {tr.uploaderName}
                                </Text>
                                {tr.duration ? (
                                  <Text style={styles.ytDuration}>
                                    • {formatDuration(tr.duration)}
                                  </Text>
                                ) : null}
                              </View>
                            </View>

                            <View style={styles.cardActions}>
                              <Pressable
                                style={styles.playNowBtn}
                                onPress={() => handlePlayYTRapid(tr)}
                              >
                                <Text style={styles.playNowBtnText}>
                                  ▶ PLAY
                                </Text>
                              </Pressable>

                              <Pressable
                                style={styles.addToQueueBtn}
                                onPress={() => handleQueueYT(tr)}
                              >
                                <Text style={styles.addToQueueBtnText}>
                                  + QUEUE
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* No Results Message */}
                  {!ytLoading &&
                    lastSearchedQuery.length > 0 &&
                    ytResults.length === 0 && (
                      <Text style={styles.noResultsText}>
                        No tracks found for "{lastSearchedQuery}". Try another
                        term or tap a popular genre above!
                      </Text>
                    )}
                </View>
              )}
            </View>

            {/* Local Music Files Section */}
            <Text style={styles.sectionHeader}>
              📁 LOCAL MUSIC (assets/music)
            </Text>
            <View style={styles.stationsList}>
              {LOCAL_TRACKS.map((station) => {
                const isActive = state.currentStationId === station.id;
                return (
                  <View
                    key={station.id}
                    style={[
                      styles.stationCard,
                      styles.localCard,
                      isActive && styles.stationCardActive,
                    ]}
                  >
                    <View style={styles.stationLeft}>
                      <View
                        style={[
                          styles.stationIconBox,
                          styles.localIconBox,
                          isActive && styles.stationIconBoxActive,
                        ]}
                      >
                        <Text style={styles.stationIconText}>
                          {station.icon}
                        </Text>
                      </View>
                      <View style={styles.stationInfo}>
                        <View style={styles.stationTitleRow}>
                          <Text
                            style={[
                              styles.stationName,
                              isActive && styles.stationNameActive,
                            ]}
                          >
                            {station.name}
                          </Text>
                          <Text style={[styles.stationTag, styles.localTag]}>
                            {station.tag}
                          </Text>
                        </View>
                        <Text style={styles.stationDesc}>
                          {station.description}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons: Play Now & Add to Queue */}
                    <View style={styles.cardActions}>
                      <Pressable
                        style={[
                          styles.playNowBtn,
                          isActive && styles.playNowBtnActive,
                        ]}
                        onPress={() => handlePlayNow(station)}
                      >
                        <Text style={styles.playNowBtnText}>
                          {isActive && state.isPlaying ? "PLAYING" : "▶ PLAY"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.addToQueueBtn}
                        onPress={() => handleAddToQueue(station)}
                      >
                        <Text style={styles.addToQueueBtnText}>+ QUEUE</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Chill Stations List */}
            <Text style={styles.sectionHeader}>
              🌐 CHILL RADIO STATIONS (Online Streams)
            </Text>
            <View style={styles.stationsList}>
              {CHILL_STATIONS.map((station) => {
                const isActive = state.currentStationId === station.id;
                return (
                  <View
                    key={station.id}
                    style={[
                      styles.stationCard,
                      isActive && styles.stationCardActive,
                    ]}
                  >
                    <View style={styles.stationLeft}>
                      <View
                        style={[
                          styles.stationIconBox,
                          isActive && styles.stationIconBoxActive,
                        ]}
                      >
                        <Text style={styles.stationIconText}>
                          {station.icon}
                        </Text>
                      </View>
                      <View style={styles.stationInfo}>
                        <View style={styles.stationTitleRow}>
                          <Text
                            style={[
                              styles.stationName,
                              isActive && styles.stationNameActive,
                            ]}
                          >
                            {station.name}
                          </Text>
                          <Text style={styles.stationTag}>{station.tag}</Text>
                        </View>
                        <Text style={styles.stationDesc}>
                          {station.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable
                        style={[
                          styles.playNowBtn,
                          isActive && styles.playNowBtnActive,
                        ]}
                        onPress={() => handlePlayNow(station)}
                      >
                        <Text style={styles.playNowBtnText}>
                          {isActive && state.isPlaying ? "PLAYING" : "▶ PLAY"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.addToQueueBtn}
                        onPress={() => handleAddToQueue(station)}
                      >
                        <Text style={styles.addToQueueBtnText}>+ QUEUE</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Done Button */}
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>DONE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "92%",
    backgroundColor: "#101227",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3498db",
    padding: 18,
    shadowColor: "#00ffff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1d224d",
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 10,
    color: "#8892b0",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1c1f44",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 10,
  },
  dock: {
    backgroundColor: "#0d0e22",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#202452",
    marginBottom: 14,
  },
  dockTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dockInfo: {
    flex: 1,
    marginRight: 8,
  },
  dockStatusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  dockLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#00e676",
    letterSpacing: 1,
  },
  playingIndicator: {
    backgroundColor: "rgba(0, 230, 118, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playingIndicatorText: {
    color: "#00e676",
    fontSize: 8,
    fontWeight: "900",
  },
  dockTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  dockArtist: {
    fontSize: 10,
    color: "#7f8c8d",
    marginTop: 1,
  },
  transportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dockPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  dockPlayBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  stopBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2c2e55",
    justifyContent: "center",
    alignItems: "center",
  },
  stopBtnText: {
    color: "#e74c3c",
    fontSize: 12,
  },
  skipBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#24335c",
    justifyContent: "center",
    alignItems: "center",
  },
  skipBtnText: {
    color: "#00ffff",
    fontSize: 12,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a1d42",
    paddingTop: 8,
  },
  volumeLabel: {
    fontSize: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 28,
  },
  volumePercent: {
    color: "#8892b0",
    fontSize: 10,
    fontWeight: "700",
    width: 32,
    textAlign: "right",
  },
  retainCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131531",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#222655",
    marginBottom: 14,
  },
  retainCardActive: {
    borderColor: "#00e676",
    backgroundColor: "rgba(0, 230, 118, 0.07)",
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#555b94",
    backgroundColor: "#0d0e22",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxBoxActive: {
    borderColor: "#00e676",
    backgroundColor: "#00e676",
  },
  checkboxCheckmark: {
    color: "#0a1910",
    fontSize: 13,
    fontWeight: "900",
  },
  retainInfo: {
    flex: 1,
  },
  retainTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  retainDesc: {
    fontSize: 9,
    color: "#8892b0",
    marginTop: 1,
  },
  retainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#1f2347",
    marginLeft: 6,
  },
  retainBadgeActive: {
    backgroundColor: "rgba(0, 230, 118, 0.2)",
  },
  retainBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#7f8c8d",
  },
  retainBadgeTextActive: {
    color: "#00e676",
  },
  queueSection: {
    backgroundColor: "#131531",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#222655",
    marginBottom: 14,
  },
  queueHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  queueTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#00ffff",
    letterSpacing: 0.5,
  },
  clearQueueBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    borderRadius: 4,
  },
  clearQueueText: {
    fontSize: 9,
    color: "#e74c3c",
    fontWeight: "800",
  },
  emptyQueueText: {
    fontSize: 10,
    color: "#6c7a9c",
    fontStyle: "italic",
    paddingVertical: 4,
  },
  queueList: {
    gap: 5,
    marginTop: 4,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0e22",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1a1d42",
  },
  queueIndex: {
    fontSize: 10,
    color: "#00ffff",
    fontWeight: "800",
    width: 22,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "700",
  },
  queueItemTag: {
    fontSize: 9,
    color: "#7f8c8d",
  },
  removeQueueBtn: {
    padding: 4,
  },
  removeQueueBtnText: {
    color: "#e74c3c",
    fontSize: 12,
    fontWeight: "bold",
  },
  ytSection: {
    backgroundColor: "#131530",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232657",
    marginBottom: 14,
    overflow: "hidden",
  },
  ytHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  ytHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ytHeaderIcon: {
    fontSize: 13,
  },
  ytHeaderText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  ytHeaderChevron: {
    color: "#7f8c8d",
    fontSize: 9,
  },
  ytContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#1d214a",
  },
  ytSearchRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0e22",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#202452",
    paddingHorizontal: 8,
  },
  inputSearchIcon: {
    fontSize: 11,
    marginRight: 6,
  },
  ytInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 11,
    paddingVertical: 6,
  },
  clearInputBtn: {
    padding: 4,
  },
  clearInputText: {
    color: "#7f8c8d",
    fontSize: 11,
  },
  ytSearchBtn: {
    backgroundColor: "#00e676",
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  ytSearchBtnText: {
    color: "#0a1910",
    fontWeight: "800",
    fontSize: 11,
  },
  suggestionsMenu: {
    backgroundColor: "#0a0b1c",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#23285c",
    marginTop: 6,
    paddingVertical: 4,
  },
  suggestionsHeader: {
    fontSize: 8,
    fontWeight: "800",
    color: "#00ffff",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderTopWidth: 0.5,
    borderTopColor: "#16193b",
  },
  suggestionIcon: {
    fontSize: 10,
    marginRight: 6,
    color: "#7f8c8d",
  },
  suggestionText: {
    flex: 1,
    color: "#e0e6ed",
    fontSize: 11,
  },
  suggestionFill: {
    color: "#00ffff",
    fontSize: 11,
    fontWeight: "800",
  },
  historySection: {
    marginTop: 8,
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8892b0",
    letterSpacing: 0.5,
  },
  clearHistoryText: {
    fontSize: 9,
    color: "#e74c3c",
    fontWeight: "700",
  },
  historyChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0e22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202452",
    paddingLeft: 7,
    paddingRight: 3,
    paddingVertical: 2,
  },
  historyChipTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyClock: {
    fontSize: 8,
    marginRight: 4,
  },
  historyChipText: {
    fontSize: 10,
    color: "#cbd5e1",
    maxWidth: 110,
  },
  historyRemoveBtn: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  historyRemoveText: {
    fontSize: 9,
    color: "#7f8c8d",
    fontWeight: "bold",
  },
  genresSection: {
    marginTop: 8,
  },
  genresTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#f39c12",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  genresScrollContent: {
    gap: 6,
    paddingVertical: 2,
  },
  genreChip: {
    backgroundColor: "#1a1d42",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#2d3370",
  },
  genreChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  loadingText: {
    fontSize: 10,
    color: "#8892b0",
  },
  resultsMenuContainer: {
    marginTop: 10,
  },
  resultsHeaderRow: {
    marginBottom: 6,
  },
  resultsTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#00e676",
    letterSpacing: 0.5,
  },
  ytResultsContainer: {
    gap: 5,
    maxHeight: 180,
  },
  ytResultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0d0e22",
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1d214a",
  },
  ytIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#161a38",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ytIconBadgeText: {
    fontSize: 12,
  },
  ytResultText: {
    flex: 1,
    marginRight: 6,
  },
  ytTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  ytSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  ytArtist: {
    color: "#7f8c8d",
    fontSize: 9,
  },
  ytDuration: {
    color: "#00ffff",
    fontSize: 9,
    fontWeight: "700",
  },
  noResultsText: {
    fontSize: 10,
    color: "#7f8c8d",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f39c12",
    letterSpacing: 1,
    marginBottom: 8,
  },
  stationsList: {
    gap: 8,
    marginBottom: 14,
  },
  stationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#161836",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#232657",
  },
  stationCardActive: {
    borderColor: "#00ffff",
    backgroundColor: "#1a214d",
  },
  localCard: {
    borderColor: "#2980b9",
  },
  stationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  stationIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#101229",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2a2d60",
  },
  stationIconBoxActive: {
    borderColor: "#00ffff",
    backgroundColor: "#1c2e63",
  },
  localIconBox: {
    backgroundColor: "#162447",
    borderColor: "#2980b9",
  },
  stationIconText: {
    fontSize: 16,
  },
  stationInfo: {
    flex: 1,
  },
  stationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stationName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ecf0f1",
  },
  stationNameActive: {
    color: "#00ffff",
  },
  stationTag: {
    fontSize: 8,
    fontWeight: "800",
    color: "#95a5a6",
    backgroundColor: "#0d0e22",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  localTag: {
    color: "#3498db",
    borderColor: "rgba(52, 152, 219, 0.4)",
    borderWidth: 1,
  },
  stationDesc: {
    fontSize: 10,
    color: "#7f8c8d",
    marginTop: 1,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  playNowBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playNowBtnActive: {
    backgroundColor: "#2ecc71",
  },
  playNowBtnText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  addToQueueBtn: {
    backgroundColor: "#22254e",
    borderWidth: 1,
    borderColor: "#373c7a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addToQueueBtnText: {
    color: "#00ffff",
    fontSize: 9,
    fontWeight: "800",
  },
  doneBtn: {
    backgroundColor: "#00e676",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  doneBtnText: {
    color: "#0a1910",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});

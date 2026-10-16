import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { casualMusicService } from "@/app/services/casualMusicService";

const YOUTUBE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
    #player { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player = null;
    var isReady = false;
    var pendingVideoId = null;

    function post(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError
        }
      });
    }

    function onPlayerReady(event) {
      isReady = true;
      post({ type: 'ready' });
      if (pendingVideoId) {
        player.loadVideoById(pendingVideoId);
        pendingVideoId = null;
      }
    }

    function onPlayerStateChange(event) {
      // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      var t = 'unknown';
      if (event.data === 1) t = 'playing';
      else if (event.data === 2) t = 'paused';
      else if (event.data === 3) t = 'buffering';
      else if (event.data === 0) t = 'ended';

      if (t !== 'unknown') {
        post({ type: t });
      }
    }

    function onPlayerError(event) {
      post({ type: 'error', code: event.data });
    }

    window.handleCommand = function(cmd, arg) {
      try {
        if (!player || !isReady) {
          if (cmd === 'load') pendingVideoId = arg;
          return;
        }
        if (cmd === 'load') {
          player.loadVideoById(arg);
        } else if (cmd === 'play') {
          player.playVideo();
        } else if (cmd === 'pause') {
          player.pauseVideo();
        } else if (cmd === 'stop') {
          player.stopVideo();
        } else if (cmd === 'volume') {
          player.setVolume(Number(arg));
        }
      } catch (e) {
        post({ type: 'error', error: e.message });
      }
    };
  </script>
</body>
</html>`;

export default function BackgroundYouTubePlayer() {
  const webViewRef = useRef<WebView>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const lastPlayingStateRef = useRef<boolean>(false);
  const lastVolumeRef = useRef<number>(1);

  useEffect(() => {
    const unsub = casualMusicService.subscribe((state) => {
      const vid = state.activeYouTubeVideoId;

      // Handle video load / change
      if (vid !== currentVideoIdRef.current) {
        currentVideoIdRef.current = vid;
        setActiveVideoId(vid);
        if (vid) {
          webViewRef.current?.injectJavaScript(
            `window.handleCommand && window.handleCommand('load', '${vid}'); true;`
          );
        } else {
          webViewRef.current?.injectJavaScript(
            `window.handleCommand && window.handleCommand('stop'); true;`
          );
        }
      }

      // Handle play/pause
      if (vid && state.isPlaying !== lastPlayingStateRef.current) {
        lastPlayingStateRef.current = state.isPlaying;
        if (state.isPlaying) {
          webViewRef.current?.injectJavaScript(
            `window.handleCommand && window.handleCommand('play'); true;`
          );
        } else {
          webViewRef.current?.injectJavaScript(
            `window.handleCommand && window.handleCommand('pause'); true;`
          );
        }
      }

      // Handle volume
      if (vid && Math.abs(state.volume - lastVolumeRef.current) > 0.02) {
        lastVolumeRef.current = state.volume;
        const volPercent = Math.round(state.volume * 100);
        webViewRef.current?.injectJavaScript(
          `window.handleCommand && window.handleCommand('volume', ${volPercent}); true;`
        );
      }
    });

    return () => unsub();
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (
        data.type === "playing" ||
        data.type === "paused" ||
        data.type === "buffering" ||
        data.type === "ended" ||
        data.type === "error"
      ) {
        casualMusicService.notifyYouTubeState(data.type);
      }
    } catch (e) {
      // ignore
    }
  };

  const WebViewComponent = WebView as any;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebViewComponent
        ref={webViewRef}
        source={{ html: YOUTUBE_HTML }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        style={styles.webView}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: "absolute",
    width: 2,
    height: 2,
    top: -500,
    left: -500,
    opacity: 0.01,
    overflow: "hidden",
  },
  webView: {
    width: 2,
    height: 2,
  },
});

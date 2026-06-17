import { WebView } from "react-native-webview";
import { apiBase } from "@/api/client";

/**
 * Affiche le modèle 3D de l'infirmier (GLB hébergé) via <model-viewer> dans une WebView.
 * Auto-rotation + lecture de l'animation intégrée. 100% compatible Expo.
 */
export function Model3D({ height = 300, autoRotate = true }: { height?: number; autoRotate?: boolean }) {
  const url = `${apiBase}/models/nurse.glb`;
  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html,body{margin:0;height:100%;background:transparent;overflow:hidden}
  model-viewer{width:100%;height:100%;--poster-color:transparent;--progress-bar-color:#2fe0a6}
</style>
<script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
</head><body>
<model-viewer
  src="${url}"
  autoplay
  animation-name="*"
  ${autoRotate ? "auto-rotate auto-rotate-delay='0' rotation-per-second='28deg'" : ""}
  camera-controls
  touch-action="pan-y"
  disable-zoom
  interaction-prompt="none"
  shadow-intensity="1.2"
  shadow-softness="1"
  exposure="1.15"
  camera-orbit="0deg 82deg 2.4m"
  field-of-view="32deg"
  reveal="auto">
</model-viewer>
</body></html>`;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={{ backgroundColor: "transparent", height }}
      androidLayerType="hardware"
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
    />
  );
}

import { useEffect, useRef, useState } from "react";
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CHARACTER_ANIMATION_PRESETS,
  CharacterAnimationPreset,
  getCharacterAnimationFrame,
  getCharacterAnimationLabel,
} from "@/lib/characterAnimationPresets";
import {
  CHARACTER_VIEWER_ENVIRONMENTS,
  CharacterViewerEnvironment,
  getCharacterViewerEnvironmentConfig,
} from "@/lib/characterViewerEnvironments";
import {
  CHARACTER_ACCESSORIES,
  CHARACTER_OUTFITS,
  CharacterAccessoryId,
  CharacterOutfitId,
  getCharacterAccessoryPreset,
  getCharacterOutfitPreset,
  resolveCharacterOutfitPresetId,
} from "@/lib/characterAppearancePresets";
import {
  CHARACTER_EXPRESSIONS,
  CharacterExpressionType,
  getExpressionConfig,
  getCharacterExpressionLabel,
} from "@/lib/characterExpressionSystem";
import {
  CHARACTER_POSTER_STICKERS,
  CharacterPosterStickerPlacement,
  createCharacterPosterStickerPlacement,
  getCharacterPosterSticker,
  normalizeCharacterPosterStickerPlacement,
} from "@/lib/characterPosterStickers";
import { CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH, normalizeCharacterPosterCustomText } from "@/lib/characterPosterCustomText";
import { AssetCache } from "@/lib/assetCacheUtils";
import { AlertCircle, Box, Camera, Download, Pause, Play, RefreshCw, RotateCw, Send, Share2, ShieldCheck, Smile, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import {
  downloadDataUrl,
  generateCharacterSnapshotPosterDataUrlAsync,
  getCharacterSnapshotPosterFileName,
  getCharacterSnapshotShareUrl,
} from "@/lib/profilePoster";

interface CharacterModelViewerProps {
  playerName?: string;
  userId?: string;
  characterGender?: "male" | "female";
  equippedOutfit?: string;
  /** Optional GLB/GLTF URL. When omitted, the viewer uses the approved procedural preview rig. */
  modelUrl?: string;
}

type AnimationNodes = {
  body?: TransformNode;
  head?: TransformNode;
  arm?: TransformNode;
  outfit?: TransformNode;
  accessory?: TransformNode;
  leftEye?: TransformNode;
  rightEye?: TransformNode;
  mouth?: TransformNode;
  brow?: TransformNode;
};

type EnvironmentRefs = {
  scene: Scene;
  hemisphericLight: HemisphericLight;
  directionalLight: DirectionalLight;
  groundMaterial: StandardMaterial;
};

const characterModelBinaryCache = new AssetCache<ArrayBuffer>(10 * 60 * 1000);

function splitModelUrl(modelUrl: string): { rootUrl: string; fileName: string } {
  const absoluteUrl = new URL(modelUrl, window.location.origin).toString();
  const slashIndex = absoluteUrl.lastIndexOf("/");
  return {
    rootUrl: absoluteUrl.slice(0, slashIndex + 1),
    fileName: absoluteUrl.slice(slashIndex + 1),
  };
}

function applyCharacterAppearance(nodes: AnimationNodes, outfitId: CharacterOutfitId, accessoryId: CharacterAccessoryId) {
  const outfit = getCharacterOutfitPreset(outfitId);
  const accessory = getCharacterAccessoryPreset(accessoryId);
  if (nodes.outfit instanceof AbstractMesh && nodes.outfit.material instanceof StandardMaterial) {
    nodes.outfit.material.diffuseColor = new Color3(...outfit.color);
    nodes.outfit.scaling.x = outfit.silhouetteScaleX;
  }
  if (nodes.accessory instanceof AbstractMesh && nodes.accessory.material instanceof StandardMaterial) {
    nodes.accessory.material.diffuseColor = new Color3(...accessory.color);
  }
  if (nodes.accessory) {
    nodes.accessory.isVisible = accessory.id !== "none";
    nodes.accessory.position = accessory.id === "backpack"
      ? new Vector3(-0.62, 0.22, -0.18)
      : accessory.id === "sunglasses"
        ? new Vector3(0, 1.42, 0.46)
        : new Vector3(0, 0.72, 0.28);
    nodes.accessory.scaling = accessory.id === "sunglasses"
      ? new Vector3(0.75, 0.35, 0.35)
      : accessory.id === "backpack"
        ? new Vector3(1.3, 1.5, 0.8)
        : new Vector3(1.2, 0.45, 1.1);
  }
}

function applyEnvironmentPreset(refs: EnvironmentRefs, environment: CharacterViewerEnvironment) {
  const config = getCharacterViewerEnvironmentConfig(environment);
  refs.scene.clearColor = new Color4(...config.skyColor);
  refs.scene.fogMode = Scene.FOGMODE_EXP2;
  refs.scene.fogColor = new Color3(...config.fogColor);
  refs.scene.fogDensity = config.fogDensity;
  refs.hemisphericLight.diffuse = new Color3(...config.hemiDiffuse);
  refs.hemisphericLight.groundColor = new Color3(...config.hemiGround);
  refs.directionalLight.diffuse = new Color3(...config.directionalDiffuse);
  refs.directionalLight.intensity = config.directionalIntensity;
  refs.groundMaterial.diffuseColor = new Color3(...config.groundColor);
  refs.groundMaterial.specularColor = config.groundMaterial === "wood"
    ? new Color3(0.35, 0.22, 0.12)
    : config.groundMaterial === "asphalt"
      ? new Color3(0.12, 0.15, 0.22)
      : new Color3(0.8, 0.86, 0.92);
}

export default function CharacterModelViewer({
  playerName = "冰雪冒险者",
  userId = "player",
  characterGender = "female",
  equippedOutfit = "冬日潮流风衣",
  modelUrl,
}: CharacterModelViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const animationNodesRef = useRef<AnimationNodes>({});
  const environmentRefs = useRef<EnvironmentRefs | null>(null);
  const animationPresetRef = useRef<CharacterAnimationPreset>("idle");
  const animationPlayingRef = useRef(true);
  const elapsedRef = useRef(0);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);
  const [animationPreset, setAnimationPreset] = useState<CharacterAnimationPreset>("idle");
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);
  const [environment, setEnvironment] = useState<CharacterViewerEnvironment>("snow");
  const [expression, setExpression] = useState<CharacterExpressionType>("smile");
  const [outfitId, setOutfitId] = useState<CharacterOutfitId>(() => resolveCharacterOutfitPresetId(equippedOutfit));
  const [accessoryId, setAccessoryId] = useState<CharacterAccessoryId>("knit-scarf");
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [snapshotPoster, setSnapshotPoster] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [stickerPlacements, setStickerPlacements] = useState<CharacterPosterStickerPlacement[]>([]);
  const [customPosterText, setCustomPosterText] = useState("");

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    animationPresetRef.current = animationPreset;
  }, [animationPreset]);

  useEffect(() => {
    animationPlayingRef.current = isAnimationPlaying;
  }, [isAnimationPlaying]);

  useEffect(() => {
    applyCharacterAppearance(animationNodesRef.current, outfitId, accessoryId);
  }, [outfitId, accessoryId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: Engine | null = null;
    let scene: Scene | null = null;
    let disposed = false;
    const loadAbortController = new AbortController();
    setLoadStatus("loading");

    const createProceduralPreview = (targetScene: Scene): AnimationNodes => {
      const body = MeshBuilder.CreateCylinder(
        "body",
        { height: 1.8, diameterTop: 0.7, diameterBottom: 0.8 },
        targetScene,
      );
      const bodyMat = new StandardMaterial("bodyMat", targetScene);
      bodyMat.diffuseColor = characterGender === "female"
        ? new Color3(0.95, 0.82, 0.78)
        : new Color3(0.85, 0.88, 0.92);
      bodyMat.specularColor = new Color3(0.3, 0.3, 0.3);
      body.material = bodyMat;

      const head = MeshBuilder.CreateSphere("head", { diameter: 0.9 }, targetScene);
      head.position.y = 1.3;
      const headMat = new StandardMaterial("headMat", targetScene);
      headMat.diffuseColor = new Color3(0.96, 0.87, 0.81);
      head.material = headMat;

      const outfit = MeshBuilder.CreateBox(
        "outfitJacket",
        { width: 1.1, height: 1.2, depth: 0.6 },
        targetScene,
      );
      outfit.position.y = 0.1;
      const jacketMat = new StandardMaterial("jacketMat", targetScene);
      jacketMat.diffuseColor = equippedOutfit.includes("风衣")
        ? new Color3(0.12, 0.25, 0.45)
        : new Color3(0.85, 0.22, 0.28);
      jacketMat.specularColor = new Color3(0.5, 0.5, 0.5);
      outfit.material = jacketMat;

      const accessory = MeshBuilder.CreateBox(
        "characterAccessory",
        { width: 0.48, height: 0.16, depth: 0.18 },
        targetScene,
      );
      const accessoryMat = new StandardMaterial("accessoryMat", targetScene);
      accessoryMat.diffuseColor = new Color3(0.85, 0.36, 0.16);
      accessory.material = accessoryMat;

      const arm = MeshBuilder.CreateBox(
        "waveArm",
        { width: 0.22, height: 0.9, depth: 0.22 },
        targetScene,
      );
      arm.position = new Vector3(0.68, 0.65, 0);
      arm.rotation.z = -0.12;
      const armMat = new StandardMaterial("armMat", targetScene);
      armMat.diffuseColor = bodyMat.diffuseColor;
      arm.material = armMat;

      return { body, head, arm, outfit, accessory };
    };

    const initialize = async () => {
      try {
        engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        engineRef.current = engine;
        scene = new Scene(engine);
        scene.clearColor = new Color4(0.06, 0.08, 0.12, 1);
        sceneRef.current = scene;

        const camera = new ArcRotateCamera(
          "characterCamera",
          Math.PI / 2,
          Math.PI / 2.3,
          6,
          new Vector3(0, 0.7, 0),
          scene,
        );
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 3.5;
        camera.upperRadiusLimit = 9;
        camera.wheelPrecision = 50;
        cameraRef.current = camera;

        const hemisphericLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
        hemisphericLight.diffuse = new Color3(0.29, 0.56, 0.89);
        hemisphericLight.groundColor = new Color3(0.1, 0.1, 0.15);
        const directionalLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
        directionalLight.diffuse = new Color3(0.91, 0.95, 0.97);
        directionalLight.intensity = 1.2;
        const ground = MeshBuilder.CreateGround("environmentGround", { width: 12, height: 12 }, scene);
        ground.position.y = -0.92;
        const groundMaterial = new StandardMaterial("environmentGroundMaterial", scene);
        ground.material = groundMaterial;
        const environmentState: EnvironmentRefs = {
          scene,
          hemisphericLight,
          directionalLight,
          groundMaterial,
        };
        environmentRefs.current = environmentState;
        applyEnvironmentPreset(environmentState, "snow");

        let animationNodes: AnimationNodes;
        if (modelUrl) {
          const isBinaryModel = /\\.glb(?:[?#]|$)/i.test(modelUrl);
          let imported;
          if (isBinaryModel) {
            const modelBuffer = await characterModelBinaryCache.load(
              modelUrl,
              async (signal) => {
                const response = await fetch(modelUrl, { signal });
                if (!response.ok) throw new Error(`模型资源加载失败：${response.status}`);
                return response.arrayBuffer();
              },
              { retries: 1, retryDelayMs: 120, signal: loadAbortController.signal },
            );
            const blobUrl = URL.createObjectURL(new Blob([modelBuffer], { type: "model/gltf-binary" }));
            try {
              imported = await SceneLoader.ImportMeshAsync("", "", blobUrl, scene);
            } finally {
              URL.revokeObjectURL(blobUrl);
            }
          } else {
            const { rootUrl, fileName } = splitModelUrl(modelUrl);
            imported = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene);
          }
          const root = new TransformNode("importedCharacterRoot", scene);
          imported.meshes.forEach((mesh) => {
            if (!mesh.parent) mesh.parent = root;
          });
          animationNodes = { body: root, head: root, arm: root, outfit: root };
        } else {
          animationNodes = createProceduralPreview(scene);
        }
        if (disposed || loadAbortController.signal.aborted) return;
        animationNodesRef.current = animationNodes;
        applyCharacterAppearance(animationNodes, outfitId, accessoryId);
        setLoadStatus("ready");

        let previousTimestamp = performance.now();
        engine.runRenderLoop(() => {
          if (!scene || !camera || disposed) return;
          const timestamp = performance.now();
          const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.1);
          previousTimestamp = timestamp;
          if (animationPlayingRef.current) elapsedRef.current += deltaSeconds;
          if (isRotatingRef.current) camera.alpha += 0.008;

          const frame = getCharacterAnimationFrame(animationPresetRef.current, elapsedRef.current);
          const exprConfig = getExpressionConfig(expression);
          const nodes = animationNodesRef.current;
          if (nodes.body) {
            nodes.body.position.y = frame.bodyY;
            nodes.body.rotation.z = frame.bodyRotationZ;
          }
          if (nodes.head && nodes.head !== nodes.body) {
            nodes.head.position.y = 1.3 + frame.bodyY;
            nodes.head.rotation.z = frame.headRotationZ + exprConfig.headTiltZ;
          }
          if (nodes.arm && nodes.arm !== nodes.body) {
            nodes.arm.position.y = 0.65 + frame.bodyY;
            nodes.arm.rotation.z = frame.armRotationZ;
          }
          if (nodes.outfit && nodes.outfit !== nodes.body) {
            nodes.outfit.position.y = 0.1 + frame.outfitY;
            nodes.outfit.scaling.y = frame.scaleY;
          }
          if (nodes.leftEye) nodes.leftEye.scaling.y = exprConfig.eyeScaleY;
          if (nodes.rightEye) nodes.rightEye.scaling.y = exprConfig.eyeScaleY;
          if (nodes.mouth) {
            nodes.mouth.scaling.y = exprConfig.mouthScaleY;
            nodes.mouth.rotation.z = exprConfig.mouthRotationZ;
          }
          scene.render();
        });
      } catch (error) {
        if (loadAbortController.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
        console.error("Babylon character viewer initialization error:", error);
        if (!disposed) setLoadStatus("error");
      }
    };

    void initialize();
    const handleResize = () => engine?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      loadAbortController.abort();
      window.removeEventListener("resize", handleResize);
      engine?.dispose();
      engineRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      animationNodesRef.current = {};
      environmentRefs.current = null;
    };
  }, [characterGender, equippedOutfit, modelUrl, loadAttempt]);

  useEffect(() => {
    if (environmentRefs.current) applyEnvironmentPreset(environmentRefs.current, environment);
  }, [environment]);

  useEffect(() => {
    if (cameraRef.current) cameraRef.current.radius = 6 / zoomLevel;
  }, [zoomLevel]);

  const toggleRotation = () => setIsRotating((previous) => !previous);
  const toggleAnimation = () => setIsAnimationPlaying((previous) => !previous);
  const handleZoomIn = () => setZoomLevel((previous) => Math.min(previous + 0.2, 1.8));
  const handleZoomOut = () => setZoomLevel((previous) => Math.max(previous - 0.2, 0.6));
  const handleResetView = () => {
    setZoomLevel(1);
    setIsRotating(true);
    setIsAnimationPlaying(true);
    setAnimationPreset("idle");
    setEnvironment("snow");
    setExpression("smile");
    setCustomPosterText("");
    elapsedRef.current = 0;
    if (cameraRef.current) {
      cameraRef.current.alpha = Math.PI / 2;
      cameraRef.current.beta = Math.PI / 2.3;
    }
  };

  const handleAddSticker = (stickerId: string) => {
    setStickerPlacements((previous) => [
      ...previous,
      createCharacterPosterStickerPlacement(stickerId, previous.length),
    ]);
  };

  const handleUpdateSticker = (placementId: string, patch: Partial<CharacterPosterStickerPlacement>) => {
    setStickerPlacements((previous) => previous.map((placement) => (
      placement.id === placementId
        ? normalizeCharacterPosterStickerPlacement({ ...placement, ...patch })
        : placement
    )));
  };

  const handleRemoveSticker = (placementId: string) => {
    setStickerPlacements((previous) => previous.filter((placement) => placement.id !== placementId));
  };

  const handleTakePhoto = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setSnapshotError("角色画布尚未准备好，请稍后再试");
      return;
    }
    setIsCapturing(true);
    setSnapshotError(null);
    try {
      const poster = await generateCharacterSnapshotPosterDataUrlAsync({
        playerName,
        userId,
        canvasDataUrl: canvas.toDataURL("image/png"),
        animationLabel: getCharacterAnimationLabel(animationPreset),
        expressionLabel: getCharacterExpressionLabel(expression),
        environmentLabel: getCharacterViewerEnvironmentConfig(environment).label,
        outfitLabel: getCharacterOutfitPreset(outfitId).label,
        accessoryLabel: getCharacterAccessoryPreset(accessoryId).label,
        customText: normalizeCharacterPosterCustomText(customPosterText),
        stickerPlacements,
      });
      setSnapshotPoster(poster);
    } catch (error) {
      console.error("Character snapshot generation failed:", error);
      setSnapshotError("生成角色快照失败，请重试");
    } finally {
      setIsCapturing(false);
    }
  };

  const getSnapshotOptions = () => ({
    playerName,
    userId,
    canvasDataUrl: "",
    animationLabel: getCharacterAnimationLabel(animationPreset),
    expressionLabel: getCharacterExpressionLabel(expression),
    environmentLabel: getCharacterViewerEnvironmentConfig(environment).label,
    outfitLabel: getCharacterOutfitPreset(outfitId).label,
    accessoryLabel: getCharacterAccessoryPreset(accessoryId).label,
    customText: normalizeCharacterPosterCustomText(customPosterText),
    stickerPlacements,
  });

  const handleDownloadSnapshot = () => {
    if (!snapshotPoster) return;
    downloadDataUrl(snapshotPoster, getCharacterSnapshotPosterFileName(playerName));
  };

  const handleNativeSnapshotShare = async () => {
    if (!snapshotPoster) return;
    try {
      const response = await fetch(snapshotPoster);
      const blob = await response.blob();
      const file = new File([blob], getCharacterSnapshotPosterFileName(playerName), { type: "image/png" });
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${playerName} 的角色快照`, text: "看看我在冰雪城市的角色快照！", files: [file] });
      } else {
        handleDownloadSnapshot();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") handleDownloadSnapshot();
    }
  };

  const handleSocialSnapshotShare = (platform: "twitter" | "telegram") => {
    handleDownloadSnapshot();
    toast.success(
      `海报已自动保存到本地！已为您打开 ${platform === "twitter" ? "Twitter" : "Telegram"} 准备带图文案分享。`
    );
    const shareUrl = getCharacterSnapshotShareUrl(platform, getSnapshotOptions());
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="overflow-hidden border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40">
      <CardHeader className="border-b border-white/10 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base text-cyan-100">
            <Box className="h-5 w-5 text-cyan-400" />
            3D 角色模型预览
          </CardTitle>
          <div className="flex items-center gap-1.5 rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>{modelUrl ? "GLB 资源" : "预览模型"}</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          玩家：<span className="font-medium text-slate-200">{playerName}</span> | 当前着装：<span className="font-medium text-cyan-200">{getCharacterOutfitPreset(outfitId).label}</span> · <span className="font-medium text-amber-200">{getCharacterAccessoryPreset(accessoryId).label}</span>
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5" aria-label="角色预览环境切换">
            <span className="mr-1 text-[11px] text-slate-500">环境</span>
            {CHARACTER_VIEWER_ENVIRONMENTS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 rounded-full px-2.5 text-[11px] ${environment === preset.id ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/50" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
                onClick={() => setEnvironment(preset.id)}
                aria-label={`切换到${preset.label}：${preset.description}`}
                aria-pressed={environment === preset.id}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="角色面部表情选择">
            <span className="mr-1 flex items-center gap-1 text-[11px] text-amber-300/90">
              <Smile className="h-3.5 w-3.5" />
              表情
            </span>
            {CHARACTER_EXPRESSIONS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-6 rounded-full px-2 text-[10px] ${expression === item.id ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/50" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
                onClick={() => setExpression(item.id)}
                aria-label={`切换表情为${item.label}：${item.description}`}
                aria-pressed={expression === item.id}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="角色服装切换">
            <span className="mr-1 text-[11px] text-slate-500">穿搭</span>
            {CHARACTER_OUTFITS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-6 rounded-full px-2 text-[10px] ${outfitId === preset.id ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/50" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
                onClick={() => setOutfitId(preset.id)}
                aria-label={`切换穿搭为${preset.label}：${preset.description}`}
                aria-pressed={outfitId === preset.id}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="角色配饰切换">
            <span className="mr-1 text-[11px] text-slate-500">配饰</span>
            {CHARACTER_ACCESSORIES.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-6 rounded-full px-2 text-[10px] ${accessoryId === preset.id ? "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/50" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
                onClick={() => setAccessoryId(preset.id)}
                aria-label={`切换配饰为${preset.label}：${preset.description}`}
                aria-pressed={accessoryId === preset.id}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-2" aria-label="海报自定义文本编辑">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor="character-poster-custom-text" className="text-[11px] text-cyan-100">海报宣言 / 游戏 ID</label>
              <span className={`text-[10px] ${customPosterText.length >= CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH ? "text-amber-300" : "text-slate-500"}`}>
                {customPosterText.length}/{CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <textarea
                id="character-poster-custom-text"
                value={customPosterText}
                maxLength={CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH}
                onChange={(event) => setCustomPosterText(event.target.value)}
                placeholder="例如：从打工人到城市建设者 · ID: ISC-001"
                rows={2}
                className="min-h-12 flex-1 resize-none rounded-md border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none ring-cyan-300/40 placeholder:text-slate-600 focus:ring-2"
                aria-describedby="character-poster-custom-text-help"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px] text-slate-400 hover:bg-white/10 hover:text-slate-100"
                onClick={() => setCustomPosterText("")}
                disabled={!customPosterText}
                aria-label="清空海报自定义文本"
              >
                清空
              </Button>
            </div>
            <p id="character-poster-custom-text-help" className="mt-1 text-[10px] text-slate-500">
              拍照后会将这段内容绘制到海报安全区，并同步到社交分享文案。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="海报贴纸选择">
            <span className="mr-1 text-[11px] text-slate-500">贴纸</span>
            {CHARACTER_POSTER_STICKERS.map((sticker) => (
              <Button
                key={sticker.id}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full bg-white/5 px-2 text-xs text-slate-200 hover:bg-cyan-400/15 hover:text-cyan-100"
                onClick={() => handleAddSticker(sticker.id)}
                aria-label={`添加贴纸：${sticker.label}`}
              >
                <span aria-hidden="true">{sticker.glyph}</span>
                <span className="ml-1">{sticker.label}</span>
              </Button>
            ))}
          </div>
          {stickerPlacements.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" aria-label="已放置贴纸编辑">
              <span className="mr-1 text-[11px] text-slate-500">编辑</span>
              {stickerPlacements.map((placement) => {
                const sticker = getCharacterPosterSticker(placement.stickerId);
                return (
                  <div key={placement.id} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5">
                    <span className="text-xs" aria-label={sticker.label}>{sticker.glyph}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-slate-300 hover:text-cyan-100"
                      onClick={() => handleUpdateSticker(placement.id, { x: placement.x - 0.04 })}
                      aria-label={`向左移动贴纸：${sticker.label}`}
                    >
                      ←
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-slate-300 hover:text-cyan-100"
                      onClick={() => handleUpdateSticker(placement.id, { x: placement.x + 0.04 })}
                      aria-label={`向右移动贴纸：${sticker.label}`}
                    >
                      →
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-slate-300 hover:text-cyan-100"
                      onClick={() => handleUpdateSticker(placement.id, { y: placement.y - 0.04 })}
                      aria-label={`向上移动贴纸：${sticker.label}`}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-slate-300 hover:text-cyan-100"
                      onClick={() => handleUpdateSticker(placement.id, { y: placement.y + 0.04 })}
                      aria-label={`向下移动贴纸：${sticker.label}`}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-slate-300 hover:text-cyan-100"
                      onClick={() => handleUpdateSticker(placement.id, { scale: Math.min(2, placement.scale + 0.15) })}
                      aria-label={`放大贴纸：${sticker.label}`}
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-slate-300 hover:text-cyan-100"
                      onClick={() => handleUpdateSticker(placement.id, { rotation: placement.rotation + 15 })}
                      aria-label={`旋转贴纸：${sticker.label}`}
                    >
                      ↻
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-rose-300 hover:text-rose-100"
                      onClick={() => handleRemoveSticker(placement.id)}
                      aria-label={`删除贴纸：${sticker.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative p-0">
        <div className="relative h-[340px] w-full bg-slate-950">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
            aria-label="3D 角色模型 360 度预览画布，可拖动旋转并使用滚轮缩放"
          />

          {loadStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-cyan-200 backdrop-blur-sm" role="status" aria-live="polite">
              <RefreshCw className="mb-2 h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-xs">正在加载 3D 模型与 PBR 材质...</p>
            </div>
          )}

          {loadStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center" role="alert">
              <div className="relative mb-3 h-24 w-16 rounded-[45%] border-2 border-cyan-200/70 bg-gradient-to-b from-cyan-100/90 via-blue-300/70 to-blue-900/80 shadow-[0_0_28px_rgba(34,211,238,0.25)]" aria-hidden="true">
                <div className="absolute left-1/2 top-5 h-6 w-6 -translate-x-1/2 rounded-full bg-amber-100/90" />
                <div className="absolute -left-4 top-10 h-3 w-5 rotate-[-20deg] rounded-full bg-blue-300/80" />
                <div className="absolute -right-4 top-10 h-3 w-5 rotate-[20deg] rounded-full bg-blue-300/80" />
              </div>
              <AlertCircle className="mb-2 h-6 w-6 text-amber-300" aria-hidden="true" />
              <p className="text-sm font-medium text-cyan-100">已切换至 2D 角色降级预览</p>
              <p className="mt-1 text-xs text-slate-400">3D 渲染环境暂不可用，角色外观与当前动画仍可继续查看。</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 border-cyan-300/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                onClick={() => setLoadAttempt((previous) => previous + 1)}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                重新加载 3D 模型
              </Button>
            </div>
          )}

          <div className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/85 px-2.5 py-1.5 shadow-lg backdrop-blur-md">
            <Button type="button" variant="ghost" size="sm" className={`h-7 gap-1 px-2 text-xs ${isAnimationPlaying ? "bg-cyan-400/20 text-cyan-200" : "text-slate-300"}`} onClick={toggleAnimation} aria-label={isAnimationPlaying ? "暂停当前待机动画" : "播放当前待机动画"}>
              {isAnimationPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isAnimationPlaying ? "动画中" : "已暂停"}</span>
            </Button>
            {CHARACTER_ANIMATION_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs ${animationPreset === preset.id ? "bg-amber-400/20 text-amber-200" : "text-slate-300"}`}
                onClick={() => {
                  setAnimationPreset(preset.id);
                  setIsAnimationPlaying(true);
                  elapsedRef.current = 0;
                }}
                aria-label={`播放${preset.label}动画：${preset.description}`}
                aria-pressed={animationPreset === preset.id}
              >
                {preset.label}
              </Button>
            ))}
            <div className="h-4 w-px bg-white/10" aria-hidden="true" />
            <Button type="button" variant="ghost" size="sm" className={`h-7 gap-1 px-2 text-xs ${isRotating ? "bg-cyan-400/20 text-cyan-200" : "text-slate-300"}`} onClick={toggleRotation} aria-label={isRotating ? "暂停 360 度旋转" : "恢复 360 度旋转"}>
              <RotateCw className={`h-3.5 w-3.5 ${isRotating ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
              <span className="hidden sm:inline">{isRotating ? "旋转中" : "已暂停"}</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-white/15 hover:text-white" onClick={handleZoomIn} title="放大模型" aria-label="放大模型">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-white/15 hover:text-white" onClick={handleZoomOut} title="缩小模型" aria-label="缩小模型">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-cyan-200 hover:bg-cyan-400/20 hover:text-cyan-100" onClick={handleTakePhoto} disabled={isCapturing || loadStatus === "loading"} aria-label="拍照并生成角色分享海报">
              {isCapturing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              <span>{isCapturing ? "生成中" : "拍照分享"}</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-300 hover:bg-white/15 hover:text-white" onClick={handleResetView} aria-label="重置角色视角和动画">
              重置
            </Button>
          </div>
        </div>
        {snapshotError && (
          <p className="border-t border-red-400/20 bg-red-950/20 px-3 py-2 text-center text-[11px] text-red-200" role="alert">
            {snapshotError}
          </p>
        )}
        <p className="border-t border-white/5 px-3 py-2 text-center text-[11px] text-slate-500" role="status" aria-live="polite">
          环境：{getCharacterViewerEnvironmentConfig(environment).label} · 表情：{getCharacterExpressionLabel(expression)} · 动作：{getCharacterAnimationLabel(animationPreset)} · 穿搭：{getCharacterOutfitPreset(outfitId).label} · 配饰：{getCharacterAccessoryPreset(accessoryId).label} · {isAnimationPlaying ? "播放中" : "已暂停"}
        </p>
        <Dialog open={Boolean(snapshotPoster)} onOpenChange={(open) => !open && setSnapshotPoster(null)}>
          <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-cyan-400/25 bg-slate-950 text-slate-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-cyan-100">
                <Share2 className="h-5 w-5 text-cyan-400" />
                角色快照分享卡
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                当前海报已包含你的环境、动作、表情、穿搭和配饰状态，可下载或分享给好友。
              </DialogDescription>
            </DialogHeader>
            {snapshotPoster && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-2">
                  <img src={snapshotPoster} alt={`${playerName} 的角色快照海报`} className="mx-auto max-h-[58vh] w-auto max-w-full rounded-lg object-contain" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button type="button" onClick={handleDownloadSnapshot} className="gap-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400" aria-label="下载角色快照海报">
                    <Download className="h-4 w-4" />下载
                  </Button>
                  <Button type="button" onClick={handleNativeSnapshotShare} variant="outline" className="gap-1.5 border-cyan-400/30 text-cyan-100 hover:bg-cyan-400/10" aria-label="系统分享角色快照海报">
                    <Share2 className="h-4 w-4" />系统分享
                  </Button>
                  <Button type="button" onClick={() => handleSocialSnapshotShare("twitter")} variant="outline" className="gap-1.5 border-sky-400/30 text-sky-200 hover:bg-sky-400/10" aria-label="分享到 Twitter">
                    <Send className="h-4 w-4" />Twitter
                  </Button>
                  <Button type="button" onClick={() => handleSocialSnapshotShare("telegram")} variant="outline" className="gap-1.5 border-blue-400/30 text-blue-200 hover:bg-blue-400/10" aria-label="分享到 Telegram">
                    <Send className="h-4 w-4" />Telegram
                  </Button>
                </div>
                <p className="text-center text-xs text-slate-500" role="status" aria-live="polite">
                  {getCharacterViewerEnvironmentConfig(environment).label} · {getCharacterExpressionLabel(expression)} · {getCharacterAnimationLabel(animationPreset)}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

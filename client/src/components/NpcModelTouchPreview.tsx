import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Box,
  Hand,
  Maximize2,
  Pause,
  Play,
  RefreshCw,
  Rotate3d,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerMobileHaptic } from "@/components/ui/mobile-bottom-sheet";
import type { NpcInteractionProfile } from "@/lib/npcInteractionData";
import { PlayerCharacterModel } from "@/game/models/PlayerCharacterModel";
import { loadHighFidelityCharacterWithFallback } from "@/lib/highFidelityCharacterLoader";
import { CORE_ASSET_MANIFEST, getAssetRuntimeLabel } from "@/lib/assetManifest";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type NpcLanguage = "zh" | "en";

type NpcModelTouchPreviewProps = {
  profile: NpcInteractionProfile;
  lang: NpcLanguage;
};

type PointerPoint = { x: number; y: number };

type ZoomBoundary = "min" | "max" | null;

const MIN_PREVIEW_ZOOM = 0.78;
const MAX_PREVIEW_ZOOM = 1.35;
const MIN_PINCH_DISTANCE = 8;

const NPC_PREVIEW_PALETTES = [
  { skinTone: "#f4c4a0", hairColor: "#2c1810", outfitColor: "#2563eb" },
  { skinTone: "#e8b896", hairColor: "#5a321f", outfitColor: "#7c3aed" },
  { skinTone: "#d4a574", hairColor: "#151b29", outfitColor: "#0f766e" },
  { skinTone: "#c9985c", hairColor: "#2d1b33", outfitColor: "#c2410c" },
] as const;

function getPreviewPalette(profile: NpcInteractionProfile) {
  const hash = Array.from(profile.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  return NPC_PREVIEW_PALETTES[hash % NPC_PREVIEW_PALETTES.length];
}

function getNpcAssetManifestEntry(profile: NpcInteractionProfile) {
  const catalogue = CORE_ASSET_MANIFEST.find((entry) => entry.kind === "npc") ?? CORE_ASSET_MANIFEST[1];
  return { ...catalogue, id: profile.id, displayName: profile.name, glbUrl: profile.modelAssetUrl ?? null, status: profile.modelAssetUrl ? "catalogued" as const : "pending-import" as const };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDistance(first: PointerPoint, second: PointerPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function NpcModelTouchPreview({
  profile,
  lang,
}: NpcModelTouchPreviewProps) {
  const assetManifestEntry = getNpcAssetManifestEntry(profile);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<PlayerCharacterModel | null>(null);
  const loadedModelRef = useRef<THREE.Object3D | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rotationRef = useRef(0);
  const zoomRef = useRef(1);
  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const lastSinglePointerRef = useRef<PointerPoint | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);
  const zoomBoundaryRef = useRef<ZoomBoundary>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPositionRef = useRef<PointerPoint | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentAction, setCurrentAction] = useState<
    "stand" | "walk" | "interact"
  >("stand");
  const currentActionRef = useRef<"stand" | "walk" | "interact">("stand");
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);
  const animationSpeedRef = useRef<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const isPlayingRef = useRef<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [modelSource, setModelSource] = useState<
    "prototype" | "loading-glb" | "loading-baseline" | "glb" | "baseline-glb" | "glb-fallback"
  >("prototype");

  useEffect(() => {
    currentActionRef.current = currentAction;
  }, [currentAction]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    setWebglUnavailable(false);
    setModelSource(
      profile.modelAssetUrl
        ? "loading-glb"
        : assetManifestEntry.baselineGlbUrl
          ? "loading-baseline"
          : "prototype"
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111f);
    scene.fog = new THREE.Fog(0x07111f, 5, 12);

    const width = Math.max(container.clientWidth, 280);
    const height = Math.max(container.clientHeight, 280);
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.65, 3.2);
    camera.lookAt(0, 0.55, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x9ecbff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe8f4f8, 2.1);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfff8dc, 0.7);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 48),
      new THREE.MeshStandardMaterial({
        color: 0x122b45,
        roughness: 0.8,
        metalness: 0.1,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.82;
    ground.receiveShadow = true;
    scene.add(ground);

    const palette = getPreviewPalette(profile);
    const model = new PlayerCharacterModel({
      ...palette,
      position: new THREE.Vector3(0, 0, 0),
    });
    model.getScene().castShadow = true;
    scene.add(model.getScene());
    modelRef.current = model;

    if (profile.modelAssetUrl) {
      setLoadProgress(0);
      loadHighFidelityCharacterWithFallback(
        profile.modelAssetUrl,
        (progress: { loaded: number; total: number; percent: number }) => {
          if (!disposed) {
            setLoadProgress(progress.percent);
          }
        }
      )
        .then((result: { success: boolean; model: THREE.Object3D | null }) => {
          if (disposed) return;
          if (result.success && result.model) {
            model.dispose();
            scene.remove(model.getScene());
            loadedModelRef.current = result.model;
            result.model.traverse((object: THREE.Object3D) => {
              if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            });
            scene.add(result.model);
            modelRef.current = null;
            setModelSource("glb");
          } else {
            setModelSource("glb-fallback");
          }
        })
        .catch(() => {
          if (!disposed) setModelSource("glb-fallback");
        });
    } else if (assetManifestEntry.baselineGlbUrl) {
      setLoadProgress(0);
      new GLTFLoader().load(
        assetManifestEntry.baselineGlbUrl,
        (result) => {
          if (disposed) return;
          model.dispose();
          scene.remove(model.getScene());
          loadedModelRef.current = result.scene;
          result.scene.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true;
              object.receiveShadow = true;
            }
          });
          scene.add(result.scene);
          modelRef.current = null;
          setLoadProgress(100);
          setModelSource("baseline-glb");
        },
        (progress) => {
          if (!disposed && progress.total > 0) {
            setLoadProgress(Math.min(100, Math.round((progress.loaded / progress.total) * 100)));
          }
        },
        () => {
          if (!disposed) setModelSource("glb-fallback");
        }
      );
    }

    let animationFrame = 0;
    const renderFrame = () => {
      animationFrame = requestAnimationFrame(renderFrame);
      const activeModel = loadedModelRef.current ?? model.getScene();
      activeModel.rotation.y = rotationRef.current;
      activeModel.scale.setScalar(zoomRef.current);
      if (modelRef.current && isPlayingRef.current) {
        model.playActionAnimation(
          currentActionRef.current,
          animationSpeedRef.current
        );
      }
      renderer.render(scene, camera);
    };
    renderFrame();

    const handleResize = () => {
      if (!containerRef.current) return;
      const nextWidth = Math.max(containerRef.current.clientWidth, 280);
      const nextHeight = Math.max(containerRef.current.clientHeight, 280);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrame);

      if (loadedModelRef.current) {
        scene.remove(loadedModelRef.current);
        loadedModelRef.current.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        });
        loadedModelRef.current = null;
      }

      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
      renderer.dispose();
      rendererRef.current = null;
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [profile.id, profile.modelAssetUrl]);

  const resetView = () => {
    rotationRef.current = 0;
    zoomRef.current = 1;
    zoomBoundaryRef.current = null;
    setRotationDegrees(0);
    setZoomPercent(100);
  };

  const updateZoom = (requestedZoom: number, withHaptic = false) => {
    const nextZoom = clamp(requestedZoom, MIN_PREVIEW_ZOOM, MAX_PREVIEW_ZOOM);
    const boundary: ZoomBoundary =
      nextZoom === MIN_PREVIEW_ZOOM
        ? "min"
        : nextZoom === MAX_PREVIEW_ZOOM
          ? "max"
          : null;

    if (withHaptic && boundary && zoomBoundaryRef.current !== boundary) {
      triggerMobileHaptic("light");
    }
    zoomBoundaryRef.current = boundary;
    zoomRef.current = nextZoom;
    setZoomPercent(Math.round(nextZoom * 100));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 1) {
      const now = Date.now();
      const lastTapTime = lastTapTimeRef.current;
      const lastTapPos = lastTapPositionRef.current;
      const DOUBLE_TAP_DELAY_MS = 300;
      const DOUBLE_TAP_MAX_DISTANCE_PX = 16;

      if (
        lastTapPos &&
        now - lastTapTime <= DOUBLE_TAP_DELAY_MS &&
        getDistance(point, lastTapPos) <= DOUBLE_TAP_MAX_DISTANCE_PX
      ) {
        // Double-tap detected: reset zoom to 100% (1.0)
        updateZoom(1.0, true);
        triggerMobileHaptic("success");
        lastTapTimeRef.current = 0;
        lastTapPositionRef.current = null;
      } else {
        lastTapTimeRef.current = now;
        lastTapPositionRef.current = point;
      }

      lastSinglePointerRef.current = point;
      pinchStartDistanceRef.current = null;
      return;
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const distance = getDistance(first, second);
      pinchStartDistanceRef.current = Math.max(distance, MIN_PINCH_DISTANCE);
      pinchStartZoomRef.current = zoomRef.current;
      lastSinglePointerRef.current = null;
      return;
    }

    // A third pointer makes the current pinch ambiguous. Re-baseline only
    // after the gesture returns to exactly two active pointers.
    pinchStartDistanceRef.current = null;
    lastSinglePointerRef.current = null;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pointer = pointersRef.current.get(event.pointerId);
    if (!pointer) return;

    const nextPoint = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, nextPoint);

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const currentDistance = getDistance(first, second);
      if (currentDistance < MIN_PINCH_DISTANCE) return;

      if (!pinchStartDistanceRef.current) {
        pinchStartDistanceRef.current = currentDistance;
        pinchStartZoomRef.current = zoomRef.current;
        return;
      }

      updateZoom(
        pinchStartZoomRef.current *
          (currentDistance / pinchStartDistanceRef.current),
        true
      );
      return;
    }

    if (pointersRef.current.size !== 1 || !lastSinglePointerRef.current) return;
    const deltaX = nextPoint.x - lastSinglePointerRef.current.x;
    rotationRef.current += deltaX * 0.012;
    setRotationDegrees(Math.round((rotationRef.current * 180) / Math.PI));
    lastSinglePointerRef.current = nextPoint;
  };

  const releasePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchStartDistanceRef.current = Math.max(
        getDistance(first, second),
        MIN_PINCH_DISTANCE
      );
      pinchStartZoomRef.current = zoomRef.current;
      lastSinglePointerRef.current = null;
    } else if (pointersRef.current.size === 1) {
      lastSinglePointerRef.current = Array.from(
        pointersRef.current.values()
      )[0];
      pinchStartDistanceRef.current = null;
    } else {
      lastSinglePointerRef.current = null;
      pinchStartDistanceRef.current = null;
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateZoom(zoomRef.current - event.deltaY * 0.001, true);
  };

  return (
    <section
      data-testid="npc-3d-preview"
      className="space-y-3 rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-3"
      aria-labelledby="npc-3d-preview-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-cyan-200">
            <Rotate3d className="h-4 w-4" aria-hidden="true" />
            <h3 id="npc-3d-preview-title" className="text-sm font-semibold">
              {lang === "zh"
                ? "移动端 3D 角色预览"
                : "Mobile 3D character preview"}
            </h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {lang === "zh"
              ? "单指左右滑动旋转，双指捏合缩放。"
              : "Swipe with one finger to rotate; pinch with two fingers to zoom."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="npc-3d-reset"
          aria-label={
            lang === "zh" ? "重置 NPC 预览视角" : "Reset NPC preview view"
          }
          onClick={resetView}
          className="min-h-10 shrink-0 border-slate-700 bg-slate-900/80 px-2.5 text-slate-200"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {lang === "zh" ? "重置" : "Reset"}
        </Button>
      </div>

      <div
        ref={containerRef}
        data-testid="npc-3d-canvas"
        data-rotation-degrees={rotationDegrees}
        data-zoom-percent={zoomPercent}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onWheel={handleWheel}
        className="relative h-72 touch-none overflow-hidden rounded-2xl border border-cyan-400/15 bg-[radial-gradient(circle_at_50%_28%,rgba(56,189,248,0.2),transparent_42%),linear-gradient(160deg,#0b2036,#07111f_70%)]"
        role="application"
        aria-label={
          lang === "zh"
            ? `${profile.name}的 3D 角色预览，可旋转和缩放`
            : `${profile.nameEn} 3D character preview, rotatable and zoomable`
        }
      >
        {webglUnavailable && (
          <div
            data-testid="npc-3d-webgl-fallback"
            className="absolute inset-0 z-10 grid place-items-center p-6 text-center"
            role="status"
          >
            <div>
              <Box
                className="mx-auto h-8 w-8 text-amber-300"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-amber-100">
                {lang === "zh"
                  ? "当前设备暂不支持 WebGL"
                  : "WebGL is unavailable on this device"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {lang === "zh"
                  ? "可继续查看角色故事与资产规格；真实模型预览将在支持 WebGL 的设备上显示。"
                  : "The story and asset specification remain available; the model preview requires WebGL."}
              </p>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col gap-1.5 text-[10px] text-cyan-100/80">
          <div className="flex items-center justify-between gap-2">
            <span
              data-testid="npc-3d-source-label"
              className="rounded-lg bg-slate-950/65 px-2 py-1"
            >
                {modelSource === "glb"
                  ? lang === "zh"
                    ? "真实 GLB 资产 · 已加载"
                    : "Real GLB asset · Loaded"
                  : modelSource === "loading-glb"
                  ? lang === "zh"
                    ? `正在加载 GLB (${loadProgress}%)`
                    : `Loading GLB (${loadProgress}%)`
                  : modelSource === "loading-baseline"
                    ? lang === "zh"
                      ? `正在加载开发基线 (${loadProgress}%)`
                      : `Loading baseline (${loadProgress}%)`
                    : modelSource === "baseline-glb"
                      ? lang === "zh"
                        ? "程序化基线 GLB · 开发预览"
                        : "Procedural baseline GLB · Dev preview"
                  : modelSource === "glb-fallback"
                    ? lang === "zh"
                      ? "GLB 不可用 · 原型回退"
                      : "GLB unavailable · prototype fallback"
                    : assetManifestEntry.glbUrl
                      ? lang === "zh"
                        ? `${getAssetRuntimeLabel(assetManifestEntry)} · 正在加载`
                        : `${getAssetRuntimeLabel(assetManifestEntry)} · Loading`
                      : lang === "zh"
                        ? `${getAssetRuntimeLabel(assetManifestEntry)} · 程序化原型预览`
                        : `${getAssetRuntimeLabel(assetManifestEntry)} · Procedural prototype preview`}
            </span>
            <span className="rounded-lg bg-slate-950/65 px-2 py-1 font-mono">
              {rotationDegrees}° · {zoomPercent}%
            </span>
          </div>

          {(modelSource === "loading-glb" || modelSource === "loading-baseline") && (
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/80 shadow-inner"
              role="progressbar"
              aria-valuenow={loadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-cyan-400 transition-all duration-150 ease-out"
                style={{ width: `${Math.max(loadProgress, 5)}%` }}
              />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-2 text-[10px] text-slate-300/80">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-950/65 px-2 py-1">
            <Hand className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === "zh" ? "拖动旋转" : "Drag to rotate"}</span>
            <ZoomIn className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === "zh" ? "捏合缩放" : "Pinch to zoom"}</span>
          </div>
          <button
            type="button"
            data-testid="npc-3d-canvas-reset-btn"
            aria-label={lang === "zh" ? "重置视角" : "Reset view"}
            title={lang === "zh" ? "重置视角和缩放" : "Reset view and zoom"}
            onClick={e => {
              e.stopPropagation();
              resetView();
              triggerMobileHaptic("success");
            }}
            className="pointer-events-auto inline-flex min-h-8 min-w-8 items-center gap-1 rounded-lg border border-cyan-400/30 bg-slate-950/85 px-2.5 py-1 text-xs font-semibold text-cyan-200 shadow-md backdrop-blur-sm transition-colors hover:bg-cyan-500/20 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === "zh" ? "重置视角" : "Reset View"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label={
            lang === "zh" ? "角色动作切换" : "Character action selector"
          }
        >
          {(
            [
              { id: "stand", zh: "站立 (Idle)", en: "Stand" },
              { id: "walk", zh: "行走 (Walk)", en: "Walk" },
              { id: "interact", zh: "互动 (Wave)", en: "Interact" },
            ] as const
          ).map(action => {
            const isActive = currentAction === action.id;
            return (
              <button
                key={action.id}
                type="button"
                data-testid={`npc-action-${action.id}`}
                aria-pressed={isActive}
                onClick={() => {
                  setCurrentAction(action.id);
                  triggerMobileHaptic("light");
                }}
                className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 shadow-sm font-semibold"
                    : "bg-slate-900/90 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-cyan-200"
                }`}
              >
                {lang === "zh" ? action.zh : action.en}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {lang === "zh"
            ? `当前动作: ${currentAction}`
            : `Action: ${currentAction}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 mt-2 pt-2">
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label={
            lang === "zh"
              ? "动画播放与速度控制"
              : "Animation playback and speed controls"
          }
        >
          <button
            type="button"
            data-testid="npc-play-pause-btn"
            aria-label={
              isPlaying
                ? lang === "zh"
                  ? "暂停动画"
                  : "Pause animation"
                : lang === "zh"
                  ? "播放动画"
                  : "Play animation"
            }
            title={
              isPlaying
                ? lang === "zh"
                  ? "暂停动画"
                  : "Pause"
                : lang === "zh"
                  ? "播放动画"
                  : "Play"
            }
            onClick={() => {
              setIsPlaying(!isPlaying);
              triggerMobileHaptic("medium");
            }}
            className={`inline-flex min-h-7 min-w-7 items-center justify-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors shadow-sm ${
              isPlaying
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-cyan-600 text-white hover:bg-cyan-500"
            }`}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {isPlaying
                ? lang === "zh"
                  ? "暂停"
                  : "Pause"
                : lang === "zh"
                  ? "播放"
                  : "Play"}
            </span>
          </button>

          <span className="text-xs text-slate-400 ml-2 mr-1">
            {lang === "zh" ? "速度:" : "Speed:"}
          </span>
          {([0.5, 1.0, 2.0] as const).map(speed => {
            const isActive = animationSpeed === speed;
            const label = speed === 0.5 ? "0.5x" : speed === 1.0 ? "1x" : "2x";
            return (
              <button
                key={speed}
                type="button"
                data-testid={`npc-speed-${speed}`}
                aria-pressed={isActive}
                onClick={() => {
                  setAnimationSpeed(speed);
                  triggerMobileHaptic("light");
                }}
                className={`min-h-7 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-sm font-semibold"
                    : "bg-slate-900/90 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-amber-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {isPlaying
            ? lang === "zh"
              ? `速度: ${animationSpeed}x`
              : `Speed: ${animationSpeed}x`
            : lang === "zh"
              ? "已暂停 (Paused)"
              : "Paused"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span>
          {modelSource === "glb"
            ? lang === "zh"
              ? "当前展示已同步的 GLB 模型；手势仅改变预览视角，不修改资产文件。"
              : "The synced GLB model is shown; gestures change only the preview view, not the asset file."
            : lang === "zh"
              ? "真实 GLB 资产未同步时仅展示可交互原型，不代表高保真文件已交付。"
              : "When the real GLB is not synced, this interactive prototype does not represent a delivered high-fidelity file."}
        </span>
        <Maximize2
          className="h-3.5 w-3.5 shrink-0 text-cyan-300/70"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

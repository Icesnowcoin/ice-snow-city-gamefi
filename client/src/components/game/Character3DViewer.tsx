/**
 * Character 3D Viewer Component
 * Displays player character in 360-degree view with Three.js
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Type definitions
export interface PlayerCharacter {
  id: number;
  userId: number;
  gender: 'male' | 'female';
  skinTone: string;
  faceShape: string;
  eyeShape: string;
  eyeColor: string;
  noseShape: string;
  mouthShape: string;
  hairStyle: string;
  hairColor: string;
  bodyType: string;
  height: number;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}

interface ShopItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  rarity: string;
  price: number;
  imageUrl: string;
  previewUrl?: string;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Character3DViewerProps {
  character: PlayerCharacter | null;
  equippedItems: Record<string, ShopItem | undefined>;
  onRotationChange?: (rotation: number) => void;
  autoRotate?: boolean;
  width?: number;
  height?: number;
}

export const Character3DViewer: React.FC<Character3DViewerProps> = ({
  character,
  equippedItems,
  onRotationChange,
  autoRotate = true,
  width = 800,
  height = 600,
}) => {
  if (!character) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg">
        <p className="text-white">加载角色中...</p>
      </div>
    );
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEquipmentChanging, setIsEquipmentChanging] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [characterOpacity, setCharacterOpacity] = useState(1);
  const animationFrameRef = useRef<number | null>(null);
  const equipmentChangeTimeRef = useRef<number>(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0.5, 2);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Add rim light
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.3);
    rimLight.position.set(-5, 5, -10);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(0x4da6ff, 0.5);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    // Character group
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // Create character body
    createCharacterBody(characterGroup, character, equippedItems);

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStart.x;
      const newRotation = rotation + deltaX * 0.01;
      setRotation(newRotation);
      characterGroup.rotation.y = newRotation;
      onRotationChange?.(newRotation);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    // Touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - dragStart.x;
      const newRotation = rotation + deltaX * 0.01;
      setRotation(newRotation);
      characterGroup.rotation.y = newRotation;
      onRotationChange?.(newRotation);
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // Animation loop with equipment transition
    let animationId: number;
    let equipmentChangeTime = 0;
    let isChanging = false;
    let charOpacity = 1;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Handle equipment change animation
      if (isChanging && equipmentChangeTime < 1) {
        equipmentChangeTime += 0.05;
        const progress = equipmentChangeTime;
        
        // Fade out -> fade in animation
        if (progress < 0.5) {
          charOpacity = 1 - (progress * 2);
        } else {
          charOpacity = (progress - 0.5) * 2;
        }
        
        // Slight rotation during equipment change
        characterGroup.rotation.y += 0.02;
      } else if (isChanging) {
        isChanging = false;
        equipmentChangeTime = 0;
        charOpacity = 1;
      }
      
      // Apply opacity to character
      characterGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              mat.transparent = true;
              mat.opacity = charOpacity;
            });
          } else {
            (child.material as any).transparent = true;
            (child.material as any).opacity = charOpacity;
          }
        }
      });
      
      // Auto-rotate
      if (autoRotate && !isDragging && !isChanging) {
        const newRotation = rotation + 0.005;
        setRotation(newRotation);
        characterGroup.rotation.y = newRotation;
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);
    
    // Store reference for equipment change
    (characterGroup as any)._isChanging = () => isChanging;
    (characterGroup as any)._setIsChanging = (val: boolean) => { isChanging = val; equipmentChangeTime = 0; };

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [width, height, autoRotate]);

  // Update character when props change
  useEffect(() => {
    if (!characterGroupRef.current) return;

    // Trigger equipment change animation
    setIsEquipmentChanging(true);
    equipmentChangeTimeRef.current = 0;
    if ((characterGroupRef.current as any)._setIsChanging) {
      (characterGroupRef.current as any)._setIsChanging(true);
    }

    // Delay character update for animation effect
    const timer = setTimeout(() => {
      if (!characterGroupRef.current) return;
      
      // Clear previous character
      while (characterGroupRef.current.children.length > 0) {
        const child = characterGroupRef.current.children[0];
        characterGroupRef.current.remove(child);
      }

      // Create new character
      createCharacterBody(characterGroupRef.current, character, equippedItems);
    }, 250);

    return () => clearTimeout(timer);
  }, [character, equippedItems]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-3" />
            <p className="text-sm">加载角色中...</p>
          </div>
        </div>
      )}

      {isEquipmentChanging && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-5 pointer-events-none">
          <div className="text-center">
            <div className="animate-pulse">
              <p className="text-cyan-300 text-sm font-semibold">更换装备中...</p>
            </div>
          </div>
        </div>
      )}

      {/* 旋转提示 */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm pointer-events-none">
        <p>拖动鼠标旋转 | 360°查看</p>
      </div>

      {/* 旋转角度显示 */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-sm">
        <p>旋转: {Math.round((rotation * 180) / Math.PI) % 360}°</p>
      </div>
    </div>
  );
};

/**
 * Create character body with equipped items
 */
function createCharacterBody(
  group: THREE.Group,
  character: PlayerCharacter | null,
  equippedItems: Record<string, ShopItem | undefined>
) {
  if (!character) return;
  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: getSkinColor(character.skinTone),
    roughness: 0.3,
    metalness: 0.1,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 0.6;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.15);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: getClothingColor(equippedItems['shirt']),
    roughness: 0.4,
    metalness: 0,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.25;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Arms
  const armGeometry = new THREE.CapsuleGeometry(0.05, 0.35, 4, 8);
  const armMaterial = new THREE.MeshStandardMaterial({
    color: getSkinColor(character.skinTone),
    roughness: 0.3,
    metalness: 0.1,
  });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.15, 0.35, 0);
  leftArm.rotation.z = Math.PI / 4;
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.15, 0.35, 0);
  rightArm.rotation.z = -Math.PI / 4;
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  group.add(rightArm);

  // Legs
  const legGeometry = new THREE.CapsuleGeometry(0.06, 0.35, 4, 8);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: getPantsColor(equippedItems['pants']),
    roughness: 0.4,
    metalness: 0,
  });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.08, -0.1, 0);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.08, -0.1, 0);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  group.add(rightLeg);

  // Shoes
  const shoeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.12);
  const shoeMaterial = new THREE.MeshStandardMaterial({
    color: getShoeColor(equippedItems['shoes']),
    roughness: 0.5,
    metalness: 0.2,
  });

  const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
  leftShoe.position.set(-0.08, -0.35, 0);
  leftShoe.castShadow = true;
  leftShoe.receiveShadow = true;
  group.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
  rightShoe.position.set(0.08, -0.35, 0);
  rightShoe.castShadow = true;
  rightShoe.receiveShadow = true;
  group.add(rightShoe);

  // Add accessories
  if (equippedItems['hat']) {
    addHat(group, head);
  }

  if (equippedItems['glasses']) {
    addGlasses(group, head);
  }

  if (equippedItems['ring']) {
    addRing(group, rightArm);
  }

  if (equippedItems['bracelet']) {
    addBracelet(group, leftArm);
  }

  if (equippedItems['bag']) {
    addBag(group, body);
  }
}

/**
 * Get skin color from character data
 */
function getSkinColor(skinTone: string): number {
  const colors: Record<string, number> = {
    fair: 0xf4c8a0,
    light: 0xe8b89f,
    medium: 0xd4a574,
    tan: 0xb8956a,
    deep: 0x8b6f47,
  };
  return colors[skinTone] || 0xf4c8a0;
}

/**
 * Get clothing color from item
 */
function getClothingColor(item?: ShopItem): number {
  if (!item) return 0x1a1a1a;
  // Extract color from item attributes or use default
  return (item.attributes?.color as number) || 0x1a1a1a;
}

/**
 * Get pants color from item
 */
function getPantsColor(item?: ShopItem): number {
  if (!item) return 0x2c3e50;
  return (item.attributes?.color as number) || 0x2c3e50;
}

/**
 * Get shoe color from item
 */
function getShoeColor(item?: ShopItem): number {
  if (!item) return 0x1a1a1a;
  return (item.attributes?.color as number) || 0x1a1a1a;
}

/**
 * Add hat to character
 */
function addHat(group: THREE.Group, head: THREE.Mesh) {
  const hatGeometry = new THREE.ConeGeometry(0.18, 0.15, 32);
  const hatMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.4,
  });
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.copy(head.position);
  hat.position.y += 0.2;
  hat.castShadow = true;
  hat.receiveShadow = true;
  group.add(hat);
}

/**
 * Add glasses to character
 */
function addGlasses(group: THREE.Group, head: THREE.Mesh) {
  const glassGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.02);
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.2,
    metalness: 0.5,
  });

  const leftGlass = new THREE.Mesh(glassGeometry, glassMaterial);
  leftGlass.position.copy(head.position);
  leftGlass.position.x -= 0.06;
  leftGlass.position.y += 0.02;
  leftGlass.position.z += 0.15;
  leftGlass.castShadow = true;
  group.add(leftGlass);

  const rightGlass = new THREE.Mesh(glassGeometry, glassMaterial);
  rightGlass.position.copy(head.position);
  rightGlass.position.x += 0.06;
  rightGlass.position.y += 0.02;
  rightGlass.position.z += 0.15;
  rightGlass.castShadow = true;
  group.add(rightGlass);
}

/**
 * Add ring to character
 */
function addRing(group: THREE.Group, arm: THREE.Mesh) {
  const ringGeometry = new THREE.TorusGeometry(0.03, 0.01, 16, 8);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.8,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.copy(arm.position);
  ring.position.y -= 0.15;
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);
}

/**
 * Add bracelet to character
 */
function addBracelet(group: THREE.Group, arm: THREE.Mesh) {
  const braceletGeometry = new THREE.TorusGeometry(0.05, 0.015, 16, 8);
  const braceletMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    roughness: 0.3,
    metalness: 0.7,
  });
  const bracelet = new THREE.Mesh(braceletGeometry, braceletMaterial);
  bracelet.position.copy(arm.position);
  bracelet.position.y -= 0.1;
  bracelet.rotation.x = Math.PI / 2;
  bracelet.castShadow = true;
  group.add(bracelet);
}

/**
 * Add bag to character
 */
function addBag(group: THREE.Group, body: THREE.Mesh) {
  const bagGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.08);
  const bagMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.5,
    metalness: 0.1,
  });
  const bag = new THREE.Mesh(bagGeometry, bagMaterial);
  bag.position.copy(body.position);
  bag.position.x += 0.15;
  bag.position.y -= 0.05;
  bag.castShadow = true;
  bag.receiveShadow = true;
  group.add(bag);
}

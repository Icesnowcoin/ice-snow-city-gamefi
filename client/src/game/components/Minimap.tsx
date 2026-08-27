import React, { useRef, useEffect, useState } from 'react';
import { MinimapManager, MinimapMarker } from '../map/MinimapManager';
import '../styles/minimap.css';

interface MinimapProps {
  minimapManager: MinimapManager;
  onLocationClick?: (worldX: number, worldZ: number) => void;
  showLegend?: boolean;
  showGrid?: boolean;
}

/**
 * 小地图 React 组件
 * 显示农业区的 2D 俯视图，实时跟踪相机位置，支持点击快速跳转
 */
export const Minimap: React.FC<MinimapProps> = ({
  minimapManager,
  onLocationClick,
  showLegend = true,
  showGrid = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [markers, setMarkers] = useState<MinimapMarker[]>([]);
  const [cameraPos, setCameraPos] = useState({ x: 0, z: 0, rotation: 0 });

  const config = minimapManager.getConfig();

  // 绘制小地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // 绘制地图边界
    drawMapBounds(ctx, canvas.width, canvas.height);

    // 绘制标记
    markers.forEach((marker) => {
      drawMarker(ctx, marker, canvas.width, canvas.height);
    });

    // 绘制相机位置和视锥
    drawCamera(ctx, cameraPos, canvas.width, canvas.height);

    // 绘制图例
    if (showLegend) {
      drawLegend(ctx);
    }
  }, [markers, cameraPos, showGrid, showLegend, config]);

  // 绘制网格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;

    const gridSize = 20;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // 绘制地图边界
  const drawMapBounds = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#4a9d6f';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  };

  // 绘制标记
  const drawMarker = (
    ctx: CanvasRenderingContext2D,
    marker: MinimapMarker,
    width: number,
    height: number
  ) => {
    const pos = minimapManager.worldToMinimap(marker.x, marker.z);

    // 检查是否在小地图范围内
    if (pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height) {
      return;
    }

    // 根据类型设置颜色
    let color = '#ffffff';
    let shape = 'circle';

    switch (marker.type) {
      case 'building':
        color = '#ff6b6b';
        shape = 'square';
        break;
      case 'vegetation':
        color = '#51cf66';
        shape = 'circle';
        break;
      case 'poi':
        color = '#ffd93d';
        shape = 'star';
        break;
      case 'player':
        color = '#4ecdc4';
        shape = 'triangle';
        break;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    const radius = marker.radius || 3;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'square') {
      ctx.fillRect(pos.x - radius, pos.y - radius, radius * 2, radius * 2);
      ctx.strokeRect(pos.x - radius, pos.y - radius, radius * 2, radius * 2);
    } else if (shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - radius);
      ctx.lineTo(pos.x + radius, pos.y + radius);
      ctx.lineTo(pos.x - radius, pos.y + radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'star') {
      drawStar(ctx, pos.x, pos.y, 5, radius, radius * 0.5);
    }
  };

  // 绘制五角星
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;

      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // 绘制相机
  const drawCamera = (
    ctx: CanvasRenderingContext2D,
    cameraPos: { x: number; z: number; rotation: number },
    width: number,
    height: number
  ) => {
    const pos = minimapManager.worldToMinimap(cameraPos.x, cameraPos.z);

    // 检查是否在小地图范围内
    if (pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height) {
      return;
    }

    // 绘制相机位置
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 绘制相机方向指示器
    const directionLength = 15;
    const dirX = pos.x + Math.cos(cameraPos.rotation) * directionLength;
    const dirY = pos.y + Math.sin(cameraPos.rotation) * directionLength;

    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(dirX, dirY);
    ctx.stroke();

    // 绘制视锥
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
    ctx.fillStyle = 'rgba(78, 205, 196, 0.1)';
    ctx.lineWidth = 1;

    const viewDistance = 30;
    const viewAngle = Math.PI / 3; // 60度视角

    const angle1 = cameraPos.rotation - viewAngle / 2;
    const angle2 = cameraPos.rotation + viewAngle / 2;

    const p1 = minimapManager.worldToMinimap(
      cameraPos.x + viewDistance * Math.cos(angle1),
      cameraPos.z + viewDistance * Math.sin(angle1)
    );
    const p2 = minimapManager.worldToMinimap(
      cameraPos.x + viewDistance * Math.cos(angle2),
      cameraPos.z + viewDistance * Math.sin(angle2)
    );

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // 绘制图例
  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const legendX = 10;
    const legendY = config.height - 100;
    const legendWidth = 150;
    const legendHeight = 90;

    // 背景
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // 边框
    ctx.strokeStyle = '#4a9d6f';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // 文本
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';

    const items = [
      { label: '建筑', color: '#ff6b6b' },
      { label: '植被', color: '#51cf66' },
      { label: 'POI', color: '#ffd93d' },
      { label: '玩家', color: '#4ecdc4' },
    ];

    items.forEach((item, index) => {
      const y = legendY + 15 + index * 18;

      // 颜色块
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX + 10, y, 10, 10);

      // 标签
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.label, legendX + 25, y + 9);
    });
  };

  // 处理画布点击
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onLocationClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const worldPos = minimapManager.minimapToWorld(x, y);
    onLocationClick(worldPos.x, worldPos.z);
  };

  // 更新标记和相机位置
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setMarkers([...minimapManager.getMarkers()]);
      setCameraPos(minimapManager.getCameraPosition());
    }, 100);

    return () => clearInterval(updateInterval);
  }, [minimapManager]);

  return (
    <div className="minimap-container">
      <div className="minimap-header">
        <h3>小地图</h3>
      </div>
      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        className="minimap-canvas"
        onClick={handleCanvasClick}
        title="点击快速跳转到该位置"
      />
    </div>
  );
};

export default Minimap;

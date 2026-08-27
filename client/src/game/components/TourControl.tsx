import React, { useState, useEffect, useRef } from 'react';
import { AutoTourController } from '../tour/AutoTourController';
import { TourRouteManager, TourRoute } from '../tour/TourRouteManager';
import { TourState } from '../tour/AutoTourController';
import '../styles/tour-control.css';

/**
 * 导覍控制 UI 组件属性
 */
interface TourControlProps {
  tourController: AutoTourController | null;
  tourRouteManager: TourRouteManager | null;
  onTourStateChange?: (state: TourState) => void;
}

/**
 * 导覍控制 UI 组件
 * 提供导覍模式的启动、暂停、恢复、停止控制
 */
export const TourControl: React.FC<TourControlProps> = ({
  tourController,
  tourRouteManager,
  onTourStateChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tourState, setTourState] = useState<TourState>(TourState.IDLE);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [routes, setRoutes] = useState<TourRoute[]>([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化路线列表
  useEffect(() => {
    if (tourRouteManager) {
      const allRoutes = tourRouteManager.getRoutes();
      setRoutes(allRoutes);
      if (allRoutes.length > 0) {
        setSelectedRoute(allRoutes[0].id);
      }
    }
  }, [tourRouteManager]);

  // 设置导覍事件回调
  useEffect(() => {
    if (!tourController) return;

    tourController.setCallbacks({
      onTourStart: (route) => {
        setTourState(TourState.PLAYING);
        setTotalPoints(route.points.length);
        setTotalDuration(route.totalDuration);
        onTourStateChange?.(TourState.PLAYING);
      },
      onTourStop: () => {
        setTourState(TourState.STOPPED);
        setCurrentPointIndex(0);
        setProgress(0);
        onTourStateChange?.(TourState.STOPPED);
      },
      onTourPause: () => {
        setTourState(TourState.PAUSED);
        onTourStateChange?.(TourState.PAUSED);
      },
      onTourResume: () => {
        setTourState(TourState.PLAYING);
        onTourStateChange?.(TourState.PLAYING);
      },
      onPointStart: (point, index) => {
        setCurrentPointIndex(index);
      },
      onProgressUpdate: (currentProgress, total) => {
        setProgress(currentProgress);
        setTotalDuration(total);
      },
    });

    // 启动定期更新
    updateIntervalRef.current = setInterval(() => {
      const state = tourController.getState();
      setTourState(state);
      setCurrentPointIndex(tourController.getCurrentPointIndex());
    }, 100);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [tourController, onTourStateChange]);

  const handleStartTour = () => {
    if (tourController && selectedRoute) {
      tourController.startTour(selectedRoute);
    }
  };

  const handleStopTour = () => {
    if (tourController) {
      tourController.stopTour();
    }
  };

  const handlePauseTour = () => {
    if (tourController) {
      tourController.pauseTour();
    }
  };

  const handleResumeTour = () => {
    if (tourController) {
      tourController.resumeTour();
    }
  };

  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoute(e.target.value);
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (progress / totalDuration) * 100 : 0;

  return (
    <div className="tour-control-container">
      {/* 导覍控制按钮 */}
      <button
        className="tour-control-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title="自动导覍"
      >
        🎬
      </button>

      {/* 导覍控制面板 */}
      {isExpanded && (
        <div className="tour-control-panel">
          <div className="tour-control-header">
            <h3>🎬 自动导覍</h3>
            <button
              className="tour-control-close"
              onClick={() => setIsExpanded(false)}
              title="关闭"
            >
              ✕
            </button>
          </div>

          {/* 路线选择 */}
          <div className="tour-control-section">
            <label>选择导覍路线:</label>
            <select
              value={selectedRoute}
              onChange={handleRouteChange}
              disabled={tourState === TourState.PLAYING || tourState === TourState.PAUSED}
              className="tour-route-select"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name} ({route.points.length} 个点)
                </option>
              ))}
            </select>
          </div>

          {/* 路线信息 */}
          {selectedRoute && tourRouteManager && (
            <div className="tour-control-section">
              <div className="tour-info">
                <p>
                  <strong>路线描述:</strong>{' '}
                  {tourRouteManager.getRoute(selectedRoute)?.description}
                </p>
                <p>
                  <strong>总时长:</strong>{' '}
                  {formatTime(tourRouteManager.getRouteDuration(selectedRoute) * 1000)}
                </p>
                <p>
                  <strong>景点数:</strong>{' '}
                  {tourRouteManager.getRoutePointCount(selectedRoute)}
                </p>
              </div>
            </div>
          )}

          {/* 导覍状态 */}
          <div className="tour-control-section">
            <div className="tour-status">
              <p>
                <strong>状态:</strong>{' '}
                <span className={`status-${tourState}`}>
                  {tourState === TourState.IDLE && '就绪'}
                  {tourState === TourState.PLAYING && '播放中'}
                  {tourState === TourState.PAUSED && '已暂停'}
                  {tourState === TourState.STOPPED && '已停止'}
                </span>
              </p>
              {(tourState === TourState.PLAYING || tourState === TourState.PAUSED) && (
                <>
                  <p>
                    <strong>当前景点:</strong> {currentPointIndex + 1} / {totalPoints}
                  </p>
                  <p>
                    <strong>进度:</strong> {formatTime(progress)} / {formatTime(totalDuration)}
                  </p>
                  <div className="tour-progress-bar">
                    <div
                      className="tour-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="tour-control-buttons">
            {tourState === TourState.IDLE && (
              <button
                className="tour-btn tour-btn-start"
                onClick={handleStartTour}
                disabled={!selectedRoute}
              >
                ▶ 开始导覍
              </button>
            )}

            {tourState === TourState.PLAYING && (
              <>
                <button className="tour-btn tour-btn-pause" onClick={handlePauseTour}>
                  ⏸ 暂停
                </button>
                <button className="tour-btn tour-btn-stop" onClick={handleStopTour}>
                  ⏹ 停止
                </button>
              </>
            )}

            {tourState === TourState.PAUSED && (
              <>
                <button className="tour-btn tour-btn-resume" onClick={handleResumeTour}>
                  ▶ 继续
                </button>
                <button className="tour-btn tour-btn-stop" onClick={handleStopTour}>
                  ⏹ 停止
                </button>
              </>
            )}

            {tourState === TourState.STOPPED && (
              <button
                className="tour-btn tour-btn-start"
                onClick={handleStartTour}
                disabled={!selectedRoute}
              >
                ▶ 重新开始
              </button>
            )}
          </div>

          {/* 帮助信息 */}
          <div className="tour-control-help">
            <p>💡 提示: 点击"开始导覍"按钮，相机将自动平滑地在各个景点之间巡游。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourControl;

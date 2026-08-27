import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Volume2, VolumeX, Gamepad2 } from 'lucide-react';
import { useViewportDimensions } from '@/hooks/useMobilePerformance';

interface MobileGameHubProps {
  onGameSelect: (gameType: string) => void;
}

export default function MobileGameHub({ onGameSelect }: MobileGameHubProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [displayTime, setDisplayTime] = useState('00:00');
  const viewport = useViewportDimensions();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDisplayTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const games = [
    { id: 'rts', name: 'RTS World', icon: Gamepad2, description: 'Build and manage your city' },
    { id: 'farming', name: 'Farming', icon: Gamepad2, description: 'Grow crops and harvest' },
    { id: 'trading', name: 'Trading', icon: Gamepad2, description: 'Buy and sell items' },
    { id: 'mining', name: 'Mining', icon: Gamepad2, description: 'Extract valuable resources' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pb-20">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-900 bg-opacity-95 border-b border-blue-500 p-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-blue-400">ISC</h1>
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-mono text-xs">{displayTime}</span>
            </div>
          </div>
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="sm"
            className="p-2 h-9 w-9"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-blue-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-900 to-purple-900 border-blue-500 p-4">
          <h2 className="text-lg font-bold text-blue-200 mb-2">Welcome to Ice Snow City</h2>
          <p className="text-blue-100 text-sm">
            Choose a game mode to start playing. Each mode offers unique challenges and rewards.
          </p>
        </Card>

        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-3">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card
                key={game.id}
                className="bg-slate-800 border-blue-500 hover:border-blue-400 cursor-pointer transition-all active:scale-95 p-3"
                onClick={() => onGameSelect(game.id)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Icon className="w-8 h-8 text-blue-400" />
                  <h3 className="text-sm font-semibold text-blue-200">{game.name}</h3>
                  <p className="text-xs text-blue-300 line-clamp-2">{game.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Game Tips */}
        <Card className="bg-slate-800 border-blue-500 p-3">
          <h3 className="text-sm font-semibold text-blue-200 mb-2">💡 Tips</h3>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Tap and hold to select buildings</li>
            <li>• Swipe to pan around the map</li>
            <li>• Pinch to zoom in/out</li>
            <li>• Use bottom menu to switch games</li>
          </ul>
        </Card>

        {/* Performance Info */}
        {viewport.width < 640 && (
          <Card className="bg-slate-800 border-green-500 p-3">
            <p className="text-xs text-green-300">
              📱 Optimized for mobile • {viewport.width}x{viewport.height} • {viewport.isPortrait ? 'Portrait' : 'Landscape'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

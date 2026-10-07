import { useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export type NetworkQuality = "measuring" | "good" | "fair" | "weak" | "offline";

type NavigatorConnection = {
  rtt?: number;
  effectiveType?: string;
  downlink?: number;
};

interface NetworkStatusIndicatorProps {
  lang?: string;
  probeIntervalMs?: number;
}

interface NetworkState {
  quality: NetworkQuality;
  ping: number | null;
  effectiveType: string | null;
}

const SIGNAL_BARS: Record<NetworkQuality, number> = {
  measuring: 1,
  good: 4,
  fair: 3,
  weak: 2,
  offline: 0,
};

function getConnection(): NavigatorConnection | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NavigatorConnection }).connection;
}

export function classifyPing(ping: number): Exclude<NetworkQuality, "measuring" | "offline"> {
  if (ping <= 120) return "good";
  if (ping <= 260) return "fair";
  return "weak";
}

function getInitialState(): NetworkState {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { quality: "offline", ping: null, effectiveType: null };
  }

  return {
    quality: "measuring",
    ping: null,
    effectiveType: getConnection()?.effectiveType ?? null,
  };
}

export default function NetworkStatusIndicator({
  lang = "zh",
  probeIntervalMs = 3_000,
}: NetworkStatusIndicatorProps) {
  const isChinese = lang === "zh";
  const [network, setNetwork] = useState<NetworkState>(getInitialState);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let disposed = false;
    let nextProbeTimer: number | undefined;
    let timeoutTimer: number | undefined;
    let activeController: AbortController | undefined;

    const updateOffline = () => {
      if (!disposed) {
        setNetwork({
          quality: "offline",
          ping: null,
          effectiveType: getConnection()?.effectiveType ?? null,
        });
      }
    };

    const probe = async () => {
      if (disposed) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        updateOffline();
      } else {
        activeController?.abort();
        activeController = new AbortController();
        const startedAt = performance.now();
        timeoutTimer = window.setTimeout(() => activeController?.abort(), 2_500);

        try {
          await fetch(`${window.location.origin}/?network_probe=${Date.now()}`, {
            method: "HEAD",
            cache: "no-store",
            credentials: "same-origin",
            signal: activeController.signal,
          });
          const ping = Math.max(1, Math.round(performance.now() - startedAt));
          if (!disposed) {
            setNetwork({
              quality: classifyPing(ping),
              ping,
              effectiveType: getConnection()?.effectiveType ?? null,
            });
          }
        } catch {
          const hintedPing = getConnection()?.rtt;
          if (!disposed) {
            setNetwork({
              quality: navigator.onLine === false ? "offline" : "weak",
              ping: hintedPing && hintedPing > 0 ? Math.round(hintedPing) : null,
              effectiveType: getConnection()?.effectiveType ?? null,
            });
          }
        } finally {
          if (timeoutTimer !== undefined) window.clearTimeout(timeoutTimer);
          timeoutTimer = undefined;
          if (!disposed) {
            nextProbeTimer = window.setTimeout(() => void probe(), probeIntervalMs);
          }
        }
      }
    };

    const handleOnline = () => void probe();
    const handleOffline = updateOffline;
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void probe();

    return () => {
      disposed = true;
      activeController?.abort();
      if (nextProbeTimer !== undefined) window.clearTimeout(nextProbeTimer);
      if (timeoutTimer !== undefined) window.clearTimeout(timeoutTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [probeIntervalMs]);

  const bars = SIGNAL_BARS[network.quality];
  const qualityText = useMemo(() => {
    if (network.quality === "offline") return isChinese ? "无网络" : "OFFLINE";
    if (network.quality === "measuring") return isChinese ? "检测中" : "CHECKING";
    if (network.quality === "good") return isChinese ? "网络良好" : "GOOD";
    if (network.quality === "fair") return isChinese ? "网络一般" : "FAIR";
    return isChinese ? "网络较弱" : "WEAK";
  }, [isChinese, network.quality]);

  const pingText = network.ping === null ? "--" : `${network.ping}ms`;
  const ariaLabel = isChinese
    ? `网络状态：${qualityText}，Ping ${pingText}`
    : `Network status: ${qualityText}, ping ${pingText}`;

  return (
    <div
      className={`isc-network-status isc-network-status--${network.quality}`}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      onClick={() => setIsExpanded((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setIsExpanded((current) => !current);
        }
      }}
      tabIndex={0}
    >
      {network.quality === "offline" ? (
        <WifiOff className="isc-network-status__icon" aria-hidden="true" />
      ) : (
        <Wifi className="isc-network-status__icon" aria-hidden="true" />
      )}
      <span className="isc-network-status__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={`isc-network-status__bar${bar <= bars ? " is-active" : ""}`}
            style={{ height: `${bar * 0.2 + 0.2}rem` }}
          />
        ))}
      </span>
      <span className="isc-network-status__summary">
        <strong>{pingText}</strong>
        <small>{qualityText}</small>
      </span>
      {isExpanded && (
        <span className="isc-network-status__details">
          {network.effectiveType
            ? `${isChinese ? "网络类型" : "Type"}: ${network.effectiveType}`
            : isChinese
              ? "正在通过城市节点检测"
              : "Checking through city node"}
        </span>
      )}
    </div>
  );
}

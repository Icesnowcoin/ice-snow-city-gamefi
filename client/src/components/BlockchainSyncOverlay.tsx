import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BlockchainSyncOverlayProps {
  isVisible: boolean;
  status: "syncing" | "success" | "error";
  message?: string;
  onClose?: () => void;
  autoCloseDelay?: number;
}

export const BlockchainSyncOverlay: React.FC<BlockchainSyncOverlayProps> = ({
  isVisible,
  status,
  message,
  onClose,
  autoCloseDelay = 3000,
}) => {
  const [shouldShow, setShouldShow] = useState(isVisible);

  useEffect(() => {
    setShouldShow(isVisible);

    if (isVisible && status !== "syncing" && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        setShouldShow(false);
        onClose?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, status, autoCloseDelay, onClose]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          {/* Background blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            onClick={() => {
              setShouldShow(false);
              onClose?.();
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative bg-white rounded-lg shadow-2xl p-8 max-w-sm mx-4 pointer-events-auto"
          >
            {status === "syncing" && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-blue-600"
                >
                  <Loader className="w-12 h-12" />
                </motion.div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">同步到区块链</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {message || "正在处理您的交易，请稍候..."}
                  </p>
                </div>

                {/* Loading bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  </motion.div>
                </motion.div>

                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">同步成功！</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {message || "您的交易已确认"}
                  </p>
                </div>

                {/* Success checkmark animation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-green-600 font-medium mt-2"
                >
                  ✓ 交易已记录到区块链
                </motion.div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <AlertCircle className="w-16 h-16 text-red-500" />
                </motion.div>

                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">同步失败</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {message || "交易处理出错，请重试"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShouldShow(false);
                    onClose?.();
                  }}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                >
                  关闭
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BlockchainSyncOverlay;

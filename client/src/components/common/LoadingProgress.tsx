"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingProgressProps {
  isLoading: boolean;
  message?: string;
  minDuration?: number;
}

const LoadingProgress = ({
  isLoading,
  message = "Memuat...",
  minDuration = 500,
}: LoadingProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(message);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(0);
      setLoadingMessage(message);

      const messages = [
        message,
        "⏳ Menyiapkan data...",
        "⚙️ Memproses permintaan...",
        "✨ Hampir selesai...",
      ];
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 800);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return Math.min(prev + Math.random() * 15, 90);
        });
      }, 200);

      return () => {
        clearInterval(interval);
        clearInterval(messageInterval);
      };
    } else {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, minDuration);
    }
  }, [isLoading, message, minDuration]);

  if (!isVisible && !isLoading) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-80 text-center"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-600 rounded-full animate-spin border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-pink-600">
                  {Math.floor(progress)}%
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-linear-to-r from-pink-500 to-pink-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <motion.p
              key={loadingMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-600 dark:text-gray-300 text-sm"
            >
              {loadingMessage}
            </motion.p>

            <p className="text-xs text-gray-400 mt-4">
              💡 Tahukah Anda? Fusion Heart melayani pengiriman ke seluruh
              Jabodetabek!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingProgress;

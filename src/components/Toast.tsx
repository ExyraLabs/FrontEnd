import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: "success" | "error";
  position?: "top" | "bottom";
}

const Toast: React.FC<ToastProps> = ({
  isVisible,
  message,
  type = "success",
  position = "top",
}) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? "/icons/copy.svg" : "/icons/close.svg";
  const positionClass = position === "top" ? "top-4" : "bottom-4";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -50 : 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -30 : 30, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            duration: 0.4,
          }}
          className={`fixed ${positionClass} left-1/2 transform -translate-x-1/2 z-50 pointer-events-none`}
        >
          <div
            className={`${bgColor} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[140px] justify-center backdrop-blur-sm bg-opacity-90`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              <Image
                src={icon}
                alt={type}
                width={16}
                height={16}
                className="filter brightness-0 invert"
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-medium"
            >
              {message}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

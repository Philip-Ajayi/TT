// components/Button.tsx
"use client";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Button({ children, onClick, className = "" }: ButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`bg-[#C75B12] hover:bg-[#A8430C] text-white px-6 py-3 font-semibold transition-colors duration-200 tracking-wide inline-flex items-center justify-center whitespace-nowrap ${className}`}
    >
      {children}
    </motion.button>
  );
}
"use client";

import { motion } from "framer-motion";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthCard = ({ title, subtitle, children }: AuthCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card bg-base-100 shadow-xl w-full max-w-md"
    >
      <div className="card-body">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary font-lobster">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-base-content/60 mt-1">{subtitle}</p>
          )}
          <div className="divider my-2"></div>
        </div>
        {children}
      </div>
    </motion.div>
  );
};

export default AuthCard;

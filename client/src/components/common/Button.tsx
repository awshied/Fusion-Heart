"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      icon,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles = "btn rounded-lg transition-all duration-200 gap-2";

    const variants: Record<string, string> = {
      primary: "btn-primary text-primary-content",
      secondary: "btn-secondary text-secondary-content",
      outline: "btn-outline",
      ghost: "btn-ghost",
      danger: "btn-error text-error-content",
    };

    const sizes: Record<string, string> = {
      sm: "btn-sm",
      md: "btn-md",
      lg: "btn-lg",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && icon && <span className="mr-1">{icon}</span>}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

export default Button;

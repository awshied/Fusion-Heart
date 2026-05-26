"use client";

import {
  useState,
  useEffect,
  forwardRef,
  FocusEvent,
  ReactNode,
  ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";

interface FloatingInputProps {
  id: string;
  name: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "textarea";
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  success?: boolean;
  icon?: ReactNode;
  rows?: number;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
}

type InputElement = HTMLInputElement | HTMLTextAreaElement;

const FloatingInput = forwardRef<InputElement, FloatingInputProps>(
  (
    {
      id,
      name,
      type = "text",
      label,
      value,
      defaultValue,
      placeholder,
      required = false,
      disabled = false,
      readOnly = false,
      error,
      success,
      icon,
      rows = 3,
      onChange,
      onBlur,
      className = "",
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(
      value || defaultValue || "",
    );

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const isActive = isFocused || internalValue.length > 0;
    const inputType = type === "password" && showPassword ? "text" : type;
    const isTextarea = type === "textarea";

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (
      e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };
    const handleChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setInternalValue(e.target.value);
      if (onChange) onChange(e);
    };

    const commonProps = {
      id,
      name,
      value: internalValue,
      defaultValue,
      placeholder: placeholder || (isActive ? label : ""),
      required,
      disabled,
      readOnly,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      className: `
        w-full px-3 py-3 rounded-lg border-2 bg-white dark:bg-gray-800
        transition-all duration-200 outline-none
        ${isTextarea ? "resize-none" : ""}
        ${icon ? "pl-10" : ""}
        ${isActive ? "pt-5 pb-2" : "py-3"}
        ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : success
              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
              : "border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
        }
        ${disabled ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""}
      `,
    };

    return (
      <div className={`relative mb-6 ${className}`}>
        <div className="relative">
          <motion.label
            htmlFor={id}
            className={`absolute left-3 transition-all cursor-text z-10 ${
              isActive
                ? "-top-2.5 text-xs px-1 bg-white dark:bg-gray-800 text-pink-600"
                : "top-3 text-gray-500 dark:text-gray-400"
            } ${disabled ? "opacity-50" : ""} ${error ? "text-red-500" : ""}`}
            initial={false}
            animate={{
              y: isActive ? -12 : 0,
              scale: isActive ? 0.85 : 1,
            }}
            onClick={() => document.getElementById(id)?.focus()}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </motion.label>

          {isTextarea ? (
            <textarea
              {...commonProps}
              rows={rows}
              ref={ref as React.Ref<HTMLTextAreaElement>}
            />
          ) : (
            <input
              {...commonProps}
              type={inputType}
              ref={ref as React.Ref<HTMLInputElement>}
            />
          )}

          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          {type === "password" && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check size={18} />
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <X size={18} />
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 mt-1 text-red-500 text-sm"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 mt-1 text-green-500 text-sm"
            >
              <Check size={14} />
              <span>Valid</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FloatingInput.displayName = "FloatingInput";

export default FloatingInput;

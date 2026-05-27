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
      required,
      disabled,
      readOnly,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      className: `
        w-full px-3 py-3 rounded-lg border-2 bg-base-300 dark:bg-base-200 transition-all duration-300 outline-none
        ${isTextarea ? "resize-none" : ""}
        ${icon ? "pl-10" : ""}
        ${
          error
            ? "border-error focus:border-error focus:ring-error/20"
            : success
              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
              : "border-base-content/50 focus:border-base-content focus:ring-2 focus:ring-base-content/20"
        }
        ${disabled ? "opacity-70 cursor-not-allowed" : ""}
      `,
    };

    return (
      <div className={`relative mb-6 ${className}`}>
        <div className="relative">
          <motion.label
            htmlFor={id}
            className={`absolute transition-all top-3 font-semibold left-10 cursor-text z-10 ${
              isActive ? "text-transparent" : "text-base-content"
            } ${disabled ? "opacity-50" : ""} ${error ? "text-error" : ""}`}
            initial={false}
            onClick={() => document.getElementById(id)?.focus()}
          >
            {label}
            {required && (
              <span
                className={`${isActive ? "text-transparent" : "text-base-content ml-0.5"}`}
              >
                *
              </span>
            )}
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
            <div className="absolute left-3 top-1/2 -translate-y-1/2 ">
              {icon}
            </div>
          )}

          {type === "password" && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content hover:text-base-content/70 z-10"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content">
              <Check size={18} />
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
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
              className="flex items-center gap-1 mt-1 text-error text-sm"
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
              className="flex items-center gap-1 mt-1 text-base-content text-sm"
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

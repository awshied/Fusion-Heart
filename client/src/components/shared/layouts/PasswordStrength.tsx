"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const [requirements, setRequirements] = useState<Requirement[]>([
    { label: "Minimal 8 karakter", regex: /.{8,}/, met: false },
    { label: "Huruf besar (A-Z)", regex: /[A-Z]/, met: false },
    { label: "Huruf kecil (a-z)", regex: /[a-z]/, met: false },
    { label: "Angka (0-9)", regex: /[0-9]/, met: false },
    {
      label: "Karakter spesial (!@#$%)",
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      met: false,
    },
  ]);

  useEffect(() => {
    setRequirements((prev) =>
      prev.map((req) => ({
        ...req,
        met: req.regex.test(password),
      })),
    );
  }, [password]);

  const metCount = requirements.filter((r) => r.met).length;
  const strength = (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength <= 20) return "bg-error";
    if (strength <= 40) return "bg-warning";
    if (strength <= 60) return "bg-info";
    if (strength <= 80) return "bg-primary";
    return "bg-success";
  };

  const getStrengthText = () => {
    if (strength <= 20) return "Sangat Lemah";
    if (strength <= 40) return "Lemah";
    if (strength <= 60) return "Sedang";
    if (strength <= 80) return "Kuat";
    return "Sangat Kuat";
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-base-content/60">Kekuatan Password</span>
          <span
            className={`font-medium ${getStrengthColor().replace("bg-", "text-")}`}
          >
            {getStrengthText()}
          </span>
        </div>
        <div className="h-1.5 w-full bg-base-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStrengthColor()} transition-all duration-300`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 ${
              req.met ? "text-success" : "text-base-content/40"
            }`}
          >
            {req.met ? <Check size={12} /> : <X size={12} />}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;

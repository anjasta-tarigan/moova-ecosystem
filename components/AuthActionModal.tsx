import React from "react";
import { LogIn, ShieldCheck, UserPlus, X } from "lucide-react";
import Button from "./Button";

type AuthActionModalProps = {
  isOpen: boolean;
  actionLabel: string;
  onClose: () => void;
  onLogin: () => void;
  onJoin: () => void;
};

const AuthActionModal: React.FC<AuthActionModalProps> = ({
  isOpen,
  actionLabel,
  onClose,
  onLogin,
  onJoin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-linear-to-r from-primary-900 to-primary-700 px-6 pb-8 pt-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25"
          >
            <X size={16} />
          </button>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck size={12} /> Restricted Action
          </span>
          <h3 className="mt-4 text-2xl font-bold leading-tight">
            Login required for {actionLabel}
          </h3>
          <p className="mt-2 text-sm text-primary-100">
            Continue with your account to keep your progress and interact with
            event features securely.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <Button type="button" fullWidth onClick={onLogin} className="gap-2">
            <LogIn size={16} /> Log In
          </Button>
          <Button
            type="button"
            fullWidth
            variant="outline"
            onClick={onJoin}
            className="gap-2"
          >
            <UserPlus size={16} /> Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthActionModal;

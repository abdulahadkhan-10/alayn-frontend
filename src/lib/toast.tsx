import React from "react";
import { toast, ToastOptions } from "react-toastify";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface ToastProps {
  title: string;
  message?: string;
  type: "success" | "error" | "info" | "warning";
}

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  icon: false, // We render our own icon inside the component
};

const accentBar: Record<string, string> = {
  success: "bg-emerald-500",
  error:   "bg-[#D3232A]",
  info:    "bg-sky-500",
  warning: "bg-amber-500",
};

const iconConfig = {
  success: {
    Icon: CheckCircle2,
    pill: "bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600",
  },
  error: {
    Icon: AlertCircle,
    pill: "bg-rose-50 ring-1 ring-rose-200 text-[#D3232A]",
  },
  info: {
    Icon: Info,
    pill: "bg-sky-50 ring-1 ring-sky-200 text-sky-600",
  },
  warning: {
    Icon: AlertTriangle,
    pill: "bg-amber-50 ring-1 ring-amber-200 text-amber-600",
  },
};

const ToastContent: React.FC<ToastProps> = ({ title, message, type }) => {
  const { Icon, pill } = iconConfig[type];
  const bar = accentBar[type];

  return (
    <div className="flex flex-col">
      {/* Thin accent top bar */}
      <div className={`h-[3px] w-full ${bar} rounded-t-[14px]`} />

      {/* Main content row */}
      <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
        {/* Icon pill */}
        <div className={`w-8 h-8 rounded-xl ${pill} flex items-center justify-center shrink-0 mt-[1px]`}>
          <Icon className="w-[15px] h-[15px] stroke-2" />
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0 space-y-[3px] pt-[1px]">
          <p className="text-[13.5px] font-semibold leading-snug tracking-[-0.01em]" style={{ color: "#0F172A" }}>
            {title}
          </p>
          {message && (
            <p className="text-[12px] font-normal leading-relaxed break-words" style={{ color: "#64748B" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const showToast = {
  success: (title: string, message?: string, options?: ToastOptions) =>
    toast.success(
      <ToastContent title={title} message={message} type="success" />,
      { toastId: options?.toastId || `success-${title}-${message || ""}`, ...defaultOptions, ...options }
    ),

  error: (title: string, message?: string, options?: ToastOptions) =>
    toast.error(
      <ToastContent title={title} message={message} type="error" />,
      { toastId: options?.toastId || `error-${title}-${message || ""}`, ...defaultOptions, ...options }
    ),

  info: (title: string, message?: string, options?: ToastOptions) =>
    toast.info(
      <ToastContent title={title} message={message} type="info" />,
      { toastId: options?.toastId || `info-${title}-${message || ""}`, ...defaultOptions, ...options }
    ),

  warning: (title: string, message?: string, options?: ToastOptions) =>
    toast.warning(
      <ToastContent title={title} message={message} type="warning" />,
      { toastId: options?.toastId || `warning-${title}-${message || ""}`, ...defaultOptions, ...options }
    ),
};

// app/components/alert-message/alert-message.tsx
import { AlertTriangle, CheckCircle, X, Info } from "lucide-react";
import { useState, useEffect } from "react";

export default function AlertMessage({
  type,
  message,
  autoHide = true,
  hideAfter = 5000,
  onHide
}: {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  autoHide?: boolean;
  hideAfter?: number;
  onHide?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const configs = {
    error: {
      containerClasses: 'bg-red-50 border border-red-200 text-red-700',
      iconClasses: 'text-red-400',
      progressClasses: 'bg-red-400',
      icon: AlertTriangle
    },
    success: {
      containerClasses: 'bg-green-50 border border-green-200 text-green-700',
      iconClasses: 'text-green-400',
      progressClasses: 'bg-green-400',
      icon: CheckCircle
    },
    warning: {
      containerClasses: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
      iconClasses: 'text-yellow-400',
      progressClasses: 'bg-yellow-400',
      icon: AlertTriangle
    },
    info: {
      containerClasses: 'bg-blue-50 border border-blue-200 text-blue-700',
      iconClasses: 'text-blue-400',
      progressClasses: 'bg-blue-400',
      icon: Info
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (hideAfter / 100));
        return Math.max(0, newProgress);
      });
    }, 100);

    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onHide?.();
    }, hideAfter);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hideTimer);
    };
  }, [autoHide, hideAfter, onHide]);

  const handleClose = () => {
    setIsVisible(false);
    onHide?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`mb-6 relative overflow-hidden rounded-lg ${config.containerClasses} transition-all duration-300`}>
      {/* Progress bar */}
      {autoHide && (
        <div className="absolute top-0 left-0 h-1 bg-gray-200/30 w-full">
          <div
            className={`h-full ${config.progressClasses} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconClasses}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>

          {/* Close button */}
          <div className="ml-auto pl-3">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 ${config.iconClasses} hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors`}
            >
              <span className="sr-only">Fechar</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

// Componente para alertas/mensagens de estado
export default function AlertMessage({
  type,
  message,
  autoHide = true,
  hideAfter = 5000,
  onHide
}: {
  type: 'error' | 'success' | 'warning';
  message: string;
  autoHide?: boolean;
  hideAfter?: number;
  onHide?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const configs = {
    error: {
      bgColor: 'bg-red-50/80',
      borderColor: 'border-red-200/50',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      progressColor: 'bg-red-400',
      icon: AlertTriangle
    },
    success: {
      bgColor: 'bg-green-50/80',
      borderColor: 'border-green-200/50',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      progressColor: 'bg-green-400',
      icon: CheckCircle
    },
    warning: {
      bgColor: 'bg-yellow-50/80',
      borderColor: 'border-yellow-200/50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      progressColor: 'bg-yellow-400',
      icon: AlertTriangle
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
    <div className={`mb-6 relative overflow-hidden ${config.bgColor} backdrop-blur-sm border ${config.borderColor} rounded-xl transform transition-all duration-300 hover:scale-[1.01]`}>
      {/* Progress bar */}
      {autoHide && (
        <div className="absolute top-0 left-0 h-1 bg-gray-200/30">
          <div
            className={`h-full ${config.progressColor} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm ${config.textColor}`}>{message}</p>
          </div>

          {/* Close button */}
          <div className="ml-auto pl-3">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-300 transition-colors`}
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
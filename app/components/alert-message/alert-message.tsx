import { AlertTriangle, CheckCircle } from "lucide-react";

// Componente para alertas/mensagens de estado
export default function AlertMessage({ type, message }: { type: 'error' | 'success' | 'warning', message: string }) {
  const configs = {
    error: {
      bgColor: 'bg-red-50/80',
      borderColor: 'border-red-200/50',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      icon: AlertTriangle
    },
    success: {
      bgColor: 'bg-green-50/80',
      borderColor: 'border-green-200/50',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      icon: CheckCircle
    },
    warning: {
      bgColor: 'bg-yellow-50/80',
      borderColor: 'border-yellow-200/50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      icon: AlertTriangle
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`mb-6 p-4 ${config.bgColor} backdrop-blur-sm border ${config.borderColor} rounded-xl`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm ${config.textColor}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
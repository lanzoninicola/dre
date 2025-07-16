import { Link } from "@remix-run/react";
import { cn } from "../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode,
  cnContainer?: string
  variant?: "default" | "outline",
}

export function Button({ children, cnContainer, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={
        cn(
          "text-sm px-4 py-2 rounded-md flex items-center gap-2",
          variant === "default" && "bg-indigo-600 hover:bg-indigo-600 text-white font-medium ",
          variant === "outline" && "border border-indigo-600 hover:border-indigo-600 text-indigo-500 hover:text-indigo-600",
          cnContainer
        )
      }
      {...props}
    >
      {children}
    </button>
  )
}

interface LinkButtonProps extends ButtonProps {
  to: string,
}

export function LinkButton({ to, children, cnContainer, variant = "default" }: LinkButtonProps) {
  return (
    <Link
      to={to}

    >
      <Button cnContainer={cnContainer} variant={variant}>
        {children}
      </Button>
    </Link>
  )
}
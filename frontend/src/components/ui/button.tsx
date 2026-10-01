import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-light focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none rounded-[10px]";

  const variantStyles = {
    primary:
      "bg-accent text-bg hover:bg-accent-light box-ridge font-medium active:bg-accent-deep",
    secondary:
      "bg-transparent border border-border text-text hover:bg-surface-2 active:bg-surface-2/80",
    destructive:
      "bg-danger-bg text-danger hover:bg-danger/20 border border-danger/20",
    ghost: "bg-transparent text-muted hover:text-text hover:bg-surface-2",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs h-8 gap-1.5",
    md: "px-4 py-2 text-sm h-10 gap-2",
    lg: "px-6 py-2.5 text-base h-12 gap-2.5",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

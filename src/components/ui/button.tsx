import { clsx } from "clsx";
import { cloneElement, isValidElement } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "icon";
  asChild?: boolean;
};

const variants = {
  primary: "border-accent bg-accent text-white hover:bg-teal-800",
  secondary: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100"
};

export function Button({ className, variant = "primary", size = "default", asChild, children, ...props }: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "icon" ? "h-10 w-10 p-0 text-base" : "h-10 px-3",
    variants[variant],
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: clsx(classes, (children.props as { className?: string }).className),
      ...props
    } as React.Attributes);
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

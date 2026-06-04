import Link from "next/link";
import { Button } from "@/components/ui/button";

type IconButtonProps = {
  label: string;
  href?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

export function IconButton({
  label,
  href,
  children,
  disabled,
  onClick,
  type = "button"
}: IconButtonProps) {
  if (href) {
    return (
      <Button variant="ghost" size="icon" asChild title={label} aria-label={label}>
        <Link href={href}>
          {children}
          <span className="sr-only">{label}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type={type}
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

import { clsx } from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={clsx("rounded-lg border border-line bg-white p-4 shadow-sm", className)} {...props} />;
}

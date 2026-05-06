import { cn } from "./cn";

interface CardProps { children: React.ReactNode; className?: string; padding?: boolean; }
interface SectionProps { children: React.ReactNode; className?: string; }

export function Card({ children, className, padding = false }: CardProps) {
  return <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100", padding && "p-6", className)}>{children}</div>;
}
export function CardHeader({ children, className }: SectionProps) {
  return <div className={cn("px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4", className)}>{children}</div>;
}
export function CardBody({ children, className }: SectionProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}
export function CardFooter({ children, className }: SectionProps) {
  return <div className={cn("px-6 py-4 border-t border-gray-100 flex items-center gap-3", className)}>{children}</div>;
}

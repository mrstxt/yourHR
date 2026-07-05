import { cn } from "@/lib/utils";

interface AvatarBubbleProps {
  initials: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const colors = [
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-fuchsia-500",
  "from-cyan-500 to-sky-500",
];

function hash(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % colors.length;
}

export function AvatarBubble({ initials, className, size = "md" }: AvatarBubbleProps) {
  const sizeCls = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full font-semibold text-white bg-gradient-to-br shadow-soft",
      colors[hash(initials)], sizeCls, className
    )}>
      {initials}
    </div>
  );
}

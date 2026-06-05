import { cn } from "@/lib/utils";

interface ChipProps {
  children: React.ReactNode;
  color?: "ignite" | "crown" | "void" | "success" | "danger" | "haze";
  size?: "xs" | "sm";
  dot?: boolean;
  className?: string;
}

const colorMap: Record<NonNullable<ChipProps["color"]>, string> = {
  ignite:  "bg-ignite/10 border-ignite/30 text-ignite",
  crown:   "bg-crown/10 border-crown/30 text-crown",
  void:    "bg-void/10 border-void/30 text-void",
  success: "bg-success/10 border-success/30 text-success",
  danger:  "bg-danger/10 border-danger/30 text-danger",
  haze:    "bg-haze-3/20 border-haze-3/30 text-haze-2",
};

const dotColorMap: Record<NonNullable<ChipProps["color"]>, string> = {
  ignite:  "bg-ignite",
  crown:   "bg-crown",
  void:    "bg-void",
  success: "bg-success",
  danger:  "bg-danger",
  haze:    "bg-haze-2",
};

export function Chip({
  children,
  color = "haze",
  size = "sm",
  dot = false,
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-none font-space-mono",
        colorMap[color],
        size === "xs" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "inline-block rounded-full dot-live",
            size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2",
            dotColorMap[color]
          )}
        />
      )}
      {children}
    </span>
  );
}

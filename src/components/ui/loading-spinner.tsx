import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
};

const sizeMap: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "w-5 h-5 border",
  md: "w-8 h-8 border-2",
  lg: "w-10 h-10 border-2",
};

export function LoadingSpinner({
  label,
  size = "md",
  className,
  labelClassName,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} role="status" aria-live="polite">
      <div
        className={cn(
          "rounded-full border-stone-600 border-t-brand-red animate-spin",
          sizeMap[size],
        )}
        aria-hidden
      />
      {label ? (
        <p className={cn("text-stone-400 text-sm font-medium", labelClassName)}>{label}</p>
      ) : null}
    </div>
  );
}

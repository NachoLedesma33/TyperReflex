import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tooltip } from "radix-ui";

import { cn } from "@/lib/utils";

const toolBtnVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-mono whitespace-nowrap select-none outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        ghost: "text-typer-untyped hover:text-typer-correct hover:bg-accent/40",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-border/70 bg-background text-typer-untyped hover:text-typer-correct hover:bg-accent/40",
      },
      active: {
        true: "",
        false: "",
      },
      size: {
        sm: "px-3 py-1.5 text-xl",
        xs: "px-2.5 py-1 text-xs",
        icon: "size-9",
      },
    },
    compoundVariants: [
      {
        variant: "ghost",
        active: true,
        className:
          "bg-primary/10 text-primary shadow-[0_0_16px_-6px] shadow-primary/60",
      },
      {
        variant: "primary",
        active: true,
        className: "shadow-[0_0_16px_-4px] shadow-primary/50",
      },
      {
        variant: "outline",
        active: true,
        className:
          "border-primary/50 bg-primary/10 text-primary shadow-[0_0_16px_-6px] shadow-primary/60",
      },
    ],
    defaultVariants: {
      variant: "ghost",
      active: false,
      size: "sm",
    },
  }
);

const ICON_SIZE: Record<
  NonNullable<VariantProps<typeof toolBtnVariants>["size"]>,
  string
> = {
  sm: "size-4.5",
  xs: "size-3.5",
  icon: "size-5",
};

export function ToolBtn({
  variant,
  size,
  active = false,
  onClick,
  title,
  icon: Icon,
  ariaLabel,
  className,
  disabled,
  children,
}: {
  variant?: VariantProps<typeof toolBtnVariants>["variant"];
  size?: VariantProps<typeof toolBtnVariants>["size"];
  active?: boolean;
  onClick?: () => void;
  title?: string;
  icon?: React.ElementType;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const button = (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(toolBtnVariants({ variant, size, active }), className)}
    >
      {Icon && (
        <Icon
          className={cn(ICON_SIZE[size ?? "sm"], "shrink-0")}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );

  if (!title) return button;

  return (
    <Tooltip.Provider delayDuration={500} skipDelayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="z-50 rounded-md bg-popover px-2 py-1 font-mono text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {title}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

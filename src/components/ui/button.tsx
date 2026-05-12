import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const buttonVariants = (_?: { variant?: string; size?: string }) =>
  "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-black shadow hover:bg-blue-700 active:bg-blue-800 disabled:pointer-events-none disabled:opacity-50 transition-colors";

function Button({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-6 shadow-xl animate-fade-in",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="mb-4 space-y-1.5" {...props} />
);

export const DialogTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <DialogPrimitive.Title className="text-lg font-semibold leading-none" {...props} />
);

export const DialogDescription = (props: React.HTMLAttributes<HTMLParagraphElement>) => (
  <DialogPrimitive.Description className="text-sm text-muted-foreground" {...props} />
);
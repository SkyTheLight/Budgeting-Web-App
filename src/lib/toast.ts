"use client";

import { toast as sonnerToast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning";

export function toast(message: string, type: ToastType = "info") {
  switch (type) {
    case "success":
      sonnerToast.success(message);
      break;
    case "error":
      sonnerToast.error(message);
      break;
    case "warning":
      sonnerToast.warning(message);
      break;
    default:
      sonnerToast(message);
  }
}

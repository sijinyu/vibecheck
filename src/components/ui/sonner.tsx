"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      theme="dark"
      toastOptions={{
        className: "!bg-card !border-border/50 !text-foreground",
      }}
    />
  );
}

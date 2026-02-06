"use client";

import { useState, useCallback } from "react";
import { Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-xs";
};

const FEEDBACK_DURATION_MS = 2000;

export function CopyButton({ text, className, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), FEEDBACK_DURATION_MS);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }, [text]);

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn("shrink-0", className)}
      aria-label={copied ? "コピーしました" : "コピー"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400">コピーしました！</span>
        </>
      ) : (
        <>
          <Clipboard className="h-4 w-4" />
          <span className="hidden sm:inline">コピー</span>
        </>
      )}
    </Button>
  );
}

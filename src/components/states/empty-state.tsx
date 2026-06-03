"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox } from "lucide-react";

interface EmptyStateProps {
  className?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
  type?: "empty" | "error";
}

export function EmptyState({
  className,
  title,
  description,
  action,
  secondaryAction,
  type = "empty",
}: EmptyStateProps) {
  const Icon = type === "error" ? AlertCircle : Inbox;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 px-4 text-center",
        className,
      )}
      role="status"
    >
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <Button onClick={secondaryAction.onClick} size="sm" variant="outline">
          {secondaryAction.label}
        </Button>
      )}
    </div>
  );
}

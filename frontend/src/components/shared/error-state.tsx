import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api/client";

export function ErrorState({
  error,
  onRetry,
  title = "Could not load data",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message =
    error instanceof ApiRequestError
      ? error.message
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.";
  const code = error instanceof ApiRequestError ? error.code : null;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-confidence-low/20 bg-card px-6 py-14 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-confidence-low/10 text-confidence-low">
        <TriangleAlert className="size-5" />
      </span>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {code ? (
        <p className="font-mono text-xs text-muted-foreground">{code}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

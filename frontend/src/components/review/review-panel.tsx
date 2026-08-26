import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Feature, ReviewAction } from "@/lib/types";

export function ReviewPanel({
  feature,
  pending,
  onSubmit,
}: {
  feature: Feature;
  pending?: boolean;
  onSubmit: (action: ReviewAction, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Comment</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Boundary verified against orthophoto…"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={pending}
          onClick={() => onSubmit("ACCEPT", comment || "Boundary verified")}
        >
          <Check className="size-4" />
          Accept
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => onSubmit("EDIT", comment || "Geometry adjusted")}
        >
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => onSubmit("REJECT", comment || "False positive")}
        >
          <X className="size-4" />
          Reject
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Reviewing {feature.feature_id}. Decision writes to the public review API and
        refreshes feature caches.
      </p>
    </div>
  );
}

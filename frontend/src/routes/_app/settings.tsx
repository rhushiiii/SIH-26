import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_API_BASE_URL } from "@/lib/constants";
import {
  getApiBaseUrl,
  getUseMockApi,
  setApiBaseUrl,
  setUseMockApi,
} from "@/lib/config";
import { resetMockState } from "@/mock/store";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [mock, setMock] = useState(() => getUseMockApi());
  const [base, setBase] = useState(() => getApiBaseUrl());

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="The UI talks only to the public API. Toggle mock services while the FastAPI backend is still landing."
      />
      <Card>
        <CardHeader>
          <CardTitle>API configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Use mock API</p>
              <p className="text-xs text-muted-foreground">
                Default on. When off, requests go to the FastAPI base URL.
              </p>
            </div>
            <Switch
              checked={mock}
              onCheckedChange={(v) => {
                setMock(v);
                setUseMockApi(v);
                toast.message(v ? "Mock API enabled" : "Live API enabled — reload to apply");
              }}
              aria-label="Use mock API"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-base">API base URL</Label>
            <Input
              id="api-base"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder={DEFAULT_API_BASE_URL}
            />
            <p className="text-xs text-muted-foreground">
              Default {DEFAULT_API_BASE_URL}. Equivalent to NEXT_PUBLIC_API_BASE_URL /
              VITE_API_BASE_URL.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setApiBaseUrl(base);
                toast.success("API base URL saved");
              }}
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetMockState();
                toast.message("Demo data reset");
              }}
            >
              Reset demo data
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            CRS display: <span className="font-mono">EPSG:4326 / EPSG:3857</span>
          </p>
          <p>Units: metric (m, km, m²)</p>
          <p>Confidence is always shown as a percentage in the UI.</p>
        </CardContent>
      </Card>
    </div>
  );
}

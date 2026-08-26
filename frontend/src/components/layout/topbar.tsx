import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ANALYST_PROFILE } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { useFeatures } from "@/hooks/use-features";
import { useImages } from "@/hooks/use-images";
import { useJobs } from "@/hooks/use-jobs";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Job completed",
    body: "Orthophoto_2024_05.tif — 24,531 features written.",
    time: "2h ago",
  },
  {
    id: "n2",
    title: "Review queue",
    body: "12 features require human validation.",
    time: "4h ago",
  },
  {
    id: "n3",
    title: "Processing failed",
    body: "Village_North_RGB.tif — INVALID_IMAGE.",
    time: "Yesterday",
  },
];

export function Topbar({
  onMenu,
  title,
}: {
  onMenu: () => void;
  title: string;
}) {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 250);
  const navigate = useNavigate();
  const images = useImages();
  const jobs = useJobs();
  const features = useFeatures({ q: debounced, page_size: 6, page: 1 });

  const imageHits = useMemo(() => {
    if (!debounced) return [];
    const needle = debounced.toLowerCase();
    return (images.data?.items ?? [])
      .filter(
        (i) =>
          i.filename.toLowerCase().includes(needle) ||
          i.image_id.toLowerCase().includes(needle),
      )
      .slice(0, 4);
  }, [debounced, images.data]);

  const jobHits = useMemo(() => {
    if (!debounced) return [];
    const needle = debounced.toLowerCase();
    return (jobs.data?.items ?? [])
      .filter(
        (j) =>
          j.filename.toLowerCase().includes(needle) ||
          j.job_id.toLowerCase().includes(needle),
      )
      .slice(0, 4);
  }, [debounced, jobs.data]);

  const featureHits = debounced ? (features.data?.items ?? []) : [];
  const hasResults =
    imageHits.length + jobHits.length + featureHits.length > 0 && debounced.length > 1;

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-3 sm:px-5">
      <Button
        variant="ghost"
        size="icon-sm"
        className="xl:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>
      <div className="hidden min-w-0 md:block">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          DRISHTI GeoAI
        </p>
        <p className="truncate text-sm font-semibold text-navy">{title}</p>
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search images, jobs, feature IDs"
          aria-label="Global search"
          className="h-9 bg-muted/60 pl-9"
        />
        {hasResults ? (
          <div className="absolute top-full z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md">
            {imageHits.map((img) => (
              <button
                key={img.image_id}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setQ("");
                  void navigate({ to: "/images/$imageId", params: { imageId: img.image_id } });
                }}
              >
                <span>{img.filename}</span>
                <span className="text-xs text-muted-foreground">Image</span>
              </button>
            ))}
            {jobHits.map((job) => (
              <button
                key={job.job_id}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setQ("");
                  void navigate({ to: "/jobs/$jobId", params: { jobId: job.job_id } });
                }}
              >
                <span>{job.filename}</span>
                <span className="text-xs text-muted-foreground">Job</span>
              </button>
            ))}
            {featureHits.map((f) => (
              <button
                key={f.feature_id}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setQ("");
                  void navigate({
                    to: "/features/$featureId",
                    params: { featureId: f.feature_id },
                    search: { imageId: f.image_id },
                  });
                }}
              >
                <span className="font-mono text-xs">{f.feature_id}</span>
                <span className="text-xs text-muted-foreground">{f.feature_type}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Button asChild size="sm" className="hidden sm:inline-flex">
        <Link to="/images/upload">
          <Upload className="size-4" />
          Upload
        </Link>
      </Button>
      <Button asChild size="icon-sm" variant="outline" className="sm:hidden" aria-label="Upload image">
        <Link to="/images/upload">
          <Upload className="size-4" />
        </Link>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
            <Bell className="size-4" />
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-confidence-low" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="border-b border-border px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Notifications
          </div>
          <ul>
            {NOTIFICATIONS.map((n) => (
              <li key={n.id} className="border-b border-border px-3 py-2.5 last:border-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Profile">
            <span className="flex size-7 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
              {ANALYST_PROFILE.initials}
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-xs font-medium">{ANALYST_PROFILE.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {ANALYST_PROFILE.role}
              </span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{ANALYST_PROFILE.org}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">Workspace settings</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

import { useState, useCallback, useRef } from 'react';
import { Calendar, X, Upload, Link, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CalendarSource } from '../hooks/useCalendarEvents';

interface CalendarImportProps {
  source: CalendarSource | null;
  isRefreshing: boolean;
  onFileImport: (file: File) => Promise<void>;
  onUrlImport: (url: string) => Promise<void>;
  onRefresh: () => void;
  onClear: () => void;
}

export default function CalendarImport({
  source,
  isRefreshing,
  onFileImport,
  onUrlImport,
  onRefresh,
  onClear,
}: CalendarImportProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.ics')) {
        setError('Please select an .ics file');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await onFileImport(file);
        setOpen(false);
      } catch {
        setError('Failed to parse calendar file');
      } finally {
        setLoading(false);
      }
    },
    [onFileImport],
  );

  const handleUrl = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onUrlImport(url.trim());
      setOpen(false);
      setUrl('');
    } catch {
      setError('Failed to fetch calendar URL');
    } finally {
      setLoading(false);
    }
  }, [url, onUrlImport]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const label = source
    ? source.type === 'file'
      ? source.name
      : 'Calendar linked'
    : 'Select Calendar';

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="text-sm font-medium">Import Calendar</div>

            {/* File upload */}
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-muted-foreground/50"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                Drop an .ics file here or click to browse
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".ics"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {/* URL input */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link className="h-3 w-3" />
                Or paste a calendar URL
              </div>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://calendar.google.com/..."
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleUrl}
                  disabled={!url.trim() || loading}
                >
                  {loading ? '...' : 'Load'}
                </Button>
              </div>
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <div className="text-[10px] text-muted-foreground/60">
              Works with Google Calendar, Apple Calendar, Outlook, and any .ics export.
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {source && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh calendar"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClear}
            aria-label="Disconnect calendar"
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

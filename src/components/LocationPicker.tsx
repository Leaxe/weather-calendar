import { useState, useEffect, useCallback } from 'react';
import { MapPin, X, RefreshCw } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import { searchCities } from '../services/weatherApi';
import type { GeoLocation } from '../types';

interface LocationPickerProps {
  location: GeoLocation | null;
  onSelect: (loc: GeoLocation) => void;
  onClear: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  iconOnly?: boolean;
}

export default function LocationPicker({
  location,
  onSelect,
  onClear,
  onRefresh,
  isRefreshing,
  iconOnly,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchCities(query, controller.signal)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = useCallback(
    (loc: GeoLocation) => {
      onSelect(loc);
      setOpen(false);
      setQuery('');
      setResults([]);
    },
    [onSelect],
  );

  const label = location
    ? `${location.name}, ${location.admin1 ?? location.country}`
    : 'Select Location';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={`flex cursor-pointer items-center overflow-hidden rounded-md border bg-white/5 backdrop-blur-sm ${location ? 'border-white/10' : 'animate-pulse-glow border-blue-400/40'}`}
        >
          <button
            aria-label="Select location"
            className={`flex h-8 cursor-pointer items-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${iconOnly ? 'w-8 justify-center' : 'gap-1.5 px-3 text-xs'}`}
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {!iconOnly && label}
          </button>
          {location && (
            <>
              <div className="h-full w-px bg-border/50" />
              <button
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh?.();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={isRefreshing}
                aria-label="Refresh weather"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="h-full w-px bg-border/50" />
              <button
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Clear location"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" collisionPadding={12}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city..."
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              if (v.trim()) {
                setSearching(true);
              } else {
                setResults([]);
                setSearching(false);
              }
            }}
          />
          {query.trim() && (
            <CommandList>
              {searching && (
                <div className="p-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-2 rounded-sm px-2 py-1.5"
                    >
                      <div
                        className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-muted-foreground/20"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                      <div
                        className="h-3.5 animate-pulse rounded bg-muted-foreground/20"
                        style={{
                          width: `${100 - i * 20}px`,
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {!searching && results.length === 0 && <CommandEmpty>No cities found</CommandEmpty>}
              {!searching &&
                results.map((r, i) => (
                  <CommandItem
                    key={`${r.latitude}-${r.longitude}-${i}`}
                    value={`${r.name}-${r.latitude}-${r.longitude}`}
                    onSelect={() => handleSelect(r)}
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {r.name}
                      {r.admin1 && <span className="text-muted-foreground">, {r.admin1}</span>}
                      <span className="text-muted-foreground">, {r.country}</span>
                    </span>
                  </CommandItem>
                ))}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

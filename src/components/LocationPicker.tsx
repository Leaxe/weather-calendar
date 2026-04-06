import { useState, useEffect, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandLoading,
} from '@/components/ui/command';
import { searchCities } from '../services/weatherApi';
import type { GeoLocation } from '../types';

interface LocationPickerProps {
  location: GeoLocation | null;
  onSelect: (loc: GeoLocation) => void;
  onClear: () => void;
  iconOnly?: boolean;
}

export default function LocationPicker({ location, onSelect, onClear, iconOnly }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
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
    <div className="flex items-center overflow-hidden rounded-md border border-white/10 bg-white/5 backdrop-blur-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={`flex h-8 cursor-pointer items-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${iconOnly ? 'w-8 justify-center' : 'gap-1.5 px-3 text-xs'}`}>
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {!iconOnly && label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 border-white/10 bg-popover/80 p-0 backdrop-blur-xl" align="end" collisionPadding={12}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search city..."
              value={query}
              onValueChange={(v) => {
                setQuery(v);
                if (!v.trim()) setResults([]);
              }}
            />
            <CommandList>
              {searching && <CommandLoading>Searching...</CommandLoading>}
              {!searching && query.trim() && results.length === 0 && (
                <CommandEmpty>No cities found</CommandEmpty>
              )}
              {results.map((r, i) => (
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
          </Command>
        </PopoverContent>
      </Popover>
      {location && (
        <>
          <div className="h-full w-px bg-border/50" />
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onClear}
            aria-label="Clear location"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}

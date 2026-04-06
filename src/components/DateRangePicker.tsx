import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays, getSunday, todayStr, toLocalDateStr } from '../utils/dateUtils';

interface DateRangePickerProps {
  label: string;
  weekStartDate: string;
  onChange: (newStart: string) => void;
  disabled?: boolean;
}

export default function DateRangePicker({
  label,
  weekStartDate,
  onChange,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const today = todayStr();
  const currentWeekStart = getSunday(today);
  const isCurrentWeek = weekStartDate === currentWeekStart;
  const nextWeekStart = addDays(weekStartDate, 7);
  const nextWeekEnd = addDays(nextWeekStart, 6);
  const lastForecastDay = addDays(today, 16);
  const isForwardDisabled = nextWeekEnd > lastForecastDay;

  const midWeek = new Date(addDays(weekStartDate, 3) + 'T12:00:00');

  // Highlight the currently selected week (Sun–Sat)
  const selectedRange = useMemo(() => {
    const from = new Date(weekStartDate + 'T12:00:00');
    const to = new Date(addDays(weekStartDate, 6) + 'T12:00:00');
    return { from, to };
  }, [weekStartDate]);

  // Disable days whose week's Saturday extends past the last forecast day
  const disabledMatcher = useCallback(
    (date: Date) => {
      const dateStr = toLocalDateStr(date);
      const weekEnd = addDays(getSunday(dateStr), 6);
      return weekEnd > lastForecastDay;
    },
    [lastForecastDay],
  );

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const dateStr = toLocalDateStr(date);
        onChange(getSunday(dateStr));
        setTimeout(() => setOpen(false), 0);
      }
    },
    [onChange],
  );

  const handleToday = useCallback(() => {
    onChange(currentWeekStart);
    setTimeout(() => setOpen(false), 0);
  }, [onChange, currentWeekStart]);

  return (
    <div className="flex items-center overflow-hidden rounded-md border border-white/10 bg-white/5 backdrop-blur-sm">
      <button
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
        onClick={() => onChange(addDays(weekStartDate, -7))}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="h-full w-px bg-border/50" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-8 cursor-pointer items-center px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            disabled={disabled}
          >
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            selected={selectedRange}
            onDayClick={(day) => handleSelect(day)}
            defaultMonth={midWeek}
            disabled={disabledMatcher}
            endMonth={new Date(lastForecastDay + 'T12:00:00')}
            footer={
              <div className="-mx-3 -mb-3 border-t border-white/10 p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isCurrentWeek}
                  onClick={handleToday}
                >
                  Today
                </Button>
              </div>
            }
          />
        </PopoverContent>
      </Popover>
      <div className="h-full w-px bg-border/50" />
      <button
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled || isForwardDisabled}
        onClick={() => onChange(nextWeekStart)}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

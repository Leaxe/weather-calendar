import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays, getSunday, todayStr } from '../utils/dateUtils';

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
  const maxStart = addDays(today, 16);
  const nextWeekStart = addDays(weekStartDate, 7);
  const isForwardDisabled = nextWeekStart > maxStart;

  const midWeek = new Date(addDays(weekStartDate, 3) + 'T12:00:00');

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(getSunday(date.toISOString().slice(0, 10)));
        setOpen(false);
      }
    },
    [onChange],
  );

  const handleToday = useCallback(() => {
    onChange(currentWeekStart);
    setOpen(false);
  }, [onChange, currentWeekStart]);

  return (
    <div className="flex items-center overflow-hidden rounded-md border border-white/10">
      <button
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-white/10 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
        onClick={() => onChange(addDays(weekStartDate, -7))}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="h-full w-px bg-white/10" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-8 cursor-pointer items-center px-3 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            disabled={disabled}
          >
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={midWeek}
            onSelect={handleSelect}
            defaultMonth={midWeek}
            footer={
              <div className="border-t border-white/10 p-2">
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
      <div className="h-full w-px bg-white/10" />
      <button
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-white/10 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled || isForwardDisabled}
        onClick={() => onChange(nextWeekStart)}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

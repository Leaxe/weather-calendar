import { useState, useCallback } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays } from '../utils/dateUtils';

interface DateRangePickerProps {
  label: string;
  weekStartDate: string;
  onSelect: (date: Date) => void;
}

export default function DateRangePicker({ label, weekStartDate, onSelect }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const midWeek = new Date(addDays(weekStartDate, 3) + 'T12:00:00');

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onSelect(date);
        setOpen(false);
      }
    },
    [onSelect],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-normal">
          <CalendarIcon className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-white/[0.12] bg-[rgba(22,33,62,0.7)] p-0 backdrop-blur-[12px] saturate-[1.2]" align="start">
        <Calendar
          mode="single"
          selected={midWeek}
          onSelect={handleSelect}
          defaultMonth={midWeek}
        />
      </PopoverContent>
    </Popover>
  );
}

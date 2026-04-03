import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays } from '../services/weatherApi';

interface DateNavigationProps {
  weekStartDate: string;
  onChange: (newStart: string) => void;
  disabled?: boolean;
}

function getSunday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export default function DateNavigation({ weekStartDate, onChange, disabled }: DateNavigationProps) {
  const today = new Date().toISOString().slice(0, 10);
  const currentWeekStart = getSunday(today);
  const isCurrentWeek = weekStartDate === currentWeekStart;
  const maxStart = addDays(today, 16);
  const nextWeekStart = addDays(weekStartDate, 7);
  const isForwardDisabled = nextWeekStart > maxStart;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onChange(addDays(weekStartDate, -7))}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || isCurrentWeek}
        onClick={() => onChange(currentWeekStart)}
      >
        Today
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled || isForwardDisabled}
        onClick={() => onChange(nextWeekStart)}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, getSunday, todayStr } from '../utils/dateUtils';

interface DateNavigationProps {
  weekStartDate: string;
  onChange: (newStart: string) => void;
  disabled?: boolean;
}

export default function DateNavigation({ weekStartDate, onChange, disabled }: DateNavigationProps) {
  const today = todayStr();
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

import { Toggle } from '@/components/ui/toggle';
import { Thermometer } from 'lucide-react';

export default function DetailToggle({ showDetails, onToggle }) {
  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={showDetails}
      onPressedChange={onToggle}
      aria-label={showDetails ? 'Hide weather details' : 'Show weather details'}
      className="gap-1.5 rounded-full px-3 text-xs"
    >
      <Thermometer className="h-3.5 w-3.5" />
      {showDetails ? 'Hide Details' : 'Weather Details'}
    </Toggle>
  );
}

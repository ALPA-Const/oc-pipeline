/**
 * Global Filters Component
 * Part B: Filter chips at the top of dashboard
 */

import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import { cn } from '@/lib/utils';

export function GlobalFilters() {
  const { filters, filterChips, addFilter, removeFilter, clearAllFilters } = useDashboardFilter();

  const states = ['CA', 'TX', 'FL', 'NY', 'WA', 'AZ', 'NV', 'OR'];
  const stages = [
    { value: 'opp_proposal', label: 'Currently Bidding' },
    { value: 'opp_negotiation', label: 'Bids Submitted' },
    { value: 'opp_award', label: 'Projects Awarded' },
    { value: 'opp_lost', label: 'Projects Lost' },
    { value: 'opp_lead_gen', label: 'Pre-Solicitation' },
  ];
  const setAsideTypes = [
    { value: 'small_business', label: 'Small Business' },
    { value: 'veteran_owned', label: 'Veteran Owned' },
    { value: 'woman_owned', label: 'Woman Owned' },
    { value: 'hub_zone', label: 'HUBZone' },
    { value: 'none', label: 'None' },
  ];

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        {/* State Filter */}
        <Select
          value={filters.state || ''}
          onValueChange={(value) => addFilter('state', value, `State: ${value}`)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stage Filter */}
        <Select
          value={filters.stage || ''}
          onValueChange={(value) => {
            const stage = stages.find(s => s.value === value);
            if (stage) addFilter('stage', value, stage.label);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Set-Aside Filter */}
        <Select
          value={filters.set_aside || ''}
          onValueChange={(value) => {
            const setAside = setAsideTypes.find(s => s.value === value);
            if (setAside) addFilter('set_aside', value, setAside.label);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Set-Aside Type" />
          </SelectTrigger>
          <SelectContent>
            {setAsideTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All Button */}
        {filterChips.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filterChips.map((chip) => (
            <Badge
              key={chip.id}
              variant="secondary"
              className="gap-1 pr-1 hover:bg-secondary/80 cursor-pointer"
            >
              <span>{chip.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter(chip.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapFilterProvider, useMapFilter } from '../MapFilterContext';

// Test component that uses the context
function TestComponent() {
  const { selectedFilter, setFilter, clearFilter } = useMapFilter();

  return (
    <div>
      <div data-testid="selected-filter">{selectedFilter}</div>
      <button onClick={() => setFilter('opp_proposal')}>Set Bidding</button>
      <button onClick={() => setFilter('opp_award')}>Set Awarded</button>
      <button onClick={clearFilter}>Clear</button>
    </div>
  );
}

describe('MapFilterContext', () => {
  it('should provide default filter value', () => {
    render(
      <MapFilterProvider>
        <TestComponent />
      </MapFilterProvider>
    );

    expect(screen.getByTestId('selected-filter')).toHaveTextContent('all');
  });

  it('should update filter when setFilter is called', async () => {
    render(
      <MapFilterProvider>
        <TestComponent />
      </MapFilterProvider>
    );

    const biddingButton = screen.getByRole('button', { name: /set bidding/i });
    await userEvent.click(biddingButton);

    expect(screen.getByTestId('selected-filter')).toHaveTextContent('opp_proposal');
  });

  it('should clear filter when clearFilter is called', async () => {
    render(
      <MapFilterProvider>
        <TestComponent />
      </MapFilterProvider>
    );

    // Set a filter first
    const biddingButton = screen.getByRole('button', { name: /set bidding/i });
    await userEvent.click(biddingButton);
    expect(screen.getByTestId('selected-filter')).toHaveTextContent('opp_proposal');

    // Clear the filter
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);
    expect(screen.getByTestId('selected-filter')).toHaveTextContent('all');
  });

  it('should allow switching between filters', async () => {
    render(
      <MapFilterProvider>
        <TestComponent />
      </MapFilterProvider>
    );

    const biddingButton = screen.getByRole('button', { name: /set bidding/i });
    const awardedButton = screen.getByRole('button', { name: /set awarded/i });

    await userEvent.click(biddingButton);
    expect(screen.getByTestId('selected-filter')).toHaveTextContent('opp_proposal');

    await userEvent.click(awardedButton);
    expect(screen.getByTestId('selected-filter')).toHaveTextContent('opp_award');
  });
});
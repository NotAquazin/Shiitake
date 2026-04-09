import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Leaderboard from './index';

jest.mock('axios');

const mockCRs = [
  { id: 1, building: 'MVP',   floor: 1, status: 'available',         averageRating: 4.5, tags: ['Bidet', 'Soap'],     name: 'MVP-1' },
  { id: 2, building: 'Arete', floor: 2, status: 'closed',            averageRating: 2.0, tags: ['Soap'],              name: 'Arete-2' },
  { id: 3, building: 'MVP',   floor: 3, status: 'under maintenance', averageRating: 3.0, tags: ['Bidet'],             name: 'MVP-3' },
  { id: 4, building: 'CTC',   floor: 1, status: 'available',         averageRating: 3.5, tags: ['Bidet', 'Spacious'], name: 'CTC-1' },
];

const mockReviews = [];

async function renderLeaderboard() {
  axios.get.mockImplementation((url) => {
    if (url.includes('/crs'))     return Promise.resolve({ data: mockCRs });
    if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });

  await act(async () => {
    render(
      <BrowserRouter>
        <Leaderboard />
      </BrowserRouter>
    );
  });

  // Wait for data to load
  await waitFor(() => expect(screen.queryByText('Loading data...')).not.toBeInTheDocument());
}

async function openFilterPanel() {
  await act(async () => {
    userEvent.click(screen.getByRole('button', { name: /filter restrooms/i }));
  });
}

async function applyFilter() {
  await act(async () => {
    userEvent.click(screen.getByRole('button', { name: /apply filter/i }));
  });
}

describe('Leaderboard filter panel', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Filter Restrooms button

  it('shows the FilterPanel when "Filter Restrooms" button is clicked', async () => {
    await renderLeaderboard();

    expect(screen.getByRole('button', { name: /filter restrooms/i })).toBeInTheDocument();

    await openFilterPanel();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply filter/i })).toBeInTheDocument();
    });
  });

  it('hides the FilterPanel and shows results after Apply Filter is clicked', async () => {
    await renderLeaderboard();
    await openFilterPanel();
    await applyFilter();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /apply filter/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter restrooms/i })).toBeInTheDocument();
    });
  });

  // Filter by building

  it('filters by building: selecting MVP hides non-MVP rows', async () => {
    await renderLeaderboard();
    await openFilterPanel();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Select building'), 'MVP');
    });
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('MVP-1')).toBeInTheDocument();
      expect(screen.getByText('MVP-3')).toBeInTheDocument();
      expect(screen.queryByText('Arete-2')).not.toBeInTheDocument();
      expect(screen.queryByText('CTC-1')).not.toBeInTheDocument();
    });
  });

  // Filter by amenities

  it('shows all rows when no amenities are selected', async () => {
    await renderLeaderboard();
    await openFilterPanel();
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('MVP-1')).toBeInTheDocument();
      expect(screen.getByText('Arete-2')).toBeInTheDocument();
      expect(screen.getByText('MVP-3')).toBeInTheDocument();
      expect(screen.getByText('CTC-1')).toBeInTheDocument();
    });
  });

  it('filters by 1 amenity (Bidet): shows only CRs that have it', async () => {
    await renderLeaderboard();
    await openFilterPanel();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /Bidet/ }));
    });
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('MVP-1')).toBeInTheDocument();
      expect(screen.getByText('MVP-3')).toBeInTheDocument();
      expect(screen.getByText('CTC-1')).toBeInTheDocument();

      expect(screen.queryByText('Arete-2')).not.toBeInTheDocument();
    });
  });

  it('filters by 2 amenities (Bidet + Soap): shows only CRs that have both', async () => {
    await renderLeaderboard();
    await openFilterPanel();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /Bidet/ }));
    });
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /Soap/ }));
    });
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('MVP-1')).toBeInTheDocument();

      expect(screen.queryByText('MVP-3')).not.toBeInTheDocument();
      expect(screen.queryByText('CTC-1')).not.toBeInTheDocument();
      expect(screen.queryByText('Arete-2')).not.toBeInTheDocument();
    });
  });

  // Filter by status

  it('filters by status: selecting Closed hides non-Closed rows', async () => {
    await renderLeaderboard();
    await openFilterPanel();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Select status'), 'Closed');
    });
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('Arete-2')).toBeInTheDocument();
      expect(screen.queryByText('MVP-1')).not.toBeInTheDocument();
      expect(screen.queryByText('CTC-1')).not.toBeInTheDocument();
    });
  });

  // Filter by floor

  it('filters by floor: selecting floor 3 hides other floors', async () => {
    await renderLeaderboard();
    await openFilterPanel();

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText('e.g. 2'), '3');
    });
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('MVP-3')).toBeInTheDocument();
      expect(screen.queryByText('MVP-1')).not.toBeInTheDocument();
      expect(screen.queryByText('Arete-2')).not.toBeInTheDocument();
    });
  });

  // Empty state

  it('displays the empty state message when no restrooms match', async () => {
    await renderLeaderboard();
    await openFilterPanel();

    await act(async () => {
      // CTC has no floor 3 in our mock
      userEvent.selectOptions(screen.getByDisplayValue('Select building'), 'CTC');
      userEvent.type(screen.getByPlaceholderText('e.g. 2'), '3');
    });
    await applyFilter();

    await waitFor(() => {
      expect(screen.getByText('No restrooms match the selected filters.')).toBeInTheDocument();
    });
  });

});

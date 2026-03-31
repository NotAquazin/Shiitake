import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Search from './Search';

// Mock global fetch
global.fetch = jest.fn();

// Sample CR data matching the actual DB
const mockCRs = [
  { id: 1, building: 'MVP',   floor: 1, status: 'available',         averageRating: 4.5, tags: ['Bidet', 'Spacious'] },
  { id: 2, building: 'Arete', floor: 2, status: 'closed',            averageRating: 2.0, tags: ['Soap'] },
  { id: 3, building: 'MVP',   floor: 3, status: 'under maintenance', averageRating: 0,   tags: [] },
  { id: 4, building: 'CTC',   floor: 1, status: 'available',         averageRating: 3.5, tags: ['Bidet'] },
  { id: 5, building: 'SEC-A', floor: 2, status: 'available',         averageRating: 1.0, tags: [] },
  { id: 6, building: 'Faura', floor: 1, status: 'available',         averageRating: 5.0, tags: [] },
];

function mockFetch(data) {
  fetch.mockResolvedValue({ json: async () => data });
}

async function renderSearch() {
  await act(async () => {
    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );
  });
}

beforeEach(() => {
  fetch.mockClear();
  mockFetch(mockCRs);
});

describe('CR Search filters', () => {

  it('populates Building dropdown from real DB data', async () => {
    await renderSearch();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'MVP' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Arete' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'CTC' })).toBeInTheDocument();
    });
  });

  it('populates tags from real DB data', async () => {
    await renderSearch();
    await waitFor(() => {
      expect(screen.getByText(/Bidet/)).toBeInTheDocument();
      expect(screen.getByText(/Spacious/)).toBeInTheDocument();
    });
  });

  it('filters by building', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await waitFor(() => screen.getByRole('option', { name: 'MVP' }));

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Select building'), 'MVP');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.queryByText(/Arete — Floor/)).not.toBeInTheDocument();
      expect(screen.queryByText(/CTC — Floor/)).not.toBeInTheDocument();
    });
  });

  it('filters by floor', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/type valid integer/i), '1');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.queryByText(/— Floor 2/)).not.toBeInTheDocument();
      expect(screen.queryByText(/— Floor 3/)).not.toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Select status'), 'available');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.queryByText('closed')).not.toBeInTheDocument();
      expect(screen.queryByText('under maintenance')).not.toBeInTheDocument();
    });
  });

  it('filters by minimum rating ">= 1★" shows rated CRs and hides unrated ones', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Any'), '1');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/4\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/2\.0 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/3\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/1\.0 \/ 5/)).toBeInTheDocument();

      expect(screen.queryByText('No ratings yet')).not.toBeInTheDocument();
    });
  });

  it('filters by minimum rating ">= 2★" shows CRs rated 2 and above', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Any'), '2');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/4\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/2\.0 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/3\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/5\.0 \/ 5/)).toBeInTheDocument();

      expect(screen.queryByText(/1\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText('No ratings yet')).not.toBeInTheDocument();
    });
  });

  it('filters by minimum rating ">= 3★" shows CRs rated 3 and above', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Any'), '3');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/4\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/3\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/5\.0 \/ 5/)).toBeInTheDocument();

      expect(screen.queryByText(/2\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/1\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText('No ratings yet')).not.toBeInTheDocument();
    });
  });

  it('filters by minimum rating ">= 4★" shows only CRs rated 4 and above', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Any'), '4');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/4\.5 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText(/5\.0 \/ 5/)).toBeInTheDocument();

      expect(screen.queryByText(/3\.5 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/2\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/1\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText('No ratings yet')).not.toBeInTheDocument();
    });
  });

  it('filters by minimum rating "5★ only" shows only perfect-rated CRs', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Any'), '5');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/5\.0 \/ 5/)).toBeInTheDocument();

      expect(screen.queryByText(/4\.5 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/3\.5 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/2\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/1\.0 \/ 5/)).not.toBeInTheDocument();
      expect(screen.queryByText('No ratings yet')).not.toBeInTheDocument();
    });
  });

  it('filters by tag', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await waitFor(() => screen.getByText(/\+ Bidet/));

    await act(async () => {
      userEvent.click(screen.getByText(/\+ Bidet/));
    });
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.queryByText(/Arete — Floor/)).not.toBeInTheDocument();
    });
  });

  it('shows "No CR matches found" when nothing matches', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/type valid integer/i), '99');
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/No CR matches found/i)).toBeInTheDocument();
    });
  });

  it('result cards link to the correct CR page', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/cr/1');
    });
  });
});

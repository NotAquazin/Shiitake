import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Search from './Search';

// Mock global fetch
global.fetch = jest.fn();

// Sample CR data matching the actual DB
const mockCRs = [
  { id: 1, building: 'MVP',   name: 'Alpha CR',   floor: 1, status: 'available',         averageRating: 4.5, tags: ['Bidet', 'Spacious'] },
  { id: 2, building: 'Arete', name: 'Beta CR',    floor: 2, status: 'closed',            averageRating: 2.0, tags: ['Soap'] },
  { id: 3, building: 'MVP',   name: 'Gamma CR',   floor: 3, status: 'under maintenance', averageRating: 0,   tags: [] },
  { id: 4, building: 'CTC',   name: 'Delta CR',   floor: 1, status: 'available',         averageRating: 3.5, tags: ['Bidet'] },
  { id: 5, building: 'SEC-A', name: 'Epsilon CR', floor: 2, status: 'available',         averageRating: 1.0, tags: [] },
  { id: 6, building: 'Faura', name: 'Zeta CR',    floor: 1, status: 'available',         averageRating: 5.0, tags: [] },
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
      expect(screen.getByRole('button', { name: /Bidet/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Spacious/ })).toBeInTheDocument();
    });
  });

  it('returns all CRs when all filters are at their defaults', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    expect(screen.getByDisplayValue('Select building')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Select status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Any')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type valid integer/i).value).toBe('');

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/MVP — Alpha CR/)).toBeInTheDocument();
      expect(screen.getByText(/Arete — Beta CR/)).toBeInTheDocument();
      expect(screen.getByText(/MVP — Gamma CR/)).toBeInTheDocument();
      expect(screen.getByText(/CTC — Delta CR/)).toBeInTheDocument();
      expect(screen.getByText(/SEC-A — Epsilon CR/)).toBeInTheDocument();
      expect(screen.getByText(/Faura — Zeta CR/)).toBeInTheDocument();
    });
  });

  it('shows all CRs on load without clicking Search', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await waitFor(() => {
      expect(screen.getByText(/MVP — Alpha CR/)).toBeInTheDocument();
      expect(screen.getByText(/Arete — Beta CR/)).toBeInTheDocument();
      expect(screen.getByText(/MVP — Gamma CR/)).toBeInTheDocument();
      expect(screen.getByText(/CTC — Delta CR/)).toBeInTheDocument();
      expect(screen.getByText(/SEC-A — Epsilon CR/)).toBeInTheDocument();
      expect(screen.getByText(/Faura — Zeta CR/)).toBeInTheDocument();
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
      expect(screen.queryByText(/Arete — Beta CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/CTC — Delta CR/)).not.toBeInTheDocument();
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
      expect(screen.queryByText(/Arete — Beta CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/MVP — Gamma CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SEC-A — Epsilon CR/)).not.toBeInTheDocument();
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

  it('filters by tag with no tags selected returns all CRs', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/MVP — Alpha CR/)).toBeInTheDocument();
      expect(screen.getByText(/Arete — Beta CR/)).toBeInTheDocument();
      expect(screen.getByText(/MVP — Gamma CR/)).toBeInTheDocument();
      expect(screen.getByText(/CTC — Delta CR/)).toBeInTheDocument();
      expect(screen.getByText(/SEC-A — Epsilon CR/)).toBeInTheDocument();
      expect(screen.getByText(/Faura — Zeta CR/)).toBeInTheDocument();
    });
  });

  it('filters by 1 tag (Bidet) returns only CRs that have it', async () => {
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
      expect(screen.getByText(/MVP — Alpha CR/)).toBeInTheDocument();
      expect(screen.getByText(/CTC — Delta CR/)).toBeInTheDocument();

      expect(screen.queryByText(/Arete — Beta CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/MVP — Gamma CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SEC-A — Epsilon CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Faura — Zeta CR/)).not.toBeInTheDocument();
    });
  });

  it('filters by 2 tags (Bidet + Spacious) returns only CRs that have both', async () => {
    mockFetch(mockCRs);
    await renderSearch();

    await waitFor(() => screen.getByText(/\+ Bidet/));

    await act(async () => {
      userEvent.click(screen.getByText(/\+ Bidet/));
    });
    await act(async () => {
      userEvent.click(screen.getByText(/\+ Spacious/));
    });
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/MVP — Alpha CR/)).toBeInTheDocument();
      
      expect(screen.queryByText(/CTC — Delta CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Arete — Beta CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/MVP — Gamma CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SEC-A — Epsilon CR/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Faura — Zeta CR/)).not.toBeInTheDocument();
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

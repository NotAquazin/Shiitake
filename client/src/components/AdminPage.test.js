import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from './AdminPage'

// ── Global mocks ──────────────────────────────────────────────────────────────

global.fetch   = jest.fn()
window.confirm = jest.fn(() => true)

// ── Data helpers ──────────────────────────────────────────────────────────────

function makeCR(id, building, floor, status, tags = []) {
  return { id, building, name: `CR ${id}`, floor, status, averageRating: 3, tags }
}

function makeReview(id, CRId, author, rating, comment = '', reported = false) {
  return {
    id, CRId, author, rating, comment, reported,
    likes: 0, dislikes: 0,
    createdAt: '2024-01-01T00:00:00.000Z', reviewTags: [],
  }
}

// 15 CRs — first 10 fill page 1, CRs 11–15 require navigating to page 2
const CRS_15 = [
  makeCR(1,  'MVP',   1, 'available',         ['Bidet', 'Soap']),
  makeCR(2,  'Arete', 2, 'closed',            ['Bidet']),
  makeCR(3,  'MVP',   3, 'under maintenance', []),
  makeCR(4,  'CTC',   1, 'available',         ['Spacious']),
  makeCR(5,  'SEC-A', 2, 'available',         []),
  makeCR(6,  'Faura', 1, 'available',         []),
  makeCR(7,  'MVP',   1, 'available',         []),
  makeCR(8,  'Arete', 1, 'closed',            []),
  makeCR(9,  'CTC',   2, 'available',         []),
  makeCR(10, 'SEC-A', 1, 'available',         []),
  makeCR(11, 'Faura', 2, 'available',         []),
  makeCR(12, 'MVP',   2, 'available',         []),
  makeCR(13, 'CTC',   3, 'available',         []),
  makeCR(14, 'SEC-A', 1, 'closed',            []),
  makeCR(15, 'Arete', 1, 'available',         []),
]

// Exactly 10 CRs — one page, so no CR-pagination buttons are rendered.
// Used in View Reviews and tag tests so a lone "2" button always refers to reviews.
const CRS_10 = CRS_15.slice(0, 10)

// 6 reviews for CR 1 — 5 appear on review page 1, Frank appears on review page 2
const REVIEWS_FOR_CR1 = [
  makeReview(1, 1, 'Alice', 5, 'Great!'),
  makeReview(2, 1, 'Bob',   4, 'Good'),
  makeReview(3, 1, 'Carol', 3, 'Okay'),
  makeReview(4, 1, 'Dave',  2, 'Meh'),
  makeReview(5, 1, 'Eve',   1, 'Bad'),
  makeReview(6, 1, 'Frank', 5, 'Amazing!'),
]

const TAGS = ['Bidet', 'Soap', 'Spacious']

// ── Fetch mock ────────────────────────────────────────────────────────────────

function setupFetch({ crs = CRS_15, reviews = [], tags = TAGS } = {}) {
  fetch.mockImplementation((url, opts) => {
    const method = opts?.method || 'GET'

    // DELETE /global-tags/:name  — must be checked before the generic /global-tags GET
    if (/\/global-tags\/.+/.test(url) && method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({ message: 'Removed.' }) })
    }
    // POST /global-tags — add new tag
    if (url.endsWith('/global-tags') && method === 'POST') {
      const name = opts?.body ? JSON.parse(opts.body).name : ''
      return Promise.resolve({ ok: true, json: async () => ({ tag: { name } }) })
    }
    // PUT /crs/:id — save CR changes
    if (/\/crs\/\d+/.test(url) && method === 'PUT') {
      return Promise.resolve({ ok: true, json: async () => ({ cr: {} }) })
    }
    // DELETE /reviews/:id
    if (/\/reviews\/\d+/.test(url) && method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({ message: 'Deleted.' }) })
    }
    // PATCH /reviews/:id/clear-report
    if (/\/reviews\/\d+/.test(url) && method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ message: 'Cleared.' }) })
    }

    // GET endpoints
    if (url.endsWith('/crs'))          { return Promise.resolve({ ok: true, json: async () => crs }) }
    if (url.endsWith('/reviews'))      { return Promise.resolve({ ok: true, json: async () => reviews }) }
    if (url.endsWith('/global-tags'))  { return Promise.resolve({ ok: true, json: async () => tags }) }

    return Promise.resolve({ ok: true, json: async () => [] })
  })
}

async function renderAdmin() {
  localStorage.setItem('shiitake_token', 'fake-admin-token')
  await act(async () => {
    render(<AdminPage />)
  })
}

beforeEach(() => {
  fetch.mockClear()
  window.confirm = jest.fn(() => true)
})

afterEach(() => {
  localStorage.clear()
})

// =============================================================================
// CR Management — Pagination
// =============================================================================

describe('CR Management — CR pagination', () => {
  it('shows only the first 10 CRs on initial load when there are 15', async () => {
    setupFetch({ crs: CRS_15 })
    await renderAdmin()

    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    // CRs 1–10 are visible
    expect(screen.getByText('MVP — CR 1')).toBeInTheDocument()
    expect(screen.getByText('SEC-A — CR 10')).toBeInTheDocument()

    // CR 11 is on page 2 and should not be visible yet
    expect(screen.queryByText('Faura — CR 11')).not.toBeInTheDocument()

    // Page navigation buttons are present
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
  })

  it('navigating to page 2 reveals CRs 11–15 and hides CRs 1–10', async () => {
    setupFetch({ crs: CRS_15 })
    await renderAdmin()

    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument())

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: '2' }))
    })

    await waitFor(() => expect(screen.getByText('Faura — CR 11')).toBeInTheDocument())
    expect(screen.queryByText('MVP — CR 1')).not.toBeInTheDocument()
  })

  it('shows no pagination buttons when results fit on one page', async () => {
    setupFetch({ crs: CRS_10 })
    await renderAdmin()

    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument()
  })

  it('shows pagination buttons when results exceed 10', async () => {
    setupFetch({ crs: CRS_15 })
    await renderAdmin()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    })
  })

  it('resets to page 1 after a new search is run', async () => {
    setupFetch({ crs: CRS_15 })
    await renderAdmin()

    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument())

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: '2' }))
    })

    await waitFor(() => expect(screen.getByText('Faura — CR 11')).toBeInTheDocument())

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Search' }))
    })

    await waitFor(() => {
      expect(screen.getByText('MVP — CR 1')).toBeInTheDocument()
      expect(screen.queryByText('Faura — CR 11')).not.toBeInTheDocument()
    })
  })
})

// =============================================================================
// CR Management — Filter bar
// =============================================================================

describe('CR Management — filter bar', () => {
  beforeEach(() => {
    setupFetch({ crs: CRS_15 })
  })

  it('shows "No CRs match the filters." when no CRs match the active filters', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText('Any'), '99')
      userEvent.click(screen.getByRole('button', { name: 'Search' }))
    })

    await waitFor(() =>
      expect(screen.getByText('No CRs match the filters.')).toBeInTheDocument()
    )
  })

  it('filters by building — only shows CRs from the selected building', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByRole('option', { name: 'MVP' })).toBeInTheDocument())

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('All buildings'), 'MVP')
      userEvent.click(screen.getByRole('button', { name: 'Search' }))
    })

    await waitFor(() => {
      expect(screen.getByText('MVP — CR 1')).toBeInTheDocument()
      expect(screen.getByText('MVP — CR 3')).toBeInTheDocument()
      expect(screen.getByText('MVP — CR 7')).toBeInTheDocument()
      expect(screen.queryByText('Arete — CR 2')).not.toBeInTheDocument()
      expect(screen.queryByText('CTC — CR 4')).not.toBeInTheDocument()
      expect(screen.queryByText('SEC-A — CR 5')).not.toBeInTheDocument()
    })
  })

  it('filters by floor — only shows CRs on the specified floor', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText('Any'), '1')
      userEvent.click(screen.getByRole('button', { name: 'Search' }))
    })

    await waitFor(() => {
      // Floor 1 CRs are present
      expect(screen.getByText('MVP — CR 1')).toBeInTheDocument()
      expect(screen.getByText('CTC — CR 4')).toBeInTheDocument()
      // Floor 2 and 3 CRs are gone
      expect(screen.queryByText('Arete — CR 2')).not.toBeInTheDocument()
      expect(screen.queryByText('MVP — CR 3')).not.toBeInTheDocument()
      expect(screen.queryByText('SEC-A — CR 5')).not.toBeInTheDocument()
    })
  })

  it('filters by status — only shows CRs with the selected status', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('All statuses'), 'available')
      userEvent.click(screen.getByRole('button', { name: 'Search' }))
    })

    await waitFor(() => {
      // Available CRs remain
      expect(screen.getByText('MVP — CR 1')).toBeInTheDocument()
      // Closed and under-maintenance CRs are gone
      expect(screen.queryByText('Arete — CR 2')).not.toBeInTheDocument()
      expect(screen.queryByText('MVP — CR 3')).not.toBeInTheDocument()
      expect(screen.queryByText('Arete — CR 8')).not.toBeInTheDocument()
    })
  })
})

// =============================================================================
// CR Management — Tag management
// =============================================================================

describe('CR Management — tag management', () => {
  beforeEach(() => {
    setupFetch({ crs: CRS_10 })
  })

  it('adding a new tag calls POST /tags and the chip appears in every visible CR row', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText('Enter new tag…'), 'NewTag')
      userEvent.click(screen.getByRole('button', { name: 'Add Tag' }))
    })

    await waitFor(() => {
      // API call was made with correct payload and auth header
      expect(fetch).toHaveBeenCalledWith(
        '/global-tags',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'NewTag' }),
          headers: expect.objectContaining({ Authorization: 'Bearer fake-admin-token' }),
        })
      )

      // NewTag chip now appears in every CRRow on the page (10 CRs)
      const chips = screen.getAllByRole('button', { name: 'NewTag' })
      expect(chips.length).toBe(10)
    })
  })

  it('selecting a tag and clicking Remove shows the confirmation card', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Select a tag…'), 'Bidet')
    })
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    })

    await waitFor(() => {
      // The confirmation card text is: Remove <strong>"Bidet"</strong> from the library?...
      // Check the <strong> element and the action buttons to verify it's visible
      expect(screen.getByText('"Bidet"')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirm Remove' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })
  })

  it('confirming removal calls DELETE /tags/:name and removes the tag chips from all CRs', async () => {
    await renderAdmin()
    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    // Bidet chips are present before removal
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Bidet/ }).length).toBeGreaterThan(0)
    })

    await act(async () => {
      userEvent.selectOptions(screen.getByDisplayValue('Select a tag…'), 'Bidet')
    })
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    })
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Confirm Remove' }))
    })

    await waitFor(() => {
      // API call was made with correct URL and auth header
      expect(fetch).toHaveBeenCalledWith(
        '/global-tags/Bidet',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({ Authorization: 'Bearer fake-admin-token' }),
        })
      )
      // All Bidet tag chips are gone
      expect(screen.queryByRole('button', { name: /Bidet/ })).not.toBeInTheDocument()
    })
  })
})

// =============================================================================
// CR Management — View Reviews pagination
// =============================================================================

describe('CR Management — View Reviews', () => {
  it('clicking View Reviews shows the first 5 reviews; the 6th needs page 2', async () => {
    // Use exactly 10 CRs so there is no CR-level pagination button.
    // The only "2" button on screen will be the review pagination one.
    setupFetch({ crs: CRS_10, reviews: REVIEWS_FOR_CR1 })
    await renderAdmin()

    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    // No CR pagination yet
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument()

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'View Reviews (6)' }))
    })

    await waitFor(() => {
      // First 5 review authors are visible
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Carol')).toBeInTheDocument()
      expect(screen.getByText('Dave')).toBeInTheDocument()
      expect(screen.getByText('Eve')).toBeInTheDocument()
      // 6th review (Frank) is on page 2 — not visible yet
      expect(screen.queryByText('Frank')).not.toBeInTheDocument()
      // Review pagination button "2" has appeared
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    })
  })

  it('navigating to review page 2 shows the remaining review and hides page-1 reviews', async () => {
    setupFetch({ crs: CRS_10, reviews: REVIEWS_FOR_CR1 })
    await renderAdmin()

    await waitFor(() => expect(screen.getByText('MVP — CR 1')).toBeInTheDocument())

    // Expand reviews for CR 1
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'View Reviews (6)' }))
    })

    // Go to review page 2
    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument())
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: '2' }))
    })

    await waitFor(() => {
      expect(screen.getByText('Frank')).toBeInTheDocument()
      expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    })
  })
})

// =============================================================================
// Reported Reviews section
// =============================================================================

describe('Reported Reviews', () => {
  it('shows "No reported reviews." when no reviews are reported', async () => {
    setupFetch({ crs: CRS_10, reviews: [] })
    await renderAdmin()

    await waitFor(() =>
      expect(screen.getByText('No reported reviews.')).toBeInTheDocument()
    )
  })

  it('shows a reported review in the Reported Reviews section', async () => {
    const reportedReview = makeReview(99, 2, 'Grace', 2, 'Terrible experience', true)
    setupFetch({ crs: CRS_10, reviews: [reportedReview] })
    await renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('Grace')).toBeInTheDocument()
      expect(screen.getByText('Terrible experience')).toBeInTheDocument()
    })
  })

  it('clicking "Keep (Ignore Report)" calls PATCH clear report and removes the review from the section', async () => {
    const reportedReview = makeReview(99, 2, 'Grace', 2, 'Terrible experience', true)
    setupFetch({ crs: CRS_10, reviews: [reportedReview] })
    await renderAdmin()

    await waitFor(() => expect(screen.getByText('Grace')).toBeInTheDocument())

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Keep (Ignore Report)' }))
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/reviews/99/clear-report',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ Authorization: 'Bearer fake-admin-token' }),
        })
      )
      expect(screen.queryByText('Grace')).not.toBeInTheDocument()
      expect(screen.getByText('No reported reviews.')).toBeInTheDocument()
    })
  })

  it('clicking Delete on a reported review calls DELETE /reviews/:id and removes it', async () => {
    const reportedReview = makeReview(99, 2, 'Grace', 2, 'Terrible experience', true)
    setupFetch({ crs: CRS_10, reviews: [reportedReview] })
    await renderAdmin()

    await waitFor(() => expect(screen.getByText('Grace')).toBeInTheDocument())

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/reviews/99',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({ Authorization: 'Bearer fake-admin-token' }),
        })
      )
      expect(screen.queryByText('Grace')).not.toBeInTheDocument()
      expect(screen.getByText('No reported reviews.')).toBeInTheDocument()
    })
  })
})

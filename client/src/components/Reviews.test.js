import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CRPage from './CRPage';
import ReviewForm from './ReviewForm';

// ─── Global mocks ─────────────────────────────────────────────────────────────
global.fetch = jest.fn();

// ─── Shared mock data ─────────────────────────────────────────────────────────
const mockCR = {
  id: 1,
  building: 'MVP',
  name: 'Male CR',
  floor: 1,
  status: 'available',
  tags: ['Bidet', 'Soap'],
  averageRating: 3.0,
};

const mockReviews = [
  {
    id: 10,
    CRId: 1,
    UserId: 5,
    author: 'Alice',
    rating: 3,
    comment: 'Decent',
    reviewTags: [],
    likes: 0,
    dislikes: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// ─── URL-aware fetch mock ─────────────────────────────────────────────────────
// Sets up fetch to route by URL+method so the /global-tags call from ReviewForm
// never consumes a mock intended for the POST or PATCH calls.

function setupMocks({ cr = mockCR, reviews = mockReviews, postResponse, patchResponse } = {}) {
  fetch.mockImplementation((url, opts) => {
    const method = (opts?.method || 'GET').toUpperCase();

    if (url.includes('/global-tags')) {
      return Promise.resolve({ ok: true, json: async () => [] });
    }
    if (url.includes('/reviews')) {
      if (method === 'GET')  return Promise.resolve({ ok: true, json: async () => reviews });
      if (method === 'POST') return Promise.resolve(
        postResponse ?? { ok: true, json: async () => ({ review: {} }) }
      );
    }
    // CRPage uses /CRs/:pk (uppercase) for GET and /crs/:id (lowercase) for PATCH
    if (url.includes('/CRs/') || url.includes('/crs/')) {
      if (method === 'GET')   return Promise.resolve({ ok: true, json: async () => cr });
      if (method === 'PATCH') return Promise.resolve(
        patchResponse ?? { ok: true, json: async () => ({ cr }) }
      );
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderCRPage() {
  render(
    <MemoryRouter initialEntries={['/cr/1']}>
      <Routes>
        <Route path="/cr/:pk" element={<CRPage />} />
      </Routes>
    </MemoryRouter>
  );
}

async function loadCRPage(opts = {}) {
  setupMocks(opts);
  await act(async () => renderCRPage());
  await waitFor(() => expect(screen.getByText(/MVP/)).toBeInTheDocument());
}

async function openReviewForm() {
  await act(async () => userEvent.click(screen.getByText(/\+ Leave a Review/i)));
  await waitFor(() => screen.getByText(/Write a Review/i));
}

function clickFormStar(starNumber) {
  const ratingLabel = screen.getByText('Rating');
  const ratingSection = ratingLabel.closest('div');
  const stars = within(ratingSection).getAllByText('★');
  userEvent.click(stars[starNumber - 1]);
}

// ─── Global setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  fetch.mockReset();
  // Default: all fetches return empty so ReviewForm's /global-tags call never throws
  fetch.mockImplementation(() => Promise.resolve({ ok: true, json: async () => [] }));

  jest.spyOn(window, 'alert').mockImplementation(() => {});
  localStorage.clear();
  localStorage.setItem('shiitake_username', 'TestUser');
  localStorage.setItem('shiitake_userID', '42');
  localStorage.setItem('shiitake_token', 'mock-auth-token');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RATING VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
describe('1. Rating validation', () => {

  it('shows an error and does not call onSubmit when no star is selected (rating = 0)', () => {
    const onSubmit = jest.fn();
    render(
      <ReviewForm
        cr={{ tags: [] }}
        existingReview={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    userEvent.click(screen.getByText(/Post Review/i));

    expect(screen.getByText(/Please choose a star rating/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('the star UI exposes exactly 5 stars, making a rating of 6 impossible', () => {
    render(
      <ReviewForm
        cr={{ tags: [] }}
        existingReview={null}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getAllByText('★')).toHaveLength(5);
  });

  it('accepts and submits a valid rating of 1', () => {
    const onSubmit = jest.fn();
    render(
      <ReviewForm
        cr={{ tags: [] }}
        existingReview={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    userEvent.click(screen.getAllByText('★')[0]);
    userEvent.click(screen.getByText(/Post Review/i));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rating: 1 }));
    expect(screen.queryByText(/Please choose a star rating/i)).not.toBeInTheDocument();
  });

  it('accepts and submits a valid rating of 5', () => {
    const onSubmit = jest.fn();
    render(
      <ReviewForm
        cr={{ tags: [] }}
        existingReview={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    userEvent.click(screen.getAllByText('★')[4]);
    userEvent.click(screen.getByText(/Post Review/i));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. REQUIRED FIELDS: UserId and CRId
// ═══════════════════════════════════════════════════════════════════════════════
describe('2. Review cannot be created without a UserId or CRId', () => {

  it('shows an error alert when the server rejects a review with no UserId', async () => {
    localStorage.removeItem('shiitake_userID');

    await loadCRPage({
      postResponse: { ok: false, status: 400, json: async () => ({ error: 'UserId cannot be null' }) },
    });
    await openReviewForm();
    clickFormStar(4);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

  it('sends a CRId derived from the URL and alerts when the server rejects it', async () => {
    await loadCRPage({
      postResponse: { ok: false, status: 400, json: async () => ({ error: 'CRId cannot be null' }) },
    });
    await openReviewForm();
    clickFormStar(3);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. NON-EXISTENT UserId OR CRId
// ═══════════════════════════════════════════════════════════════════════════════
describe('3. Review cannot be created for a UserId or CRId that does not exist', () => {

  it('shows an error alert when the server reports the UserId does not exist', async () => {
    localStorage.setItem('shiitake_userID', '9999');

    await loadCRPage({
      postResponse: { ok: false, status: 404, json: async () => ({ error: 'User not found' }) },
    });
    await openReviewForm();
    clickFormStar(3);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

  it('shows an error alert when the server reports the CRId does not exist', async () => {
    await loadCRPage({
      postResponse: { ok: false, status: 404, json: async () => ({ error: 'CR not found' }) },
    });
    await openReviewForm();
    clickFormStar(2);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. UserId MATCHES THE REQUESTER
// ═══════════════════════════════════════════════════════════════════════════════
describe('4. UserId on the submitted review matches the logged-in user', () => {

  it('sends the logged-in user\'s UserId (42) in the POST request body', async () => {
    localStorage.setItem('shiitake_userID', '42');

    const newReview = {
      id: 99, CRId: 1, UserId: 42, author: 'TestUser',
      rating: 4, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    await loadCRPage({
      postResponse: { ok: true, json: async () => ({ review: newReview }) },
    });
    await openReviewForm();
    clickFormStar(4);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() => {
      const postCall = fetch.mock.calls.find(([, opts]) => opts?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall[1].body);
      expect(body.UserId).toBe(42);
    });
  });

  it('sends UserId 7 when a different user (id=7) is logged in', async () => {
    localStorage.setItem('shiitake_userID', '7');

    const newReview = {
      id: 88, CRId: 1, UserId: 7, author: 'TestUser',
      rating: 2, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    await loadCRPage({
      postResponse: { ok: true, json: async () => ({ review: newReview }) },
    });
    await openReviewForm();
    clickFormStar(2);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() => {
      const postCall = fetch.mock.calls.find(([, opts]) => opts?.method === 'POST');
      const body = JSON.parse(postCall[1].body);
      expect(body.UserId).toBe(7);
      expect(body.UserId).not.toBe(42);
    });
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. averageRating UPDATES AFTER A NEW 5-STAR REVIEW
// ═══════════════════════════════════════════════════════════════════════════════
describe('5. averageRating updates after a new 5-star review is added', () => {

  function getHeaderRatingText() {
    const avgSection = screen.getByText(/Average Rating/).parentElement;
    return within(avgSection).getByText(/\/5/);
  }

  it('recalculates average from 3/5 to 4/5 after adding a 5-star review', async () => {
    const newReview = {
      id: 50, CRId: 1, UserId: 42, author: 'TestUser',
      rating: 5, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    await loadCRPage({
      postResponse: { ok: true, json: async () => ({ review: newReview }) },
    });

    expect(getHeaderRatingText()).toHaveTextContent('3/5');

    await openReviewForm();
    clickFormStar(5);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() => expect(getHeaderRatingText()).toHaveTextContent('4/5'));
  });

  it('shows 5/5 in the header when all reviews including the new one are 5 stars', async () => {
    const allFiveReviews = [{ ...mockReviews[0], rating: 5 }];
    const newReview = {
      id: 51, CRId: 1, UserId: 42, author: 'TestUser',
      rating: 5, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    await loadCRPage({
      reviews: allFiveReviews,
      postResponse: { ok: true, json: async () => ({ review: newReview }) },
    });
    await openReviewForm();
    clickFormStar(5);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() => expect(getHeaderRatingText()).toHaveTextContent('5/5'));
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. 24-HOUR RATE LIMIT
// The server returns HTTP 429 with a `nextAllowed` timestamp when a user tries
// to post a second review for the same CR within 24 hours.
// ═══════════════════════════════════════════════════════════════════════════════
describe('6. 24-hour rate limit', () => {

  it('shows the "You already reviewed" alert when the server returns 429 with nextAllowed', async () => {
    const nextAllowed = new Date('2024-06-15T10:00:00Z').toISOString();

    await loadCRPage({
      postResponse: {
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limited', nextAllowed }),
      },
    });
    await openReviewForm();
    clickFormStar(3);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('You already reviewed this CR recently')
      )
    );
  });

  it('shows the generic error alert when the server returns 429 but no nextAllowed', async () => {
    await loadCRPage({
      postResponse: {
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limited' }), // no nextAllowed
      },
    });
    await openReviewForm();
    clickFormStar(3);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

  it('does not close the review form after a 429 rate-limit response', async () => {
    const nextAllowed = new Date('2024-06-15T10:00:00Z').toISOString();

    await loadCRPage({
      postResponse: {
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limited', nextAllowed }),
      },
    });
    await openReviewForm();
    clickFormStar(3);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());

    // Form should still be visible — user can edit and retry later
    expect(screen.getByText(/Write a Review/i)).toBeInTheDocument();
  });

});

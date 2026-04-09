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

// One existing review so the header star count is predictable (rating: 3 → "3/5")
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Render CRPage mounted at /cr/1
function renderCRPage() {
  render(
    <MemoryRouter initialEntries={['/cr/1']}>
      <Routes>
        <Route path="/cr/:pk" element={<CRPage />} />
      </Routes>
    </MemoryRouter>
  );
}

// Load CRPage and wait until the CR header is visible
async function loadCRPage(cr = mockCR, reviews = mockReviews) {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => cr })
    .mockResolvedValueOnce({ ok: true, json: async () => reviews });

  await act(async () => renderCRPage());
  await waitFor(() => expect(screen.getByText(/MVP/)).toBeInTheDocument());
}

// Click "Leave a Review" and wait for the ReviewForm to appear
async function openReviewForm() {
  await act(async () => userEvent.click(screen.getByText(/\+ Leave a Review/i)));
  await waitFor(() => screen.getByText(/Write a Review/i));
}

// Click a star inside the ReviewForm's Rating section.
// Uses within() to scope to just the form's stars, so ReviewCard
// and header stars don't interfere.
function clickFormStar(starNumber) {
  const ratingLabel = screen.getByText('Rating');
  const ratingSection = ratingLabel.closest('div');
  const stars = within(ratingSection).getAllByText('★');
  userEvent.click(stars[starNumber - 1]); // starNumber 1–5 → index 0–4
}

// ─── Global setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  fetch.mockClear();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  localStorage.clear();
  localStorage.setItem('shiitake_username', 'TestUser');
  localStorage.setItem('shiitake_userID', '42');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RATING VALIDATION
// Only ratings 1–5 are valid. 0 (nothing selected) must show an error.
// A rating of 6 is structurally impossible: the UI exposes exactly 5 stars.
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

    userEvent.click(screen.getAllByText('★')[0]); // star 1
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

    userEvent.click(screen.getAllByText('★')[4]); // star 5
    userEvent.click(screen.getByText(/Post Review/i));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. REQUIRED FIELDS: UserId and CRId
// The frontend sends whatever is in localStorage / the URL.
// When the server rejects the request the component must show an error alert.
// ═══════════════════════════════════════════════════════════════════════════════
describe('2. Review cannot be created without a UserId or CRId', () => {

  it('shows an error alert when the server rejects a review with no UserId', async () => {
    localStorage.removeItem('shiitake_userID'); // simulate not logged in

    fetch
      .mockResolvedValueOnce({ ok: true,  json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true,  json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'UserId cannot be null' }) });

    await loadCRPage();
    await openReviewForm();
    clickFormStar(4);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

  it('sends a CRId derived from the URL and alerts when the server rejects it', async () => {
    // Simulate the server treating the request as invalid (e.g. FK constraint)
    fetch
      .mockResolvedValueOnce({ ok: true,  json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true,  json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'CRId cannot be null' }) });

    await loadCRPage();
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
// If the database has no matching row for the FK the server returns an error.
// The component must handle it gracefully with an alert.
// ═══════════════════════════════════════════════════════════════════════════════
describe('3. Review cannot be created for a UserId or CRId that does not exist', () => {

  it('shows an error alert when the server reports the UserId does not exist', async () => {
    localStorage.setItem('shiitake_userID', '9999'); // user ID that doesn't exist in DB

    fetch
      .mockResolvedValueOnce({ ok: true,  json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true,  json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'User not found' }) });

    await loadCRPage();
    await openReviewForm();
    clickFormStar(3);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Could not save review. Please try again.')
    );
  });

  it('shows an error alert when the server reports the CRId does not exist', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true,  json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true,  json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'CR not found' }) });

    await loadCRPage();
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
// CRPage reads the logged-in user's ID from localStorage and sends it in the
// POST body. The submitted UserId must equal what is in localStorage.
// ═══════════════════════════════════════════════════════════════════════════════
describe('4. UserId on the submitted review matches the logged-in user', () => {

  it('sends the logged-in user\'s UserId (42) in the POST request body', async () => {
    localStorage.setItem('shiitake_userID', '42');

    const newReview = {
      id: 99, CRId: 1, UserId: 42, author: 'TestUser',
      rating: 4, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true, json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ review: newReview }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cr: mockCR }) }); // PATCH /crs

    await loadCRPage();
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

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true, json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ review: newReview }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cr: mockCR }) });

    await loadCRPage();
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
// CRPage computes the average client-side from the reviews array. After adding
// a new review, the displayed "X/5" beside the header stars must update.
// ═══════════════════════════════════════════════════════════════════════════════
describe('5. averageRating updates after a new 5-star review is added', () => {

  // Helper: returns the X/5 span that lives inside the "Average Rating" header
  // section, ignoring the identical spans inside ReviewCards.
  function getHeaderRatingText() {
    const avgSection = screen.getByText(/Average Rating/).parentElement;
    return within(avgSection).getByText(/\/5/);
  }

  it('recalculates average from 3/5 to 4/5 after adding a 5-star review', async () => {
    // Existing review: rating 3 → avg = 3 → header shows "3/5"
    // New review:      rating 5 → avg = (3+5)/2 = 4 → header should show "4/5"
    const newReview = {
      id: 50, CRId: 1, UserId: 42, author: 'TestUser',
      rating: 5, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true, json: async () => mockReviews })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ review: newReview }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cr: mockCR }) });

    await loadCRPage();

    // Before submit: header average of [3] → "3/5"
    expect(getHeaderRatingText()).toHaveTextContent('3/5');

    await openReviewForm();
    clickFormStar(5);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    // After submit: header average of [3, 5] = 4 → "4/5"
    await waitFor(() => expect(getHeaderRatingText()).toHaveTextContent('4/5'));
  });

  it('shows 5/5 in the header when all reviews including the new one are 5 stars', async () => {
    const allFiveReviews = [{ ...mockReviews[0], rating: 5 }];

    const newReview = {
      id: 51, CRId: 1, UserId: 42, author: 'TestUser',
      rating: 5, comment: '', reviewTags: [],
      likes: 0, dislikes: 0, createdAt: new Date().toISOString(),
    };

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockCR })
      .mockResolvedValueOnce({ ok: true, json: async () => allFiveReviews })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ review: newReview }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cr: mockCR }) });

    await loadCRPage();
    await openReviewForm();
    clickFormStar(5);
    await act(async () => userEvent.click(screen.getByText(/Post Review/i)));

    await waitFor(() => expect(getHeaderRatingText()).toHaveTextContent('5/5'));
  });

});

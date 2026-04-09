import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Profile from './Profile';

global.fetch = jest.fn();

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  description: 'My bio',
  badges: [],
};

async function renderProfile(customReviews = []) {
  fetch.mockImplementation((url, options) => {
    if (url.includes('/users/1')) {
      return Promise.resolve({ 
        ok: true, 
        json: async () => ({ ...mockUser, user: mockUser }) 
      });
    }
    if (url.includes('/reviews')) {
      return Promise.resolve({ ok: true, json: async () => customReviews });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });

  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/profile/1']}>
        <Routes>
          <Route path="/profile/:pk" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );
  });

  await waitFor(() => expect(screen.queryByText('Fetching Profile...')).not.toBeInTheDocument());
}

describe('Profile page', () => {

  beforeEach(() => {
    fetch.mockClear();
  });

  it('shows the Edit Profile button when not editing', async () => {
    await renderProfile();

    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });

  it('shows the description textarea when Edit Profile is clicked', async () => {
    await renderProfile();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('hides the edit panel and shows Edit Profile button again when Cancel is clicked', async () => {
    await renderProfile();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    });

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });
  });

  describe('Review History and Statistics', () => {

    it('displays fallback text when the user has 0 reviews', async () => {
      await renderProfile([]);
      expect(screen.getByText("You haven't written any reviews yet.")).toBeInTheDocument();
    });

    it('calculates All-Time and Monthly statistics correctly for multiple reviews', async () => {
      const now = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);

      const mockReviews = [
        { id: 101, UserId: 1, createdAt: now.toISOString(), rating: 5, text: 'Nice', reviewTags: [], author: 'testuser' },
        { id: 102, UserId: 1, createdAt: lastMonth.toISOString(), rating: 4, text: 'Okay', reviewTags: [], author: 'testuser' },
        { id: 103, UserId: 2, createdAt: now.toISOString(), rating: 3, text: 'Not Mine', reviewTags: [], author: 'other' }
      ];

      await renderProfile(mockReviews);

      // Verify that stats parsed correctly (2 total for this user, 1 this month)
      expect(screen.getByText('All-Time Reviews').previousSibling).toHaveTextContent('2');
      expect(screen.getByText('Reviews This Month').previousSibling).toHaveTextContent('1');
    });

    it('removes a review locally when the Delete button is clicked and confirmed', async () => {
      const mockReviews = [
        { id: 101, UserId: 1, createdAt: new Date().toISOString(), rating: 5, text: 'Delete Me', reviewTags: [], author: 'testuser' }
      ];
      
      const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
      
      await renderProfile(mockReviews);
      
      // Review should exist initially
      expect(screen.getByText('Delete Me')).toBeInTheDocument();

      // Click delete button
      await act(async () => {
        // Wait, review is hidden inside ReviewCard due to missing mapping, we mapped it correctly now
        userEvent.click(screen.getByRole('button', { name: /delete/i }));
      });

      // Review should be removed
      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
      confirmSpy.mockRestore();
    });

    it('hides a review locally when the Report button is clicked', async () => {
      const mockReviews = [
        { id: 101, UserId: 1, createdAt: new Date().toISOString(), rating: 5, text: 'Report Me', reviewTags: [], author: 'not_me' }
      ];
      
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      await renderProfile(mockReviews);
      
      expect(screen.getByText('Report Me')).toBeInTheDocument();

      await act(async () => {
        userEvent.click(screen.getByRole('button', { name: /report/i }));
      });

      expect(screen.queryByText('Report Me')).not.toBeInTheDocument();
      expect(alertSpy).toHaveBeenCalledWith('Review reported and hidden from your view.');
      
      alertSpy.mockRestore();
    });

  });

});

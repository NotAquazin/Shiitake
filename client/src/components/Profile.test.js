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

async function renderProfile() {
  fetch.mockImplementation((url, options) => {
    if (url.includes('/users/1')) {
      const method = options?.method || 'GET';
      if (method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({ user: mockUser }) });
      }
      return Promise.resolve({ ok: true, json: async () => mockUser });
    }
    if (url.includes('/reviews')) {
      return Promise.resolve({ ok: true, json: async () => [] });
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

});

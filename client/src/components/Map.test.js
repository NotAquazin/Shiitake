import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Map from './Map';

// 1. Mock browser geolocation API
const mockGeolocation = {
  watchPosition: jest.fn().mockImplementation((success) => {
    success({ coords: { latitude: 14.6396, longitude: 121.0786 } });
    return 12345; // dummy watch ID
  }),
  clearWatch: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

// 2. Mock global fetch for the Map component
global.fetch = jest.fn();

// 3. Mock react-leaflet components since Leaflet's internal Canvas/DOM math crashes in raw JSDOM
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div />,
  Marker: ({ children }) => <div data-testid="leaflet-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="leaflet-popup">{children}</div>,
}));

// 4. Mock Leaflet itself to bypass icon loading errors
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: { _getIconUrl: jest.fn() },
      mergeOptions: jest.fn(),
    }
  },
  icon: jest.fn(),
}));

// 5. Mock leaflet-routing-machine which crashes immediately on import if L is not globally defined in JSDOM
jest.mock('leaflet-routing-machine', () => ({}));

const mockCRs = [
  {
    id: 1,
    name: 'Main Building CR',
    building: 'Main',
    floor: 1,
    status: 'Available',
    tags: ['Soap', 'Bidet'],
    description: 'Clean restroom',
    latitude: 14.6400,
    longitude: 121.0790
  }
];

describe('Map Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockImplementation((url) => {
      if (url.includes('/CRs')) {
        return Promise.resolve({ ok: true, json: async () => mockCRs });
      }
      if (url.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });
  });

  it('renders the map and correctly redirects to the CR review page when "See Reviews" is clicked', async () => {
    let testLocation;
    
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <Routes>
            <Route path="/map" element={<Map />} />
            <Route path="/cr/:id" element={
              <div data-testid="cr-page">
                CR Details Page
              </div>
            } />
          </Routes>
        </MemoryRouter>
      );
    });

    // Wait for the CR data to be injected into the Map
    await waitFor(() => {
      expect(screen.getByText('Main Building CR')).toBeInTheDocument();
    });

    // Verify the "See Reviews" button rendered safely inside the mock popup
    const seeReviewsBtn = screen.getByRole('button', { name: /see reviews/i });
    expect(seeReviewsBtn).toBeInTheDocument();

    // Click the button inside the popup
    await act(async () => {
      userEvent.click(seeReviewsBtn);
    });

    // Check if the router safely transitioned us to the CR Details Page (/cr/1)
    await waitFor(() => {
      expect(screen.getByTestId('cr-page')).toBeInTheDocument();
    });
    
  });

});

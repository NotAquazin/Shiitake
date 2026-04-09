import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './InteractiveMap.css';

const InteractiveMap = () => {
  const [crs, setCrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Fetch CR data
  useEffect(() => {
    const fetchCRs = async () => {
      try {
        const response = await axios.get('/api/crs');
        setCrs(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching CRs:", error);
        setLoading(false);
      }
    };
    fetchCRs();
  }, []);

  // Initialize Map
  useEffect(() => {
    // Make sure 'L' is loaded from CDN and map container exists
    if (window.L && !mapRef.current) {
      const L = window.L;
      
      // Initialize map: ADMU coordinates - 14.6396 N, 121.0786 E
      const map = L.map('map').setView([14.6396, 121.0786], 17);
      mapRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
      }).addTo(map);

      const coordinateChecker = L.marker([14.6396, 121.0786], {
          draggable: true
      }).addTo(map);

      coordinateChecker.on('dragend', function () {
          const latlng = coordinateChecker.getLatLng();
          const coordsString = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
          coordinateChecker.setPopupContent(`
              <div>
                  <p><strong>New Coordinates:</strong></p>
                  <p>${coordsString}</p>
              </div>
          `);
          coordinateChecker.openPopup();
      });

      coordinateChecker.bindPopup(`<div> <p>${coordinateChecker.getLatLng().lat.toFixed(6)}, ${coordinateChecker.getLatLng().lng.toFixed(6)}</p> </div>`);

      const faura1CR = L.marker([14.639453, 121.076514]).addTo(map);
      faura1CR.bindPopup(`
          <div style="width:300px; font-family:Arial, sans-serif;">
              <h3>Comfort Room Info</h3>
              <p><strong>Building:</strong> Faura Hall</p>
              <p><strong>Floor:</strong> 1st Floor</p>
              <p><strong>CR Availability:</strong> Available</p>
              <h4>Amenities</h4>
              <div>
                  <span class="tag tag-working">Toilet Paper Available</span>
                  <span class="tag tag-working">Soap Dispenser Full</span>
                  <span class="tag tag-working">Aircon Broken</span>
              </div>
              <button>Leave Review</button>
          </div>
      `).openPopup();

      const faura2CR = L.marker([14.639427, 121.076953]).addTo(map);
      faura2CR.bindPopup(`
          <div style="width:300px; font-family:Arial, sans-serif;">
              <h3>Comfort Room Info</h3>
              <p><strong>Building:</strong> Faura Hall</p>
              <p><strong>Floor:</strong> 2nd Floor</p>
              <p><strong>CR Availability:</strong> Available</p>
              <h4>Amenities</h4>
              <div>
                  <span class="tag tag-working">Toilet Paper Available</span>
                  <span class="tag tag-working">Soap Dispenser Full</span>
                  <span class="tag tag-working">Aircon Broken</span>
              </div>
              <button>Leave Review</button>
          </div>
      `).openPopup();
    }
  }, []);

  return (
    <div className="interactive-map-container mt-4">
      <div className="row">
        <div className="col-md-4">
          <h2>Restrooms</h2>
          <div id="cr-list" className="cr-list">
            {loading ? <p>Loading restrooms...</p> : 
              crs.map(cr => (
                <div key={cr.id} className="cr-card mb-3 p-3 shadow-sm border rounded">
                  <h3>{cr.name}</h3>
                  <p className="mb-1"><strong>Building:</strong> {cr.building}</p>
                  <div className="mb-2">
                    {cr.tags && cr.tags.map(t => (
                      <span key={t} className="badge bg-secondary me-1">{t}</span>
                    ))}
                  </div>
                  
                  <h4>Reviews:</h4>
                  {cr.Reviews && cr.Reviews.length > 0 ? (
                    cr.Reviews.map(rev => (
                      <div key={rev.id} style={{ fontSize: '0.9em', color: '#555', borderLeft: '3px solid #003366', paddingLeft: '10px', marginTop: '5px' }}>
                          <strong>Rating: {rev.rating}/5</strong><br/>
                          "{rev.comment}"
                      </div>
                    ))
                  ) : (
                    <p>No reviews yet.</p>
                  )}
                </div>
              ))
            }
          </div>
        </div>
        <div className="col-md-8">
          <div id="map" style={{ height: '70vh', width: '100%', borderRadius: '8px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;

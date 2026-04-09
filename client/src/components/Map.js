import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from 'react-router-dom';

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Map = () => {
  const [crs, setCRs] = useState([]); 
  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);
  const position = [14.6396, 121.0786]; 
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCRs() {
        try {
            // Use pk in the fetch URL
            const crRes = await fetch('/CRs');
            const crData = await crRes.json();
            setCRs(crData);

            const revRes = await fetch('/reviews');
            const allReviews = await revRes.json();

            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    }
    fetchCRs();
      }, []); // Re-run if the primary key changes

  const handleLeaveReviewClick = (crId) => {
    navigate(`/cr/${crId}`); // Navigate to CR review page
  };

  return (
    <MapContainer
      center={position}
      zoom={17}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {crs.map((cr) => (
        <Marker 
          key={cr.id} 
          position={[cr.latitude, cr.longitude]}
        >
          <Popup>
            <div style={{ width: "250px", fontFamily: "Arial, sans-serif" }}>
              <h3>{cr.building || "Unknown Building"}</h3>
              <p><strong>Floor:</strong> {cr.floor || "N/A"}</p>
              <p><strong>Status:</strong> {cr.status}</p>

               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {cr.tags.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#d4edda'

                  }}
                >
                {amenity}
                </span>
              ))}
            </div>
              
              <p>{cr.description}</p>

              <button 
                className="btn btn-primary btn-sm w-100"
                onClick={() => handleLeaveReviewClick(cr.id)}
              >
                Leave Review
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
export default Map;


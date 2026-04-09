import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { useNavigate } from 'react-router-dom';
import Routing from './Routing';

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
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [destination, setDestination] = useState(null);
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    async function fetchCRs() {
        try {
            const crRes = await fetch('http://localhost:13000/CRs');
            const crData = await crRes.json();
            setCRs(crData);

            const revRes = await fetch('http://localhost:13000/reviews');
            const allReviews = await revRes.json();

            setLoading(false);
            setUserPosition([14.6396, 121.0786]);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];

        
        if (Date.now() - lastUpdate > 2000) {
          //setUserPosition(coords);
          lastUpdateRef.current = Date.now();
        }
      },
      (err) => console.error(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
    });

    fetchCRs();
    setPosition([14.6396, 121.0786]);

    return () => {
    navigator.geolocation.clearWatch(watchId);
  };
  }, []); // Re-run if the primary key changes

  const handleLeaveReviewClick = (crId) => {
    navigate(`/cr/${crId}`); // Navigate to CR review page
  };

  const handleNavigation = (cr) => {
    setPosition([14.6396, 121.0786]);
    setDestination(cr);
    setNavigating(true);
    
  };

  if (!position || !userPosition ) return <p>Loading map...</p>;

  return (
    <div>
    <MapContainer
      center={position}
      zoom={18}
      style={{ height: "800px", width: "100%" }}
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
              <h3>{cr.name || "Unknown CR"}</h3>
              <p><strong>Building: </strong>{cr.building || "Unknown Building"}</p>
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

              <button 
                className="btn btn-primary btn-sm w-100 mt-2"
                onClick={() => handleNavigation(cr)}
              >
                Navigate
              </button>
          </div>
        </Popup>
      </Marker>
      ))
    }

    <Marker 
          position={userPosition}
          draggable={true} 
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const newPos = marker.getLatLng();
              // Update state with the new dragged position
              setUserPosition([newPos.lat, newPos.lng]);
            
            },
          }}
        > </Marker>

      // if navigating
      {navigating && (
        <>
        
        <Routing from={userPosition} to={destination ? [destination.latitude, destination.longitude] : null}/>
      </>
      )}
    </MapContainer>

    {navigating && (
    <button className="btn btn-primary btn-sm w-100 mt-2"
          onClick={() => setNavigating(false)} >
        Cancel Navigation
    </button>
    )}
    
    </div>
    
  );
};
export default Map;


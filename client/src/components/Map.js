import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { useNavigate } from 'react-router-dom';
import Routing from './Routing';

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import userPng from "./userIcon.png";
import StarRating from "./StarRating";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = L.icon({
    iconUrl: userPng,

    iconSize:     [30, 30], 
    iconAnchor:   [15, 20],
});
const CRPopupContent = ({ crGroup, onNavigate, onLeaveReview }) => {
  const [selectedCrId, setSelectedCrId] = useState(crGroup[0].id);

  useEffect(() => {
    if (!crGroup.find(cr => String(cr.id) === String(selectedCrId))) {
      setSelectedCrId(crGroup[0].id);
    }
  }, [crGroup, selectedCrId]);

  const activeCR = crGroup.find(cr => String(cr.id) === String(selectedCrId)) || crGroup[0];

  return (
    <div style={{ width: "250px", fontFamily: "Arial, sans-serif" }}>
      <h3>{activeCR.name || "Unknown CR"}</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 600 }}>
          Average Rating ({activeCR.reviewCount || 0} reviews)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <StarRating rating={activeCR.computedRating || 0} interactive={false} />
        </div>
      </div>

      <p style={{ margin: '0 0 4px' }}><strong>Building: </strong>{activeCR.building || "Unknown Building"}</p>
      
      <div style={{ margin: '0 0 10px' }}>
        <strong>Floor:</strong>{' '}
        {crGroup.length > 1 ? (
          <select 
            value={activeCR.id} 
            onChange={(e) => setSelectedCrId(e.target.value)}
            style={{ marginLeft: '5px', padding: '3px', borderRadius: '4px', maxWidth: '200px' }}
          >
            {[...crGroup].sort((a, b) => a.floor - b.floor).map(cr => (
              <option key={cr.id} value={cr.id}>
                {`Floor ${cr.floor} - ${cr.name}`}
              </option>
            ))}
          </select>
        ) : (
          activeCR.floor || "N/A"
        )}
      </div>

      <p style={{ margin: '0 0 10px' }}><strong>Status:</strong> {activeCR.status}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
        {activeCR.tags && activeCR.tags.map((amenity) => (
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
      
      {activeCR.description && <p style={{ fontSize: '13px', marginBottom: '12px' }}>{activeCR.description}</p>}

      <button 
        className="btn btn-primary btn-sm w-100"
        onClick={() => onLeaveReview(activeCR.id)}
      >
        See Reviews
      </button>

      <button 
        className="btn btn-primary btn-sm w-100 mt-2"
        onClick={() => onNavigate(activeCR)}
      >
        Navigate
      </button>
    </div>
  );
};

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
  const [liveTracking, setLiveTracking] = useState(true); 

  useEffect(() => {
    async function fetchCRs() {
        try {
            const crRes = await fetch('http://localhost:13000/CRs');
            const crData = await crRes.json();

            const revRes = await fetch('http://localhost:13000/reviews');
            const allReviews = await revRes.json();

            const enhancedCRs = crData.map(cr => {
                const crReviews = allReviews.filter(r => r.CRId === cr.id);
                let computedRating = cr.averageRating || 0;
                if (crReviews.length > 0) {
                    const sum = crReviews.reduce((acc, curr) => acc + curr.rating, 0);
                    computedRating = sum / crReviews.length;
                }
                return {
                    ...cr,
                    computedRating: parseFloat(Number(computedRating).toFixed(1)),
                    reviewCount: crReviews.length
                };
            });

            setCRs(enhancedCRs);
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    }
    setUserPosition([14.6396, 121.0786]); 

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        if (Date.now() - lastUpdate > 2000 && liveTracking) {
          setUserPosition(coords);
          lastUpdateRef.current = Date.now();
        }
      }, );

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

  const groupedCRs = React.useMemo(() => {
    const groups = {};
    crs.forEach((cr) => {
      const key = `${cr.latitude},${cr.longitude}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(cr);
    });
    return Object.values(groups);
  }, [crs]);

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

        {groupedCRs.map((crGroup) => {
          const firstCr = crGroup[0];
          return (
            <Marker 
              key={`${firstCr.latitude},${firstCr.longitude}`} 
              position={[firstCr.latitude, firstCr.longitude]}
            >
              <Popup>
                <CRPopupContent 
                  crGroup={crGroup} 
                  onNavigate={handleNavigation} 
                  onLeaveReview={handleLeaveReviewClick} 
                />
              </Popup>
            </Marker>
          );
        })}

    <Marker 
          position={userPosition}
          icon={userIcon}
          draggable={!liveTracking} 
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const newPos = marker.getLatLng();
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
        Stop Navigation
    </button>
    )}
    
    </div>
    
  );
};
export default Map;


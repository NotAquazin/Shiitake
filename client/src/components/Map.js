import React from 'react';
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
  const position = [14.6396, 121.0786]; 
  const navigate = useNavigate();

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
        maxZoom={19}
      />

       <Marker 
      position={[14.639453, 121.076514]}>\
        <Popup> 
        <div style={{ width: "300px", fontFamily: "Arial, sans-serif" }}>
            <h3>Comfort Room Info</h3>
            <p><strong>Building:</strong> Faura Hall</p>
            <p><strong>Floor:</strong> 1st Floor</p>
            <p><strong>CR Availability:</strong> Available</p>
            <h4>Amenities</h4>
            <div>
              <span className="tag tag-working">Toilet Paper Available</span>
              <span className="tag tag-working">Soap Dispenser Full</span>
              <span className="tag tag-working">Aircon Broken</span>
            </div>
            <button onClick={() => handleLeaveReviewClick("faura-1")}>
              Leave Review</button>
          </div>
        </Popup> 
      </Marker>

       <Marker 
      position={[14.639427, 121.076953]}>
        <Popup> 
        <div style={{ width: "300px", fontFamily: "Arial, sans-serif" }}>
            <h3>Comfort Room Info</h3>
            <p><strong>Building:</strong> Faura Hall</p>
            <p><strong>Floor:</strong> 1st Floor</p>
            <p><strong>CR Availability:</strong> Available</p>
            <h4>Amenities</h4>
            <div>
              <span className="tag tag-working">Toilet Paper Available</span>
              <span className="tag tag-working">Soap Dispenser Full</span>
              <span className="tag tag-working">Aircon Broken</span>
            </div>
            <button onClick={() => handleLeaveReviewClick("faura-1")}>
              Leave Review</button>
          </div></Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;


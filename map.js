// Initialize map
// ADMU coordinates - 14.6396° N, 121.0786° E
// Zoom Level - 17
var map = L.map('map').setView([14.6396, 121.0786], 17);

// OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

coordinateChecker = L.marker([14.6396, 121.0786], {
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

coordinateChecker.bindPopup(`<div> <p>${coordinateChecker.getLatLng().lat.toFixed(6)}, ${coordinateChecker.getLatLng().lng.toFixed(6)}</p> </div>`)

faura1CR = L.marker([14.639453, 121.076514], {
}).addTo(map);

faura1CR.bindPopup(`
    <div style="width:300px; font-family:Arial, sans-serif;">
        <h3>Comfort Room Info</h3>
        <p><strong>Building:</strong> Faura Hall</p>
        <p><strong>Floor:</strong> 1st Floor</p>
        <p><strong>CR Availability:</strong> Available</p>
        <h4>Amenities</h4>
        <div>
            <span class = "tag tag-working"> Toilet Paper Available</span>
            <span "tag tag-working"> Soap Dispenser Full</span>
            <span "tag tag-working"> Aircon Broken</span>
        </ul>
        <button>Leave Review</button>
    </div>
`).openPopup();

faura2CR = L.marker([14.639427, 121.076953], {
}).addTo(map);

faura2CR.bindPopup(`
    <div style="width:300px; font-family:Arial, sans-serif;">
        <h3>Comfort Room Info</h3>
        <p><strong>Building:</strong> Faura Hall</p>
        <p><strong>Floor:</strong> 2nd Floor</p>
        <p><strong>CR Availability:</strong> Available</p>
        <h4>Amenities</h4>
        <div>
            <span class = "tag tag-working"> Toilet Paper Available</span>
            <span "tag tag-working"> Soap Dispenser Full</span>
            <span "tag tag-working"> Aircon Broken</span>
        </ul>
        <button>Leave Review</button>
    </div>
`).openPopup();

    // bind a coulpe of markers
    // set bounds
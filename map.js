// Initialize map
// ADMU coordinates - 14.6396° N, 121.0786° E
// Zoom Level - 17
var map = L.map('map').setView([14.6396, 121.0786], 17);

// OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);
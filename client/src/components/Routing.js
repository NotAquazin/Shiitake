import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

const Routing = ({ from, to }) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map || !from || !to) return;

        // Initialize the control
        const control = L.Routing.control({
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://routing.openstreetmap.de/routed-foot/route/v1',
            profile: 'foot',
            urlParameters: {
                weighting: 'shortest' 
            }

        }),
        lineOptions: { styles: [{ color: "#6FA1EC", weight: 5 }] },
        addWaypoints: false,
        draggableWaypoints: true,
        fitSelectedRoutes: true,
        show: true,
        });

        routingControlRef.current = control;
        control.addTo(map);

        // cleanup
        return () => {
        if (routingControlRef.current) {
            try {
                routingControlRef.current.setWaypoints([]);
                map.removeControl(routingControlRef.current);
            } catch (e) {
                const container = routingControlRef.current.getContainer();
                if (container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
            routingControlRef.current = null;
        }
        };
    }, [map, from, to]);

    return null;
};

export default Routing;
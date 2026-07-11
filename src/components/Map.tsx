import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface MapProps {
  properties?: Array<{
    id: string;
    title: string;
    price: number;
    location: string;
    lat?: number;
    lng?: number;
  }>;
  onMarkerClick?: (id: string) => void;
}

const Map = ({ properties = [], onMarkerClick }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        zoom: 10,
        center: [-58.4173, -34.6118], // Buenos Aires
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsMapReady(true);
      });

      // Add markers for properties with coordinates
      properties.forEach((property) => {
        if (property.lat && property.lng) {
          // Create popup content using DOM manipulation to prevent XSS
          const popupContent = document.createElement('div');
          popupContent.className = 'p-2';
          
          const titleEl = document.createElement('h3');
          titleEl.className = 'font-semibold text-sm';
          titleEl.textContent = property.title; // Safe: uses textContent, not innerHTML
          
          const priceEl = document.createElement('p');
          priceEl.className = 'text-primary font-bold';
          priceEl.textContent = `$${property.price.toLocaleString('es-AR')}/mes`;
          
          popupContent.appendChild(titleEl);
          popupContent.appendChild(priceEl);

          const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);

          const marker = new mapboxgl.Marker({ color: '#4a9f7f' })
            .setLngLat([property.lng, property.lat])
            .setPopup(popup)
            .addTo(map.current!);

          marker.getElement().addEventListener('click', () => {
            onMarkerClick?.(property.id);
          });
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [token, properties, onMarkerClick]);

  if (!token) {
    return (
      <div className="bg-card rounded-2xl border p-8 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-body text-lg font-semibold mb-2">Mapa no disponible</h3>
        <p className="text-sm text-muted-foreground">
          Este mapa todavía no está configurado. Intentá de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border bg-muted">
      <div ref={mapContainer} className="absolute inset-0" />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse text-muted-foreground">Cargando mapa...</div>
        </div>
      )}
    </div>
  );
};

export default Map;

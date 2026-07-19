import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [-58.4173, -34.6118]; // Buenos Aires

const LocationPicker = ({ initialLat, initialLng, onChange }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const placeMarker = (lat: number, lng: number, flyTo = false) => {
    if (!map.current) return;
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new mapboxgl.Marker({ color: '#E63329', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current);
      marker.current.on('dragend', () => {
        const pos = marker.current!.getLngLat();
        onChange(pos.lat, pos.lng);
      });
    }
    if (flyTo) map.current.flyTo({ center: [lng, lat], zoom: 15 });
    onChange(lat, lng);
  };

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    const startCenter: [number, number] =
      initialLat && initialLng ? [initialLng, initialLat] : DEFAULT_CENTER;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: initialLat && initialLng ? 15 : 11,
      center: startCenter,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('load', () => setMapLoaded(true));

    if (initialLat && initialLng) {
      placeMarker(initialLat, initialLng);
    }

    map.current.on('click', (e) => {
      placeMarker(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude, true);
        setLocating(false);
      },
      () => {
        toast.error('No pudimos acceder a tu ubicación. Marcá el punto manualmente en el mapa.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!token) {
    return (
      <div className="bg-card rounded-xl border p-6 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Mapa no disponible en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full h-64 rounded-xl overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 backdrop-blur-sm pointer-events-none">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Cargando el mapa...</p>
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleUseCurrentLocation}
        disabled={locating}
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        Usar mi ubicación actual
      </Button>
      <p className="text-xs text-muted-foreground">
        Tocá el mapa para marcar el punto exacto, o arrastrá el pin una vez colocado.
      </p>
    </div>
  );
};

export default LocationPicker;

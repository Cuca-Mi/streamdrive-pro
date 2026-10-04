import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { navigationGps, GpsLocation, ActiveRoute } from '../services/navigationGps';
import { NavDestination } from '../types';
import {
  Navigation,
  Compass,
  Fuel,
  SquareParking,
  Utensils,
  Hospital,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Volume2,
} from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';

interface GpsDashboardProps {
  compact?: boolean;
  onClose?: () => void;
}

export const GpsDashboard: React.FC<GpsDashboardProps> = ({ compact = false, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [location, setLocation] = useState<GpsLocation>(navigationGps.getCurrentLocation());
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(navigationGps.getActiveRoute());
  const [pois, setPois] = useState<NavDestination[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<NavDestination | null>(null);

  useEffect(() => {
    setPois(navigationGps.getNearbyPOIs());

    const unsubLoc = navigationGps.subscribeLocation((loc) => {
      setLocation(loc);
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([loc.lat, loc.lng]);
        if (!activeRoute) {
          mapInstanceRef.current.panTo([loc.lat, loc.lng]);
        }
      }
    });

    const unsubRoute = navigationGps.subscribeRoute((route) => {
      setActiveRoute(route);
      updateRouteOnMap(route);
    });

    return () => {
      unsubLoc();
      unsubRoute();
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: !compact,
        attributionControl: false,
      }).setView([location.lat, location.lng], compact ? 15 : 16);

      // CartoDB Dark Matter tiles for ultra-clean automotive GPS look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom Car GPS Marker
      const carIcon = L.divIcon({
        className: 'custom-car-marker',
        html: `
          <div style="transform: rotate(${location.heading}deg);" class="flex items-center justify-center w-10 h-10 bg-indigo-600 border-2 border-white rounded-full shadow-2xl ring-4 ring-indigo-500/30 text-white">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L4 21l8-4 8 4L12 2z"/>
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([location.lat, location.lng], { icon: carIcon }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Add POI markers
      pois.forEach((poi) => {
        const poiIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="px-2 py-1 bg-neutral-900 border border-neutral-700 text-xs text-white rounded-md shadow-md flex items-center gap-1 font-semibold whitespace-nowrap">
              <span>📍</span> ${poi.name.split(' ')[0]}
            </div>
          `,
          iconSize: [80, 24],
          iconAnchor: [40, 24],
        });

        const pMarker = L.marker([poi.lat, poi.lng], { icon: poiIcon }).addTo(map);
        pMarker.on('click', () => handleSelectPoi(poi));
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updateRouteOnMap = (route: ActiveRoute | null) => {
    if (!mapInstanceRef.current) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (route && route.polyline.length > 0) {
      const polyline = L.polyline(route.polyline, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = polyline;
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  };

  const handleSelectPoi = (poi: NavDestination) => {
    setSelectedPoi(poi);
    const route = navigationGps.calculateRoute(poi);
    voiceAssistant.speak(`Iniciando navegação para ${poi.name}. Distância de ${poi.distanceKm} quilômetros.`);
  };

  const handleCancelRoute = () => {
    navigationGps.cancelRoute();
    setSelectedPoi(null);
    voiceAssistant.speak('Rota cancelada.');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.lat, location.lng], 16);
    }
  };

  const isSpeeding = location.speedKmH > navigationGps.getSpeedLimit();

  return (
    <div className={`relative flex flex-col h-full w-full bg-neutral-900 text-neutral-100 overflow-hidden ${compact ? 'rounded-xl border border-neutral-800' : ''}`}>
      {/* Turn-by-Turn Instruction Banner */}
      {activeRoute && activeRoute.steps.length > 0 && (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg animate-pulse">
              <Navigation className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <span>Instrução de Condução</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400 font-bold">Trânsito Livre (-{activeRoute.avoidedCongestionMin}min)</span>
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                {activeRoute.steps[0].instruction}
              </p>
              <p className="text-xs text-neutral-400">
                Destino: {activeRoute.destination.name} • ETA {activeRoute.etaMinutes} min ({activeRoute.totalDistanceKm} km)
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelRoute}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-300 hover:text-white transition"
            title="Cancelar rota"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Map Surface */}
      <div ref={mapContainerRef} className="flex-1 w-full min-h-[240px] z-0" />

      {/* Speedometer & Navigation Stats Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2">
        {/* Speedometer HUD */}
        <div
          className={`flex items-baseline gap-1 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-2xl transition ${
            isSpeeding
              ? 'bg-rose-950/90 border-rose-500 text-rose-300 ring-2 ring-rose-500/50 animate-bounce'
              : 'bg-neutral-900/90 border-neutral-700 text-white'
          }`}
        >
          <span className="text-3xl font-extrabold font-mono tracking-tight">{location.speedKmH}</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-neutral-400 leading-none">km/h</span>
            <span className="text-[9px] font-semibold text-neutral-400">Limite {navigationGps.getSpeedLimit()}</span>
          </div>
        </div>

        {/* Location Street Info */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-neutral-900/90 border border-neutral-700/80 rounded-2xl backdrop-blur-md text-xs text-neutral-200 shadow-xl">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium truncate max-w-[200px]">{location.streetName}</span>
        </div>
      </div>

      {/* Quick POI Shortcuts for Urban Transit */}
      <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 bg-neutral-900/95 border border-neutral-700 p-1.5 rounded-2xl backdrop-blur-md shadow-2xl">
        <button
          onClick={() => pois[0] && handleSelectPoi(pois[0])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-semibold transition"
          title="Posto mais próximo"
        >
          <Fuel className="w-4 h-4" />
          <span className="hidden md:inline">Posto</span>
        </button>
        <button
          onClick={() => pois[1] && handleSelectPoi(pois[1])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-blue-300 text-xs font-semibold transition"
          title="Estacionamento"
        >
          <SquareParking className="w-4 h-4" />
          <span className="hidden md:inline">Estacionar</span>
        </button>
        <button
          onClick={() => pois[2] && handleSelectPoi(pois[2])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-xs font-semibold transition"
          title="Restaurante Drive-thru"
        >
          <Utensils className="w-4 h-4" />
          <span className="hidden md:inline">Comer</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-900/50 text-neutral-400 hover:text-rose-200 text-xs font-semibold transition"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

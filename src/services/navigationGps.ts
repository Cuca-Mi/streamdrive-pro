import { NavDestination } from '../types';

export interface GpsLocation {
  lat: number;
  lng: number;
  heading: number;
  speedKmH: number;
  altitude: number | null;
  accuracy: number;
  streetName: string;
}

export interface RouteInstruction {
  id: string;
  instruction: string;
  distanceMeters: number;
  icon: 'straight' | 'right' | 'left' | 'roundabout' | 'destination';
  roadName: string;
}

export interface ActiveRoute {
  destination: NavDestination;
  totalDistanceKm: number;
  etaMinutes: number;
  currentStepIndex: number;
  steps: RouteInstruction[];
  polyline: [number, number][];
  trafficCondition: 'livre' | 'moderado' | 'intenso';
  avoidedCongestionMin: number;
}

type GpsListener = (location: GpsLocation) => void;
type RouteListener = (route: ActiveRoute | null) => void;

class NavigationGpsService {
  private watchId: number | null = null;
  private currentLocation: GpsLocation = {
    lat: -23.561684,
    lng: -46.655981,
    heading: 45,
    speedKmH: 48,
    altitude: 760,
    accuracy: 5,
    streetName: 'Av. Paulista, São Paulo',
  };
  private activeRoute: ActiveRoute | null = null;
  private locationListeners: Set<GpsListener> = new Set();
  private routeListeners: Set<RouteListener> = new Set();
  private speedLimit: number = 60;
  private simInterval: number | null = null;

  constructor() {
    this.startGpsTracking();
  }

  public subscribeLocation(fn: GpsListener) {
    this.locationListeners.add(fn);
    fn(this.currentLocation);
    return () => {
      this.locationListeners.delete(fn);
    };
  }

  public subscribeRoute(fn: RouteListener) {
    this.routeListeners.add(fn);
    fn(this.activeRoute);
    return () => {
      this.routeListeners.delete(fn);
    };
  }

  public getCurrentLocation(): GpsLocation {
    return this.currentLocation;
  }

  public getActiveRoute(): ActiveRoute | null {
    return this.activeRoute;
  }

  public getSpeedLimit(): number {
    return this.speedLimit;
  }

  public startGpsTracking() {
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const speedRaw = pos.coords.speed;
          const speedKmH = speedRaw !== null ? Math.round(speedRaw * 3.6) : this.currentLocation.speedKmH;

          this.currentLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || this.currentLocation.heading,
            speedKmH: Math.max(0, speedKmH),
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            streetName: this.currentLocation.streetName,
          };
          this.notifyLocation();
        },
        (err) => {
          console.warn('[NavigationGPS] Real GPS fallback to automotive simulator:', err.message);
          this.startSimulatedDrive();
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    } else {
      this.startSimulatedDrive();
    }
  }

  // Smooth simulation for smooth demo when browser blocks GPS in iframe or on desktop
  private startSimulatedDrive() {
    if (this.simInterval) return;

    this.simInterval = window.setInterval(() => {
      // Simulate slight movement along avenue
      const deltaLat = (Math.random() - 0.48) * 0.0003;
      const deltaLng = (Math.random() - 0.48) * 0.0003;
      const randomSpeed = Math.round(42 + Math.random() * 16);

      this.currentLocation = {
        lat: this.currentLocation.lat + deltaLat,
        lng: this.currentLocation.lng + deltaLng,
        heading: (this.currentLocation.heading + (Math.random() * 4 - 2) + 360) % 360,
        speedKmH: randomSpeed,
        altitude: 760,
        accuracy: 4,
        streetName: 'Av. Paulista / Corredor Norte-Sul',
      };
      this.notifyLocation();
    }, 2000);
  }

  private notifyLocation() {
    this.locationListeners.forEach((fn) => fn(this.currentLocation));
  }

  private notifyRoute() {
    this.routeListeners.forEach((fn) => fn(this.activeRoute));
  }

  public getNearbyPOIs(): NavDestination[] {
    const { lat, lng } = this.currentLocation;
    return [
      {
        id: 'poi-gas-1',
        name: 'Posto Shell V-Power & Conveniência 24h',
        category: 'gas',
        distanceKm: 0.8,
        etaMinutes: 3,
        lat: lat + 0.005,
        lng: lng + 0.004,
        address: 'Av. Paulista, 1200 - Posto & Troca de Óleo',
      },
      {
        id: 'poi-parking-1',
        name: 'Estacionamento Rotativo Seguro Estapar',
        category: 'parking',
        distanceKm: 1.2,
        etaMinutes: 5,
        lat: lat - 0.004,
        lng: lng + 0.006,
        address: 'R. Augusta, 1420 - Vagas Cobertas',
      },
      {
        id: 'poi-food-1',
        name: 'Drive-Thru & Restaurante Alameda',
        category: 'food',
        distanceKm: 2.1,
        etaMinutes: 7,
        lat: lat + 0.008,
        lng: lng - 0.003,
        address: 'Al. Santos, 850',
      },
      {
        id: 'poi-hospital-1',
        name: 'Hospital & Pronto-Socorro 24 Horas',
        category: 'hospital',
        distanceKm: 2.9,
        etaMinutes: 9,
        lat: lat - 0.009,
        lng: lng - 0.007,
        address: 'R. Frei Caneca, 980',
      },
    ];
  }

  public calculateRoute(destination: NavDestination): ActiveRoute {
    const curLat = this.currentLocation.lat;
    const curLng = this.currentLocation.lng;

    // Generate polyline steps
    const midLat = (curLat + destination.lat) / 2 + 0.001;
    const midLng = (curLng + destination.lng) / 2 - 0.001;

    const polyline: [number, number][] = [
      [curLat, curLng],
      [curLat + (midLat - curLat) * 0.5, curLng + (midLng - curLng) * 0.5],
      [midLat, midLng],
      [destination.lat - 0.001, destination.lng - 0.001],
      [destination.lat, destination.lng],
    ];

    const steps: RouteInstruction[] = [
      {
        id: 'step-1',
        instruction: 'Siga em frente pela ' + this.currentLocation.streetName,
        distanceMeters: 450,
        icon: 'straight',
        roadName: this.currentLocation.streetName,
      },
      {
        id: 'step-2',
        instruction: 'Em 300m, vire à direita na ' + destination.address.split(',')[0],
        distanceMeters: 300,
        icon: 'right',
        roadName: destination.address.split(',')[0],
      },
      {
        id: 'step-3',
        instruction: 'Destino à sua direita: ' + destination.name,
        distanceMeters: 100,
        icon: 'destination',
        roadName: destination.address,
      },
    ];

    this.activeRoute = {
      destination,
      totalDistanceKm: destination.distanceKm,
      etaMinutes: destination.etaMinutes,
      currentStepIndex: 0,
      steps,
      polyline,
      trafficCondition: 'livre',
      avoidedCongestionMin: 8,
    };

    this.notifyRoute();
    return this.activeRoute;
  }

  public cancelRoute() {
    this.activeRoute = null;
    this.notifyRoute();
  }
}

export const navigationGps = new NavigationGpsService();

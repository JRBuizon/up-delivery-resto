// constants/locations.ts
// Copied from the customer app (up-delivery/src/constants/locations.ts) so both apps
// share the same campus coordinates. Keep these two files in sync.

export interface CampusLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { name: 'Melchor Hall (Lobby)', latitude: 14.656168, longitude: 121.069692 },
  { name: 'Palma Hall (AS Steps)', latitude: 14.653846, longitude: 121.069882 },
  { name: 'CS Library (Velasquez)', latitude: 14.64941, longitude: 121.069247 },
  { name: 'Sunken Garden Grandstand', latitude: 14.655119, longitude: 121.072859 },
  { name: 'Kalayaan Residence Hall', latitude: 14.65882, longitude: 121.068782 },
  { name: 'Quezon Hall (Oblation Plaza)', latitude: 14.6548, longitude: 121.0644 },
  { name: 'Vinzons Hall (Lobby)', latitude: 14.6553, longitude: 121.0741 },
  { name: 'Main Library (Gonzalez Hall)', latitude: 14.6548, longitude: 121.0683 },
  { name: 'NIP / Science Complex', latitude: 14.6479, longitude: 121.0718 },
  { name: 'Plaridel Hall (Maskom)', latitude: 14.6536, longitude: 121.0631 },
];

// Rough bounding box around UP Diliman, used to warn (not block) if a pin looks off-campus.
export const UPD_BOUNDS = {
  minLat: 14.64,
  maxLat: 14.665,
  minLng: 121.055,
  maxLng: 121.08,
};

/** Approximate campus-AREA centre from the project roadmap. NOT a building location. */
export const CAMPUS_CENTER = { lat: 33.713855, lng: 73.022473 } as const;
export const CAMPUS_ZOOM = 16;
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const ROUTING_URL = (import.meta.env.VITE_ROUTING_PROVIDER_URL as string | undefined)?.replace(/\/$/, '') || '';
export const ROUTING_PROFILE = (import.meta.env.VITE_ROUTING_PROFILE as string | undefined) || 'foot';
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const DISCLAIMER =
  'Independent student project. Not an official Air University service unless institutional approval is obtained.';

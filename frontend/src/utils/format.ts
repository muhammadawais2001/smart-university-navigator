import type { Location, VerificationStatus } from '../types';
export const hasCoords = (l: Location): l is Location & { latitude: number; longitude: number } =>
  l.latitude !== null && l.longitude !== null;
export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : null);
export const STATUS_LABEL: Record<VerificationStatus, string> = {
  VERIFIED: 'Verified', NEEDS_CONFIRMATION: 'Needs confirmation', DEMO_ONLY: 'Demo only',
};
export const ACCESS_LABEL = { PUBLIC: 'Open to the public', RESTRICTED: 'Restricted access', UNKNOWN: 'Public access not confirmed' } as const;
export const FEEDBACK_LABEL = {
  INCORRECT_LOCATION: 'Incorrect location', MISSING_LOCATION: 'Missing location',
  INCORRECT_BUILDING_INFO: 'Incorrect building information', INACCESSIBLE_ROUTE: 'Inaccessible route',
  INCORRECT_OPENING_HOURS: 'Incorrect opening hours', OTHER: 'Other problem',
} as const;

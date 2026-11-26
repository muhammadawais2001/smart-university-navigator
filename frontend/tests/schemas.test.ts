import { describe, expect, it } from 'vitest';
import { feedbackSchema, locationFormSchema, loginSchema } from '../src/utils/schemas';

const base = { name: 'Test', publicAccess: 'UNKNOWN', verificationStatus: 'NEEDS_CONFIRMATION', isPublished: false, latitude: null, longitude: null, entranceLatitude: null, entranceLongitude: null };
describe('form validation', () => {
  it('requires 10+ chars in feedback', () => expect(feedbackSchema.safeParse({ type: 'OTHER', description: 'short' }).success).toBe(false));
  it('accepts valid feedback', () => expect(feedbackSchema.safeParse({ type: 'OTHER', description: 'Library hours are wrong.' }).success).toBe(true));
  it('rejects bad login email', () => expect(loginSchema.safeParse({ email: 'x', password: 'secret1' }).success).toBe(false));
  it('rejects VERIFIED without coordinates', () => expect(locationFormSchema.safeParse({ ...base, verificationStatus: 'VERIFIED' }).success).toBe(false));
  it('rejects a lone latitude', () => expect(locationFormSchema.safeParse({ ...base, latitude: 33.7 }).success).toBe(false));
  it('rejects out-of-range coordinates', () => expect(locationFormSchema.safeParse({ ...base, latitude: 120, longitude: 73 }).success).toBe(false));
  it('treats empty strings as null coordinates', () => expect(locationFormSchema.safeParse({ ...base, latitude: '', longitude: '' }).success).toBe(true));
  it('accepts VERIFIED with coordinates', () => expect(locationFormSchema.safeParse({ ...base, verificationStatus: 'VERIFIED', latitude: 33.7, longitude: 73.0 }).success).toBe(true));
});

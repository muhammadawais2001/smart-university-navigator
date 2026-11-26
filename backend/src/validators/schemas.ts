import { z } from 'zod';

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const text = (max: number) => z.string().trim().max(max);

export const verificationStatus = z.enum(['VERIFIED', 'NEEDS_CONFIRMATION', 'DEMO_ONLY']);
export const publicAccess = z.enum(['PUBLIC', 'RESTRICTED', 'UNKNOWN']);

export const locationBase = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  description: text(2000).nullish(),
  categoryId: z.string().uuid().nullish(),
  buildingName: text(150).nullish(),
  latitude: lat.nullish(),
  longitude: lng.nullish(),
  entranceLatitude: lat.nullish(),
  entranceLongitude: lng.nullish(),
  aliases: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  imageUrl: z.string().url().max(500).nullish(),
  openingHours: text(300).nullish(),
  accessibilityNotes: text(1000).nullish(),
  publicAccess: publicAccess.default('UNKNOWN'),
  verificationStatus: verificationStatus.default('NEEDS_CONFIRMATION'),
  isPublished: z.boolean().default(false),
});

export interface CoordState {
  latitude?: number | null; longitude?: number | null;
  entranceLatitude?: number | null; entranceLongitude?: number | null;
  verificationStatus?: string;
}
/** Returns an error message or null. Shared by create and (merged) update. */
export function coordinateRuleError(v: CoordState): string | null {
  if ((v.latitude == null) !== (v.longitude == null)) return 'Latitude and longitude must be provided together';
  if ((v.entranceLatitude == null) !== (v.entranceLongitude == null))
    return 'Entrance latitude and longitude must be provided together';
  if (v.verificationStatus === 'VERIFIED' && v.latitude == null)
    return 'A VERIFIED location must have verified coordinates';
  return null;
}

export const locationCreate = locationBase.superRefine((v, ctx) => {
  const msg = coordinateRuleError(v);
  if (msg) ctx.addIssue({ code: 'custom', message: msg, path: ['latitude'] });
});
export const locationUpdate = locationBase.partial();

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');
export const locationQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  status: verificationStatus.optional(),
  includeUnpublished: bool.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200),
});
export const searchQuery = z.object({
  q: z.string().trim().min(1).max(100),
  category: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const categoryCreate = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  icon: text(40).nullish(),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});
export const categoryUpdate = categoryCreate.partial();

export const announcementCreate = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().min(1).max(5000),
    category: text(60).nullish(),
    imageUrl: z.string().url().max(500).nullish(),
    publishedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().nullish(),
    isPublished: z.boolean().default(false),
  })
  .refine((v) => !v.expiresAt || !v.publishedAt || v.expiresAt > v.publishedAt, {
    message: 'Expiry must be after publication date',
    path: ['expiresAt'],
  });
export const announcementUpdate = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  category: text(60).nullish(),
  imageUrl: z.string().url().max(500).nullish(),
  publishedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullish(),
  isPublished: z.boolean().optional(),
});
export const announcementQuery = z.object({
  includeAll: bool.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const feedbackCreate = z.object({
  type: z.enum(['INCORRECT_LOCATION', 'MISSING_LOCATION', 'INCORRECT_BUILDING_INFO',
    'INACCESSIBLE_ROUTE', 'INCORRECT_OPENING_HOURS', 'OTHER']),
  locationId: z.string().uuid().nullish(),
  description: z.string().trim().min(10).max(2000),
  contact: text(200).nullish(),
  website: z.string().max(0).optional(), // honeypot: real users leave it empty
});
export const feedbackUpdate = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED']),
  adminNotes: text(2000).nullish(),
});
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED']).optional(),
});
export const roleUpdate = z.object({ role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']) });

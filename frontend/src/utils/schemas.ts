import { z } from 'zod';

const optNum = (min: number, max: number) =>
  z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? null : Number(v)), z.number().min(min).max(max).nullable());

export const feedbackSchema = z.object({
  type: z.enum(['INCORRECT_LOCATION', 'MISSING_LOCATION', 'INCORRECT_BUILDING_INFO', 'INACCESSIBLE_ROUTE', 'INCORRECT_OPENING_HOURS', 'OTHER']),
  locationId: z.string().optional(),
  description: z.string().trim().min(10, 'Please describe the problem (at least 10 characters)').max(2000),
  contact: z.string().trim().max(200).optional(),
  website: z.string().max(0).optional(),
});
export type FeedbackForm = z.infer<typeof feedbackSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password is required'),
});

export const locationFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(150),
    categoryId: z.string().optional(),
    buildingName: z.string().trim().max(150).optional(),
    description: z.string().trim().max(2000).optional(),
    aliases: z.string().max(800).optional(), // comma separated
    latitude: optNum(-90, 90),
    longitude: optNum(-180, 180),
    entranceLatitude: optNum(-90, 90),
    entranceLongitude: optNum(-180, 180),
    openingHours: z.string().trim().max(300).optional(),
    accessibilityNotes: z.string().trim().max(1000).optional(),
    publicAccess: z.enum(['PUBLIC', 'RESTRICTED', 'UNKNOWN']),
    verificationStatus: z.enum(['VERIFIED', 'NEEDS_CONFIRMATION', 'DEMO_ONLY']),
    isPublished: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if ((v.latitude === null) !== (v.longitude === null))
      ctx.addIssue({ code: 'custom', path: ['latitude'], message: 'Enter both latitude and longitude, or neither' });
    if ((v.entranceLatitude === null) !== (v.entranceLongitude === null))
      ctx.addIssue({ code: 'custom', path: ['entranceLatitude'], message: 'Enter both entrance values, or neither' });
    if (v.verificationStatus === 'VERIFIED' && v.latitude === null)
      ctx.addIssue({ code: 'custom', path: ['verificationStatus'], message: 'VERIFIED requires verified coordinates' });
  });
export type LocationForm = z.infer<typeof locationFormSchema>;

export const announcementFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  category: z.string().trim().max(60).optional(),
  expiresAt: z.string().optional(),
  isPublished: z.boolean(),
});
export type AnnouncementForm = z.infer<typeof announcementFormSchema>;

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type VerificationStatus = 'VERIFIED' | 'NEEDS_CONFIRMATION' | 'DEMO_ONLY';
export type PublicAccess = 'PUBLIC' | 'RESTRICTED' | 'UNKNOWN';
export type FeedbackStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
export type FeedbackType = 'INCORRECT_LOCATION' | 'MISSING_LOCATION' | 'INCORRECT_BUILDING_INFO' | 'INACCESSIBLE_ROUTE' | 'INCORRECT_OPENING_HOURS' | 'OTHER';

export interface Category { id: string; name: string; slug: string; icon: string | null; sortOrder: number }
export interface Location {
  id: string; name: string; slug: string; description: string | null;
  categoryId: string | null; category: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null;
  buildingName: string | null; latitude: number | null; longitude: number | null;
  entranceLatitude: number | null; entranceLongitude: number | null;
  aliases: string[]; imageUrl: string | null; openingHours: string | null; accessibilityNotes: string | null;
  publicAccess: PublicAccess; verificationStatus: VerificationStatus; isPublished: boolean;
  createdAt: string; updatedAt: string; lastVerifiedAt: string | null; verifiedBy: string | null;
}
export interface Announcement {
  id: string; title: string; description: string; category: string | null; imageUrl: string | null;
  publishedAt: string; expiresAt: string | null; isPublished: boolean;
}
export interface FeedbackReport {
  id: string; type: FeedbackType; locationId: string | null; location: { id: string; name: string } | null;
  description: string; contact: string | null; status: FeedbackStatus; adminNotes: string | null; createdAt: string;
}
export interface AuditLog { id: number; actorEmail: string | null; action: string; entityType: string; entityId: string | null; details: Record<string, unknown>; createdAt: string }
export interface DashboardStats {
  totalLocations: number; publishedLocations: number; verifiedLocations: number;
  unverifiedLocations: number; pendingFeedback: number; publishedAnnouncements: number;
}
export interface Meta { total: number; page: number; pageSize: number }
export interface LatLng { lat: number; lng: number }

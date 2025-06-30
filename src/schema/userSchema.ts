import { accounts, sessions, userProfiles, users, verificationTokens } from '@/schema/userTables';

export type UserRole = NonNullable<typeof users.$inferSelect.role>;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;


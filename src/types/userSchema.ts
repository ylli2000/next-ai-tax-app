export type UserRole = 'USER' | 'ACCOUNTANT' | 'ADMIN';

export type User = {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type UserProfile = {
    id: string;
    userId: string;
    displayName: string | null;
    timezone: string | null;
    language: string;
    theme: 'LIGHT' | 'DARK' | 'SYSTEM';
    notificationsEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateUserData = {
    email: string;
    name?: string;
    role?: UserRole;
};

export type UpdateUserData = Partial<Pick<User, 'name' | 'role'>>;

export type UpdateUserProfileData = Partial<Pick<UserProfile, 'displayName' | 'timezone' | 'language' | 'theme' | 'notificationsEnabled'>>; 
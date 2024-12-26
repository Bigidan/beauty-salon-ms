export type Client = {
    userId: number | null;
    clientId: number;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    contactInfo: string | null;
    loyaltyPoints: number | null;
    password?: string;
};
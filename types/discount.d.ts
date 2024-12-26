export type Discount = {
    id: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    value: number;
    conditions: string | null;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
};
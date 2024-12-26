export type Service = {
    servicesId: number
    name: string;
    description: string | null;
    price: number;
    duration: number;
    isHidden: boolean | null;
};
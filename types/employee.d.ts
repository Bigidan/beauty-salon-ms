export type Employee = {
    employeeId: number;
    fullName: string;
    phone: string;
    isWorking: boolean;
    services: Array<{
        serviceId: number;
        name: string;
    }> | [];
};
export type Schedule = {
    schedules: {
        scheduleId: number;
        employeeId: number | null;
        workDate: Date;
        startDate: Date | null;
        endDate: Date | null;
        isActive: boolean
    }
    employees: {
        employeeId: number;
        fullName: string;
        role: string;
        phone: string
    } | null
}
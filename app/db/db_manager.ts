"use server";

import {and, eq, gte, like, lte, ne, sql, sum} from 'drizzle-orm';
import {db} from './index'; // Припускаємо, що це ваша ініціалізація drizzle ORM
import {
    appointmentsTable,
    clientDiscountsTable,
    clientsTable,
    discountsTable,
    employeesTable,
    schedulesTable, serviceEmployeesTable,
    servicesTable,
    userTable,
    visitHistoryTable
} from './schema';
import {hashPassword} from "@/lib/auth/jwt";
import {Client} from "@/types/client";
import {Service} from "@/types/service";
import {Discount as DiscType} from "@/types/discount";
import {Employee} from "@/types/employee";
import {addMinutes, endOfDay, startOfDay} from 'date-fns';

// --- Типи для моделі клієнтів ---
// type Discount = InferSelectModel<typeof discountsTable>;



// --- Функції для роботи з користувачами ---

/**
 * Видалення користувача
 * @param userId ID користувача
 */
export async function deleteUser(userId: number) {
    return db.delete(userTable).where(eq(userTable.userId, userId));
}

/**
 * Отримання списку користувачів враховуючи пагінацію
 * @param page Сторінка на якій знаходиться адміністратор
 * @param pageSize Кількість користувачів на сторінці
 */
export async function getUsersWithPagination(page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const [users, totalUsersCount] = await Promise.all([
        db
            .select()
            .from(userTable)
            .limit(pageSize)
            .offset(offset),
        db
            .select({ count: db.$count(userTable) })
            .from(userTable)
            .then(result => result[0].count)
    ]);

    return {
        users,
        totalPages: Math.ceil(totalUsersCount / pageSize),
        currentPage: page,
        totalUsers: totalUsersCount
    };
}

/**
 * Отримання списку користувачів враховуючи пагінацію
 * @param userId Айді користувача для оновлення
 * @param role Нова роль користувача
 * @param name Нове ім'я користувача
 * @param email Нова пошта користувача
 * @param phone Новий номер користувача
 */
export async function updateUser(userId: number, role: number, name: string, email: string, phone: string) {
    return db.update(userTable)
        .set({
            role: role,
            name: name,
            email: email,
            phone: phone,
        })
        .where(eq(userTable.userId, userId)).returning({ id: userTable.userId });
}

export async function searchUsers(userName: string) {
    return db.select().from(userTable).where(
        like(userTable.name, '%' + userName + '%')
    );
}



// --- Функції для роботи з клієнтами ---

/**
 * Отримання списку клієнтів враховуючи пагінацію
 * @param page Сторінка на якій знаходиться адміністратор
 * @param pageSize Кількість клієнтів на сторінці
 */
export async function getClientsWithPagination(page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const [clients, totalClientsCount] = await Promise.all([
        db
            .select({
                userId: clientsTable.userId,
                clientId: clientsTable.clientId,
                fullName: userTable.name,
                email: userTable.email,
                phone: userTable.phone,
                contactInfo: clientsTable.contactInfo,
                loyaltyPoints: clientsTable.loyaltyPoints,
                deactivate: clientsTable.deactivate,

            })
            .from(clientsTable)
            .leftJoin(userTable, eq(userTable.userId, clientsTable.userId))
            .limit(pageSize)
            .offset(offset),
        db
            .select({ count: db.$count(clientsTable) })
            .from(clientsTable)
            .then(result => result[0].count)
    ]);

    return {
        clients,
        totalPages: Math.ceil(totalClientsCount / pageSize),
        currentPage: page,
        totalUsers: totalClientsCount
    };
}

/**
 * Отримати всі дані про клієнта за його ID
 * @param clientId ID клієнта
 */
export async function getClientById(clientId: number) {
    return db.select().from(clientsTable).where(eq(clientsTable.clientId, clientId)).get();
}

export async function createClient(userId: number, contactInfo?: string | null) {
    return db.insert(clientsTable).values({
        userId: userId,
        contactInfo: contactInfo,
    });
}

/**
 * Додати нового клієнта
 * @param newClient Дані клієнта
 */
export async function createClientAndUser(newClient: Partial<Client>) {
    try {
        const hashes = await hashPassword(newClient.password || "default_password");
        // Створити запис у таблиці userTable
        const userId = await db.insert(userTable)
            .values({
                name: newClient.fullName!,
                email: newClient.email!,
                phone: newClient.phone!,
                password: hashes, // Генеруйте або хешуйте реальний пароль
            })
            .returning({ userId: userTable.userId });

        // Створити запис у таблиці clientsTable
        await db.insert(clientsTable)
            .values({
                userId: userId[0]?.userId,
                contactInfo: newClient.contactInfo,
                loyaltyPoints: newClient.loyaltyPoints || 0,
            })
            .run();
    } catch (error) {
        console.error("Помилка при створенні клієнта:", error);
        throw error;
    }
}

/**
 * Оновити дані клієнта
 * @param clientId ID клієнта
 * @param updates Об'єкт оновлення
 */
export async function updateClient(clientId: number, updates: Partial<Client>) {
    const { userId, contactInfo, loyaltyPoints, ...userUpdates } = updates;


    try {
        // Оновити дані в userTable
        if (userUpdates && Object.keys(userUpdates).length > 0) {
            await db.update(userTable)
                .set({
                    name: userUpdates.fullName || "",
                    email: userUpdates.email || "",
                    phone: userUpdates.phone || "",
                })
                .where(eq(userTable.userId, userId || 0)).returning({ id: userTable.userId })
                .run();
        }

            // Оновити дані в clientsTable
            await db.update(clientsTable)
                .set({
                    contactInfo,
                    loyaltyPoints,
                })
                .where(eq(clientsTable.clientId, clientId))
                .run();

    } catch (error) {
        console.error("Помилка при оновленні клієнта:", error);
        throw error;
    }
}

/**
 * Блокування / розблоковування користувачів
 * @param clientId ID клієнта
 * @param isDeactivated СТАРИЙ показник того, чи заблокований користувач. По стандарту `false`
 */
export async function toggleDeactivateClient(clientId: number, isDeactivated: boolean) {
    await db.update(clientsTable)
        .set({ deactivate: !isDeactivated })
        .where(eq(clientsTable.clientId, clientId)).run();
}

export async function searchClients(clientName: string) {
    return db.select({
        clientId: clientsTable.clientId,
        userId: userTable.userId,
        email: userTable.email,
        fullName: userTable.name,

    }).from(clientsTable)
        .leftJoin(userTable, eq(userTable.userId, clientsTable.userId))
        .where(
            like(userTable.name, '%' + clientName + '%')
        );
}


// --- Функції для послуг ---

/**
 * Отримання всіх послуг
 */
export async function getServices() {
    return db.select().from(servicesTable);
}

export async function toggleServiceVisibility(serviceId: number, isHidden: boolean) {
    await db.update(servicesTable)
        .set({ isHidden: !isHidden })
        .where(eq(servicesTable.servicesId, serviceId)).run();
}

export async function createService(formData: Partial<Service>) {
    const { description, price, duration} = formData;

    return db.insert(servicesTable).values({
        name: formData.name || "",
        description: description || "",
        price: price || 0,
        duration: duration || 0,
    }).returning({ id: servicesTable.servicesId });
}



// --- Функції для запису на послуги ---

/**
 * Запис клієнта на послугу
 * @param clientId ID клієнта
 * @param serviceId ID послуги
 * @param appointmentDate Дата запису
 * @param discountId (необов'язково) ID знижки
 */
// export async function bookAppointment(clientId: number, serviceId: number, appointmentDate: Date, discountId?: number) {
//     const service = await db.select().from(servicesTable).where(eq(servicesTable.servicesId, serviceId)).get();
//     if (!service) throw new Error('Послуга не знайдена');
//
//     let finalPrice = service.price;
//
//     // Якщо застосовується знижка
//     if (discountId) {
//         const discount = await db.select().from(discountsTable).where(eq(discountsTable.id, discountId)).get();
//         if (discount && discount.isActive) {
//             finalPrice = applyDiscount(service.price, discount);
//         }
//     }
//
//     return db.insert(appointmentsTable).values({
//         clientId,
//         serviceId,
//         appointmentDate: appointmentDate,
//         status: 'SCHEDULED',
//         price: finalPrice,
//         discountId: discountId || null
//     }).run();
// }

/**
 * Отримати записи клієнта
 * @param clientId ID клієнта
 */
export const getClientAppointments = async (clientId: number) => {
    try {
        const result = await db
            .select({
                id: appointmentsTable.id,
                clientName: userTable.name,
                serviceName: servicesTable.name,
                appointmentDate: appointmentsTable.appointmentDate,
                employeeId: serviceEmployeesTable.employeeId,
                duration: servicesTable.duration,
                employeeName: employeesTable.fullName,
            })
            .from(appointmentsTable)
            .leftJoin(clientsTable, eq(appointmentsTable.clientId, clientsTable.clientId))
            .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.servicesId))
            .leftJoin(userTable, eq(userTable.userId, clientsTable.userId))
            .leftJoin(serviceEmployeesTable, eq(servicesTable.servicesId, serviceEmployeesTable.serviceId))
            .leftJoin(employeesTable, eq(employeesTable.employeeId, serviceEmployeesTable.employeeId))
            .where(eq(appointmentsTable.clientId, clientId));

        return result.map(row => ({
            id: row.id,
            title: `${row.employeeName}\n${row.serviceName || 'Помилка(Послуга)'}`,
            start: row.appointmentDate
                ? new Date(row.appointmentDate)
                : null,
            employeeId: row.employeeId || null,
            end: addMinutes(new Date(row.appointmentDate), row.duration || 0),
        })).filter(item => item.start);
    } catch (error) {
        console.error('Помилка отримання даних:', error);
        throw error;
    }
};

/**
 * Оновити статус запису
 * @param appointmentId ID запису
 * @param status Новий статус
 */
export async function updateAppointmentStatus(appointmentId: number, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') {
    return db.update(appointmentsTable).set({ status }).where(eq(appointmentsTable.id, appointmentId)).run();
}



// --- Функції для керування знижками ---

/**
 * Автоматично застосувати знижку
 * @param originalPrice Початкова ціна
 * @param discount Знижка
 */
// function applyDiscount(originalPrice: number, discount: Discount) {
//     if (discount.discountType === 'PERCENTAGE') {
//         return originalPrice - (originalPrice * discount.value / 100);
//     } else if (discount.discountType === 'FIXED') {
//         return Math.max(0, originalPrice - discount.value);
//     }
//     return originalPrice;
// }

/**
 * Отримати всі активні знижки
 */
export async function getActiveDiscounts() {
    return db.select().from(discountsTable).where(eq(discountsTable.isActive, true)).all();
}

/**
 * Отримати всі знижки
 */
export async function getDiscounts() {
    return db.select().from(discountsTable).all();
}

export async function createDiscount(disc: Partial<DiscType>) {
    const {discountType, value, conditions, isActive, endDate, startDate} = disc;

    return db.insert(discountsTable)
        .values({
            discountType: discountType || "FIXED",
            value: value || 0,
            conditions: conditions || "",
            startDate: startDate || new Date(),
            endDate: endDate || new Date(),
            isActive: isActive,
        }).returning({ id: discountsTable.id });
}

export async function updateDiscount(discountId: number, disc: Partial<DiscType>) {
    const {  discountType, value, conditions, startDate, endDate } = disc;

    await db.update(discountsTable)
        .set({
            discountType: discountType,
            value: value,
            conditions: conditions,
            startDate: startDate,
            endDate: endDate,
        })
        .where(eq(discountsTable.id, discountId)).run();
}

export async function toggleDiscountActive(discountId: number, isActive: boolean) {
    await db.update(discountsTable)
        .set({ isActive: !isActive })
        .where(eq(discountsTable.id, discountId)).run();
}

/**
 * Призначити знижку клієнту
 * @param clientId ID клієнта
 * @param discountId ID знижки
 */
export async function assignDiscountToClient(clientId: number, discountId: number) {
    return db.insert(clientDiscountsTable).values({
        clientId,
        discountId,
        appliedDate: new Date()
    }).run();
}



// --- Функції для історії ---

/**
 * Додати запис в історію відвідувань
 * @param clientId ID клієнта
 * @param appointmentId ID запису
 * @param amountPaid Сплачена сума
 */
export async function addVisitHistory(clientId: number, appointmentId: number, amountPaid: number) {
    return db.insert(visitHistoryTable).values({
        clientId,
        appointmentId,
        visitDate: new Date(),
        amountPaid
    }).run();
}

/**
 * Отримати історію відвідувань клієнта
 * @param clientId ID клієнта
 */
export async function getVisitHistory(clientId: number) {
    return db.select().from(visitHistoryTable).where(eq(visitHistoryTable.clientId, clientId)).all();
}



// --- Інші функції ---

/**
 * Отримати фінансовий звіт за період
 * @param startDate Дата початку
 * @param endDate Дата завершення
 */
export async function getFinancialReport(startDate: Date, endDate: Date) {
    const startDateISOString = startDate.toISOString();
    const endDateISOString = endDate.toISOString();

    return db.select({
        totalIncome: sum(visitHistoryTable.amountPaid)
    }).from(visitHistoryTable).where(
        and(
            sql`datetime(${visitHistoryTable.visitDate}) >= datetime(${startDateISOString})`,
            sql`datetime(${visitHistoryTable.visitDate}) <= datetime(${endDateISOString})`
        )
    ).get();
}






export const getEmployees = async () => {
    try {
        const employees = await db.select().from(employeesTable);

        const employeesWithServices = await Promise.all(
            employees.map(async (employee) => {
                const services = await db
                    .select()
                    .from(serviceEmployeesTable)
                    .where(eq(serviceEmployeesTable.employeeId, employee.employeeId))
                    .leftJoin(servicesTable, eq(serviceEmployeesTable.serviceId, servicesTable.servicesId));

                return {
                    ...employee,
                    services: services.map(service => ({
                        serviceId: service.services?.servicesId || 0,
                        name: service.services?.name || "",
                    })),
                };
            })
        );

        return employeesWithServices;
    } catch (error) {
        console.error("Помилка отримання працівників з послугами:", error);
        throw error;
    }
};

export const getSchedules = async () => {
    try {
        const schedules = await db.select().from(schedulesTable);
        return schedules;
    } catch (error) {
        console.error("Помилка отримання розкладів:", error);
        throw error;
    }
};

export const getSchedulesEmployee = async (employeeId: number) => {
    try {
        const schedules = await db
            .select({
                employeeName: employeesTable.fullName,
                startDate: schedulesTable.startDate,
                endDate: schedulesTable.endDate,
                employeeId: employeesTable.employeeId,
                scheduleName: servicesTable.name,
            })
            .from(schedulesTable)
            .leftJoin(employeesTable, eq(employeesTable.employeeId, schedulesTable.employeeId))
            .leftJoin(serviceEmployeesTable, eq(serviceEmployeesTable.employeeId, schedulesTable.employeeId))
            .leftJoin(servicesTable, eq(servicesTable.servicesId, serviceEmployeesTable.serviceId))
            .where(
                employeeId === 0
                    ? undefined // Якщо 0, умова WHERE не застосовується
                    : eq(schedulesTable.employeeId, employeeId)
            )
            .all();

        return schedules;
    } catch (error) {
        console.error("Помилка отримання розкладів:", error);
        throw error;
    }
};


export async function getEmployeeByService(serviceId: number) {
    return db.select({
        id: employeesTable.employeeId,
        name: employeesTable.fullName,

    })
        .from(employeesTable)
        .leftJoin(serviceEmployeesTable, eq(serviceEmployeesTable.serviceId, serviceId))
        .where(
            and(
                eq(serviceEmployeesTable.employeeId, employeesTable.employeeId),
                eq(employeesTable.isWorking, true),
            )
        );
}

export async function createEmployee(formData: Partial<Employee>) {
    try {
        // Додавання працівника в таблицю employeesTable
        const newEmployeeResult = await db.insert(employeesTable).values({
            fullName: formData.fullName || "",
            phone: formData.phone || "",
        }).returning({ id: employeesTable.employeeId });

        // Перевірка, чи отримали ми записи
        if (newEmployeeResult.length > 0) {
            const newEmployee = newEmployeeResult[0]; // Отримуємо перший запис
            const employeeId = newEmployee.id;

            // Додавання записів у таблицю зв'язку працівників та послуг
            if (formData.services && formData.services.length > 0) {
                const serviceEmployeeRecords = formData.services.map(service => ({
                    employeeId,
                    serviceId: service.serviceId,
                }));

                await db.insert(serviceEmployeesTable).values(serviceEmployeeRecords).run();
            }

            return newEmployee;
        }

        throw new Error("Не вдалося створити працівника.");
    } catch (error) {
        console.error("Помилка при створенні працівника:", error);
        throw new Error("Не вдалося створити працівника.");
    }
}

export async function updateEmployee(formData: Partial<Employee>) {
    try {
        // Перевіряємо, чи є у formData employeeId
        if (!formData.employeeId) {
            throw new Error("Не вказано ID працівника для оновлення.");
        }

        // Оновлення даних працівника в таблиці employeesTable
        await db.update(employeesTable)
            .set({
                fullName: formData.fullName || "",
                phone: formData.phone || "",
            })
            .where(eq(employeesTable.employeeId, formData.employeeId))
            .run();

        // Якщо в formData є послуги, оновлюємо зв'язки з послугами
        if (formData.services && formData.services.length > 0) {
            // Спочатку видаляємо старі зв'язки
            await db.delete(serviceEmployeesTable)
                .where(eq(serviceEmployeesTable.employeeId, formData.employeeId))
                .run();

            // Додаємо нові зв'язки
            const serviceEmployeeRecords = formData.services.map(service => ({
                employeeId: formData.employeeId,
                serviceId: service.serviceId,
            }));

            await db.insert(serviceEmployeesTable).values(serviceEmployeeRecords).run();
        }

        console.log("Працівника успішно оновлено.");
    } catch (error) {
        console.error("Помилка при оновленні працівника:", error);
        throw new Error("Не вдалося оновити працівника.");
    }
}

export async function toggleWorkingEmployee(employeeId: number, isWorking: boolean) {
    await db.update(employeesTable)
        .set({ isWorking: !isWorking })
        .where(eq(employeesTable.employeeId, employeeId)).run();
}

// Створення нового розкладу
export const createSchedule = async (scheduleData: {
    employeeId: number;
    workDate: Date;
    startDate: Date;
    endDate: Date;
}) => {
    try {
        const { employeeId, workDate, startDate, endDate } = scheduleData;

        // Додавання нового розкладу
        return await db.insert(schedulesTable)
            .values({
                employeeId: employeeId,
                workDate: workDate,
                startDate: startDate,
                endDate: endDate,
            });
    } catch (error) {
        console.error("Помилка створення розкладу:", error);
        throw new Error("Не вдалося створити розклад");
    }
};

// Зміна статусу активності розкладу
export const toggleScheduleActive = async (scheduleId: number, isActive: boolean) => {
    try {
        // Зміна статусу активності розкладу (створення флагу чи поля для активності)
        const updatedSchedule = await db
            .update(schedulesTable)
            .set({ isActive: !isActive })
            .where(eq(schedulesTable.scheduleId, scheduleId));

        return updatedSchedule;
    } catch (error) {
        console.error("Помилка змінення статусу розкладу:", error);
        throw new Error("Не вдалося змінити статус розкладу");
    }
};


export const getAppointments = async (employeeId: number = 0) => {
    try {
        const result = await db
            .select({

                id: appointmentsTable.id,
                clientName: userTable.name,
                serviceName: servicesTable.name,
                appointmentDate: appointmentsTable.appointmentDate,
                employeeId: serviceEmployeesTable.employeeId,
                duration: servicesTable.duration,
                employeeName: employeesTable.fullName,

            })
            .from(appointmentsTable)
            .leftJoin(clientsTable, eq(appointmentsTable.clientId, clientsTable.clientId))
            .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.servicesId))
            .leftJoin(userTable, eq(userTable.userId, clientsTable.userId))
            .leftJoin(serviceEmployeesTable, eq(servicesTable.servicesId, serviceEmployeesTable.serviceId))
            .leftJoin(employeesTable, eq(employeesTable.employeeId, serviceEmployeesTable.employeeId))
            .where(employeeId > 0 ? eq(serviceEmployeesTable.employeeId, employeeId) : undefined);

        return result.map(row => ({
            id: row.id,
            title: `${row.employeeName}\n${row.clientName || 'Помилка(Клієнт)'} - ${row.serviceName || 'Помилка(Послуга)'}`,
            start: row.appointmentDate
                ? new Date(row.appointmentDate)
                : null,
            employeeId: row.employeeId || null,
            end: addMinutes(new Date(row.appointmentDate), row.duration || 0),
        })).filter(item => item.start);
    } catch (error) {
        console.error('Помилка отримання даних:', error);
        throw error;
    }
};

export const getAppointmentById = async (appointmentId: number = 0) => {
    try {
        return await db
            .select({

                clientName: userTable.name,
                clientId: clientsTable.clientId,
                email: userTable.email,
                userId: userTable.userId,
                phone: userTable.phone,
                serviceId: servicesTable.servicesId,
                employeeId: employeesTable.employeeId,
                startTime: appointmentsTable.appointmentDate,
                endTime: appointmentsTable.appointmentDate,
                duration: servicesTable.duration,


            })
            .from(appointmentsTable)
            .leftJoin(clientsTable, eq(appointmentsTable.clientId, clientsTable.clientId))
            .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.servicesId))
            .leftJoin(userTable, eq(userTable.userId, clientsTable.userId))
            .leftJoin(serviceEmployeesTable, eq(servicesTable.servicesId, serviceEmployeesTable.serviceId))
            .leftJoin(employeesTable, eq(employeesTable.employeeId, serviceEmployeesTable.employeeId))
            .where(eq(appointmentsTable.id, appointmentId));

    } catch (error) {
        console.error('Помилка отримання даних:', error);
        throw error;
    }
};

export async function updateAppointment (appointmentId: number,
    clientId: number,
    serviceId: number,
    employeeId: number,
    appointmentDate: Date,
    ) {

    const upd = await db.update(appointmentsTable)
        .set({
            clientId,
            serviceId,
            employeeId,
            appointmentDate,
            price: 0,
        })
        .where(eq(appointmentsTable.id, appointmentId));

    // Перетворюємо результат в простий об'єкт (залежить від вашої структури).
    return {
        rowsAffected: upd?.rowsAffected ?? 0, // приклад, якщо ваш ORM повертає кількість змінених рядків
    };
}

export const checkTimeAvailability = async (params: {
    employeeId: number;
    proposedStart: Date;
    duration: number;
    excludeAppointmentId?: number; // Опціонально, для виключення поточного запису при оновленні
}) => {
    const { employeeId, proposedStart, duration, excludeAppointmentId } = params;
    const proposedEnd = addMinutes(new Date(proposedStart), duration);

    // Знаходимо всі записи для цього працівника на цей день
    const dayStart = startOfDay(new Date(proposedStart));
    const dayEnd = endOfDay(new Date(proposedStart));

    let query = db
        .select()
        .from(appointmentsTable)
        .where(
            and(
                eq(appointmentsTable.employeeId, employeeId),
                gte(appointmentsTable.appointmentDate, dayStart),
                lte(appointmentsTable.appointmentDate, dayEnd)
            )
        );

    // Якщо вказано ID запису для виключення, додаємо умову
    if (excludeAppointmentId) {
        // @ts-expect-error: TypeScript не розуміє цей метод, але він існує
        query = query.where(ne(appointmentsTable.id, excludeAppointmentId));
    }

    const existingAppointments = await query.execute();

    // Перевіряємо перетин з існуючими записами
    for (const appointment of existingAppointments) {
        const existingStart = new Date(appointment.appointmentDate);
        // Отримуємо тривалість існуючого запису




        const service = await db
            .select()
            .from(servicesTable)

             // @ts-expect-error: eq просто не правильно інтерпрітується
            .where(eq(servicesTable.servicesId, appointment.serviceId))
            .limit(1)
            .execute();

        const existingDuration = service[0].duration;
        const existingEnd = addMinutes(existingStart, existingDuration);

        // Перевірка перетину інтервалів
        if (
            (proposedStart >= existingStart && proposedStart < existingEnd) || // Новий початок під час існуючого
            (proposedEnd > existingStart && proposedEnd <= existingEnd) || // Новий кінець під час існуючого
            (proposedStart <= existingStart && proposedEnd >= existingEnd) // Новий повністю покриває існуючий
        ) {
            // Знаходимо наступний доступний час
            const nextAvailableTime = new Date(existingEnd);
            return {
                available: false,
                nextAvailableTime,
                message: `Час зайнятий. Найближчий вільний час: ${nextAvailableTime.toISOString()}`
            };
        }
    }

    return {
        available: true,
        message: 'Час доступний'
    };
};

// Функція для додавання запису
export const addAppointment = async (as: {
    clientId: number;
    serviceId: number;
    employeeId: number;
    appointmentDate: Date;
    price: number;
}) => {
    try {
        const { clientId, serviceId, employeeId, appointmentDate, price } = as;

        // Отримуємо тривалість послуги
        const service = await db
            .select()
            .from(servicesTable)
            .where(eq(servicesTable.servicesId, serviceId))
            .limit(1)
            .execute();

        if (service.length === 0) {
            throw new Error('Послуга не знайдена');
        }

        const serviceDuration = service[0].duration;

        // Перевіряємо доступність часу
        const availability = await checkTimeAvailability({
            employeeId,
            proposedStart: appointmentDate,
            duration: serviceDuration
        });

        if (!availability.available) {
            return availability; // Повертаємо інформацію про наступний доступний час
        }

        // Додаємо запис
        await db.insert(appointmentsTable).values({
            clientId,
            serviceId,
            employeeId,
            appointmentDate,
            price,
        });

        const endTime = addMinutes(new Date(appointmentDate), serviceDuration);
        return {
            message: 'Запис успішно додано!',
            startTime: appointmentDate,
            endTime: endTime
        };
    } catch (error) {
        console.error("Помилка при додаванні запису:", error);
        throw new Error("Не вдалося додати запис");
    }
};

export async function deleteAppointment(appointmentId: number) {
    await db.delete(appointmentsTable)
        .where(eq(appointmentsTable.id, appointmentId))
        .run();
}
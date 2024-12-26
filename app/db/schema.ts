import {
    sqliteTable,
    text,
    integer,
    real,
    unique
} from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm';

export const userTable = sqliteTable('user', {
    userId: integer('user_id').primaryKey(),
    role: integer('role', { mode: 'number' }).default(0),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    password: text('password').notNull(),
});


// Таблиця Клієнти: зберігає дані про клієнтів салону
export const clientsTable = sqliteTable('clients', {
    clientId: integer('id').primaryKey(),
    userId: integer('user_id').references(() => userTable.userId),
    contactInfo: text('contact_info'),
    loyaltyPoints: integer('loyalty_points').default(0),
    deactivate: integer('deactivate', { mode: 'boolean' }).default(false),
});

// Таблиця Послуги: містить дані про всі доступні послуги
export const servicesTable = sqliteTable('services', {
    servicesId: integer('id').primaryKey(),
    name: text('name').notNull(),           // Назва послуги
    description: text('description'),       // Опис послуги
    duration: integer('duration').notNull(), // Тривалість у хвилинах
    price: real('price').notNull(),           // Ціна послуги
    isHidden: integer('is_hidden', { mode: 'boolean' }).default(false),
});

// Таблиця Знижки: визначає доступні типи знижок
export const discountsTable = sqliteTable('discounts', {
    id: integer('id').primaryKey(),
    discountType: text('discount_type', { enum: ['PERCENTAGE', 'FIXED'] }).notNull(),
    value: real('value').notNull(),        // Величина знижки: відсоток або сума
    conditions: text('conditions'),        // Умови застосування
    startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
    endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
});



// Таблиця Історія відвідувань: фіксує завершені записи клієнтів
export const visitHistoryTable = sqliteTable('visit_history', {
    id: integer('id').primaryKey(),
    clientId: integer('client_id').references(() => clientsTable.clientId), // Посилання на клієнта
    appointmentId: integer('appointment_id').references(() => appointmentsTable.id), // Посилання на запис
    visitDate: integer('visit_date', { mode: 'timestamp' }).notNull(), // Дата завершення
    amountPaid: real('amount_paid').notNull()  // Сума, сплачена клієнтом
})

// Таблиця для Знижок клієнтів: багато-до-багатьох між клієнтами та знижками
export const clientDiscountsTable = sqliteTable('client_discounts', {
    clientId: integer('client_id').references(() => clientsTable.clientId),
    discountId: integer('discount_id').references(() => discountsTable.id),
    appliedDate: integer('applied_date', { mode: 'timestamp' }).default(new Date())
}, (table) => ({
    pk: unique('client_discount_pk').on(table.clientId, table.discountId)
}))

// Таблиця для Працівників
export const employeesTable = sqliteTable('employees', {
    employeeId: integer('employee_id').primaryKey(),
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull(), // Телефон
    isWorking: integer('is_working', { mode: "boolean" }).default(false).notNull(),
});

// Таблиця Записи: зберігає запис клієнтів на послуги
export const appointmentsTable = sqliteTable('appointments', {
    id: integer('id').primaryKey(),
    clientId: integer('client_id').references(() => clientsTable.clientId), // Посилання на клієнта
    serviceId: integer('service_id').references(() => servicesTable.servicesId), // Послуга
    employeeId: integer('employee_id').references(() => employeesTable.employeeId).notNull(),
    appointmentDate: integer('appointment_date', { mode: 'timestamp' }).notNull(), // Дата
    status: text('status', { enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] }).default('SCHEDULED'),
    price: real('price').notNull(),           // Ціна після застосування знижок
    discountId: integer('discount_id').references(() => discountsTable.id, { onDelete: 'set null' }) // Знижка
});

// Таблиця для Розкладу
export const schedulesTable = sqliteTable('schedules', {
    scheduleId: integer('schedule_id').primaryKey(),
    employeeId: integer('employee_id').references(() => employeesTable.employeeId),
    workDate: integer('work_date', { mode: 'timestamp' }).notNull(),
    startDate: integer('start_date', { mode: 'timestamp' }),
    endDate: integer('end_date', { mode: 'timestamp' }),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),

});

export const serviceEmployeesTable = sqliteTable('service_employees', {
    employeeId: integer('employee_id').references(() => employeesTable.employeeId),
    serviceId: integer('service_id').references(() => servicesTable.servicesId),
})



// --- Зв'язки між таблицями ---

// Зв'язки для клієнтів
export const clientRelations = relations(clientsTable, ({ many }) => ({
    appointments: many(appointmentsTable), // Записи клієнта
    discounts: many(clientDiscountsTable), // Знижки клієнта
    history: many(visitHistoryTable)       // Історія відвідувань
}))

// Зв'язки для знижок
export const discountRelations = relations(discountsTable, ({ many }) => ({
    clients: many(clientDiscountsTable), // Клієнти зі знижкою
    appointments: many(appointmentsTable) // Застосування у записах
}))

// Зв'язки для записів
export const appointmentRelations = relations(appointmentsTable, ({ one }) => ({
    client: one(clientsTable, {
        fields: [appointmentsTable.clientId],
        references: [clientsTable.clientId]
    }),
    service: one(servicesTable, {
        fields: [appointmentsTable.serviceId],
        references: [servicesTable.servicesId]
    }),
    discount: one(discountsTable, {
        fields: [appointmentsTable.discountId],
        references: [discountsTable.id]
    })
}))

// Зв'язки для історії відвідувань
export const visitHistoryRelations = relations(visitHistoryTable, ({ one }) => ({
    client: one(clientsTable, {
        fields: [visitHistoryTable.clientId],
        references: [clientsTable.clientId]
    }),
    appointment: one(appointmentsTable, {
        fields: [visitHistoryTable.appointmentId],
        references: [appointmentsTable.id]
    })
}))

// Зв'язки для знижок клієнта
export const clientDiscountRelations = relations(clientDiscountsTable, ({ one }) => ({
    client: one(clientsTable, {
        fields: [clientDiscountsTable.clientId],
        references: [clientsTable.clientId]
    }),
    discount: one(discountsTable, {
        fields: [clientDiscountsTable.discountId],
        references: [discountsTable.id]
    })
}))

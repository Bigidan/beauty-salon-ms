"use server"

import { db } from "@/app/db";
import {hashPassword, verifyPassword} from "@/lib/auth/jwt";
import {
    userTable
} from "@/app/db/schema";
import {eq} from "drizzle-orm";
import {User} from "@/types/user";



export async function userRegister(values: {
    username: string;
    phone: string;
    email: string;
    password: string;
}) {
    const hash = await hashPassword(values.password);

    return db.insert(userTable).values({
        name: values.username,
        phone: values.phone,
        email: values.email,
        password: hash,
    }).returning({
        userId: userTable.userId,
        role: userTable.role,
        name: userTable.name,
        phone: userTable.phone,
        email: userTable.email,
        password: userTable.password,
    });
}

export async function getUserByField(
    field: "phone" | "email",
    value: string,
    password?: string
): Promise<User | null | undefined> {
    const result = await db
        .select({
            userId: userTable.userId,
            role: userTable.role,
            name: userTable.name,
            phone: userTable.phone,
            email: userTable.email,
            password: userTable.password,
        })
        .from(userTable)
        .where(eq(userTable[field], value));

    // Return null if user doesn't exist
    if (result.length === 0) return undefined;

    const user = result[0];

    if (password && !await verifyPassword(password, user.password)) {
        return null;
    }

    user.password = "";

    return user;
}

export async function getUserByLogin(name: string) {
    return db.select().from(userTable).where(eq(userTable.name, name));
}
export async function getUserByEmail(email: string) {
    return db.select().from(userTable).where(eq(userTable.email, email));
}
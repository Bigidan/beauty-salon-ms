import { config } from "dotenv";
import { defineConfig } from 'drizzle-kit';

config({ path: ".env" });

export default defineConfig({
    out: "./drizzle",
    schema: "./app/db/schema.ts",
    dialect: "turso",
    dbCredentials: {
        url: process.env.TURSO_CONNECTION_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    },
});

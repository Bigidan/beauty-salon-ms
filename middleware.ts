import { NextResponse, type NextRequest} from "next/server";
import { getSession } from "@/lib/auth/sesion";
import {User} from "@/types/user";


export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.includes("/dashboard")) {
        const parsed = await getSession();
        const user = parsed?.user as User;
        if (user != undefined && user.role === 1) return;
        else return NextResponse.rewrite(new URL("/404", request.url));
    }

}

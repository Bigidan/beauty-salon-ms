"use client";

import React, {useEffect, useState} from 'react';
import Link from "next/link";
import {
    ChartLine,
    Cloud,
    Ellipsis, FileUser, LayoutDashboard,
    SquareLibrary,
    User,
    Users
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuPortal,
    DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import LogOutButton from "@/components/navigation/log-out-button";
import { getSession } from "@/lib/auth/sesion";
import { User as UserType } from "@/types/user";

const MainHeader = () => {

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<UserType | null>(null); // null для "користувача ще не завантажено"


    const fetchUser = async () => {
        setIsLoading(true); // Встановлюємо стан завантаження
        try {
            const parsed = await getSession();
            setUser(parsed?.user as UserType);
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null); // У разі помилки вважаємо, що користувача немає
        } finally {
            setIsLoading(false); // Завершуємо завантаження
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);


    return (
        <header className="py-5 sticky top-0 z-40 w-full border-b-2 border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-between px-10">
                <Link href="/" className="font-black text-xl">Miso - Beauty Clinic</Link>
                <div className="flex justify-items-center items-center gap-5">
                    <Link href="/">Головна</Link>
                    <Link href="/services">Послуги</Link>
                </div>
                <div>
                    <div className="mx-12">
                        {isLoading ? (
                            <Avatar>
                                <AvatarFallback><User/></AvatarFallback>
                            </Avatar>
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="link" size="icon">
                                        <Avatar>
                                            <AvatarFallback><User/></AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>


                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel
                                        className="text-center">{user.name || "Гість"}</DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile">
                                                <User/>
                                                Профіль
                                                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator/>

                                    {user.role == 1 ? (
                                        <div>
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/dashboard/s?s=home">
                                                        <ChartLine />
                                                        Статистика
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Швидкий вибір</DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem asChild>
                                                                <Link href="/dashboard/s?s=clients">
                                                                    <FileUser/>
                                                                    Клієнти
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href="/dashboard/s?s=appointments">
                                                                    <SquareLibrary/>
                                                                    Записи
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator/>
                                                            <DropdownMenuItem asChild>
                                                                <Link href="/dashboard/s?s=discounts">
                                                                    <Ellipsis/>
                                                                    Інше
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                            </DropdownMenuGroup>


                                            <DropdownMenuSeparator/>
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard/s?s=employee">
                                                    <Users />
                                                    Працівники
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard/s?s=schedule">
                                                    <LayoutDashboard/>
                                                    Розклад
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                <Cloud/>
                                                API
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator/>
                                        </div>
                                    ) : null}
                                    <LogOutButton/>
                                </DropdownMenuContent>

                            </DropdownMenu>
                        ) : <div className="flex text-sm flex-row gap-2">
                            <Button asChild variant="outline">
                                <Link href="/login">Увійти</Link>
                            </Button>
                            {/*<Button asChild variant="outline">*/}
                            {/*    <Link href="/register">Зареєструватися</Link>*/}
                            {/*</Button>*/}
                        </div>
                        }
                    </div>

                </div>
            </div>
        </header>
    );
};

export default MainHeader;

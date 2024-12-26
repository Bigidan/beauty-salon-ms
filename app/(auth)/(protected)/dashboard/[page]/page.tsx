"use client";

import {
    Sidebar,
    SidebarProvider,
    SidebarTrigger,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarFooter,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
} from "@/components/ui/sidebar";

import { Suspense, useEffect, useState } from 'react';

import Link from "next/link";
import {
    FileUser,
    LayoutDashboard,
    Users,
    ChartLine,
    TicketPercent,
    Clipboard as ClipboardI,
} from "lucide-react";


import * as React from "react";
import {useRouter, useSearchParams} from "next/navigation";
import StatsDashboardPage from "@/app/(auth)/(protected)/dashboard/stats-dashboard";
import UsersDashboardPage from "@/app/(auth)/(protected)/dashboard/users-dashboard";
import ClientsDashboardPage from "@/app/(auth)/(protected)/dashboard/clients-dashboard";
import DiscountsDashboardPage from "@/app/(auth)/(protected)/dashboard/discounts-dashboard";
import ServicesDashboardPage from "@/app/(auth)/(protected)/dashboard/services-dashboard";
import EmployeeDashboardPage from "@/app/(auth)/(protected)/dashboard/employee-dashboard";
import ScheduleDashboardPage from "@/app/(auth)/(protected)/dashboard/schedule-dashboard";


const items = [
    { title: "Головна", key: "home", icon: ChartLine },
    { title: "Клієнти", key: "clients", icon: FileUser },
];

const data = [
    { title: "Знижки", key: "discounts", icon: TicketPercent },
    { title: "Послуги", key: "services", icon: ClipboardI },
    { title: "Працівники", key: "employee", icon: Users },
    { title: "Графік", key: "schedule", icon: LayoutDashboard },
];

const administrative = [
    { title: "Користувачі", key: "users", icon: Users },

];
const AdminPage = () =>  {
    const [activePage, setActivePage] = useState("home");
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const pageFromQuery = searchParams.get("s");
        if (pageFromQuery) {
            setActivePage(pageFromQuery);
        }
    }, [searchParams]);
    const handlePageChange = (page: string) => {
        setActivePage(page);
        renderPage(page);
        router.replace(`/dashboard/s?s=${page}`); // Оновлення URL
    };

    // Функція для рендеру вмісту залежно від обраної сторінки
    const renderPage = (activePage: string) => {
        switch (activePage) {
            case "home":
                return <StatsDashboardPage />;
            case "clients":
                return <ClientsDashboardPage />;
            case "discounts":
                return <DiscountsDashboardPage />;
            case "services":
                return <ServicesDashboardPage />;
            case "employee":
                return <EmployeeDashboardPage />;
            case "schedule":
                return <ScheduleDashboardPage />;
            case "users":
                return <UsersDashboardPage />;

            default:
                return <div>Оберіть пункт меню</div>;
        }
    };

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <Link href="/">
                    <SidebarHeader className="flex flex-row items-center space-x-3">
                        <div className="group-data-[collapsible=icon]:hidden text-nowrap">Адмін-панель</div>
                    </SidebarHeader>
                </Link>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Основне</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton asChild>
                                            <button onClick={() => handlePageChange(item.key)}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupLabel>Дані</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {data.map((item) => (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton asChild>
                                            <button onClick={() => handlePageChange(item.key)}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupLabel>Адміністрування</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {administrative.map((item) => (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton asChild>
                                            <button onClick={() => handlePageChange(item.key)}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="group-data-[collapsible=icon]:hidden text-nowrap">Футер</SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <Suspense fallback={<p>sss</p>}>
                    <main className="w-full">
                        <SidebarTrigger />
                        <div>
                            {renderPage(activePage)}
                        </div>
                    </main>
                </Suspense>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AdminPage;


"use client"

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Check, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Імпорт компонентів UI
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext
} from "@/components/ui/pagination";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    createClient,
    createClientAndUser,
    getClientsWithPagination,
    searchUsers, toggleDeactivateClient,
    updateClient
} from "@/app/db/db_manager";
import {Checkbox} from "@/components/ui/checkbox";

// Типи
type Client = {
    userId: number | null;
    clientId: number;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    contactInfo: string | null;
    loyaltyPoints: number | null;
    password?: string;
    deactivate?: boolean | null;
};

type User = {
    role: number | null;
    userId: number;
    email: string;
    phone: string;
    password: string;
    name: string;
}

export default function ClientsDashboardPage() {
    // Стани для даних
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Стани для пагінації
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isCreating, setIsCreating] = useState(false);

    // Стани для редагування
    const [isEditing, setIsEditing] = useState(false);
    const [editingClientId, setEditingClientId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Client>>({
        userId: 0,
        contactInfo: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
    });



    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [existingUsers, setExistingUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [selectedUserData, setSelectedUserData] = useState<User | null>(null);

    const fetchUsers = async (query: string) => {
        try {
            // Замінити `searchUsers` на реальну функцію для отримання користувачів
            const response = await searchUsers(query);
            setExistingUsers(response);
        } catch (error) {
            console.error("Помилка пошуку користувачів:", error);
        }
    };

    useEffect(() => {
        if (userSearchQuery.length > 2) {
            fetchUsers(userSearchQuery);
        }
    }, [userSearchQuery]);



    // Варіанти кількості елементів на сторінці
    const pageSizeOptions = [
        { value: "10", label: "10" },
        { value: "20", label: "20" },
        { value: "30", label: "30" },
        { value: "50", label: "50" }
    ];

    const [pageSizeOpen, setPageSizeOpen] = useState(false);
    const [pageSizeValue, setPageSizeValue] = useState("10");

    useEffect(() => {
        fetchClients(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const fetchClients = async (page: number, pageSize: number) => {
        try {

            const response = await getClientsWithPagination(page, pageSize);
            setClients(response.clients);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Помилка при завантаженні клієнтів:", error);
        }
    };

    const handleCreateClient = async () => {
        try {
            if (selectedUser) {
                await createClient(selectedUser, formData.contactInfo);
            } else {
                await createClientAndUser(formData); // Функція створення нового користувача + клієнта
            }
            await fetchClients(currentPage, pageSize);
            resetForm();
        } catch (error) {
            console.error("Помилка при створенні клієнта:", error);
        }
    };

    const handleUpdateClient = async () => {
        if (!editingClientId) return;

        try {
            await updateClient(editingClientId, formData);
            await fetchClients(currentPage, pageSize);
            resetForm();
        } catch (error) {
            console.error("Помилка при оновленні клієнта:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: "",
            email: "",
            phone: "",
            contactInfo: ""
        });
        setIsEditing(false);
        setIsCreating(false);
        setEditingClientId(null);
        setSelectedUserData(null);
        setSelectedUser(null);
        setExistingUsers([]);
    };

    const startEditing = (client: Client) => {
        setIsEditing(true);
        setEditingClientId(client.clientId);
        setFormData({
            fullName: client.fullName,
            email: client.email,
            phone: client.phone,
            contactInfo: client.contactInfo,
            userId: client.userId,
        });
    };


    const toggleDeactivate = async (clientId: number, isDeactivated: boolean) => {
        await toggleDeactivateClient(clientId, isDeactivated);
        await fetchClients(currentPage, pageSize);
    }

    // Генерація сторінок для пагінації
    const generatePageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const columns: ColumnDef<Client>[] = [
        {
            accessorKey: "deactivate",
            header: "Статус",
            cell: ({ row }) => (
                <Checkbox
                    checked={ !(row.original.deactivate || false)}
                    aria-label="Select row"
                    disabled={true}
                />
            ),
        },
        {
            accessorKey: "fullName",
            header: "ПІБ",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone",
            header: "Телефон",
        },
        {
            header: "Дії",
            id: "actions",
            cell: ({ row }) => {
                const client = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(client)}>
                                Редагувати
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-900" onClick={() => toggleDeactivate(client.clientId, client.deactivate || false)}>
                                {client.deactivate ? ("Активувати") : ("Деактивувати")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <div className="w-full flex flex-col space-x-3 p-4">
            <div className="flex items-center mb-4 space-x-5 p-4">
                <h1 className="text-2xl font-bold">Клієнти</h1>
                <Button onClick={() => setIsCreating(true)}>Новий клієнт</Button>
            </div>

            <div className="flex items-center py-4 space-x-4">
                <Input
                    placeholder="Пошук клієнта..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="max-w-sm"
                />

                <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={pageSizeOpen}
                            className="w-[200px] justify-between"
                        >
                            {pageSizeValue
                                ? pageSizeOptions.find((option) => option.value === pageSizeValue)?.label
                                : "Кількість на сторінці"}
                            <ChevronsUpDown className="opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandInput placeholder="Обрати кількість..." />
                            <CommandList>
                                <CommandEmpty>Не обрано</CommandEmpty>
                                <CommandGroup>
                                    {pageSizeOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={(currentValue) => {
                                                setPageSizeValue(currentValue);
                                                setPageSize(Number(currentValue));
                                                setPageSizeOpen(false);
                                            }}
                                        >
                                            {option.label}
                                            <Check
                                                className={cn(
                                                    "ml-auto",
                                                    pageSizeValue === option.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <DataTable
                columns={columns}
                data={clients.filter(client =>
                    client.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
                )}
            />

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => setCurrentPage(currentPage - 1)}
                            isActive={currentPage === 1}
                        />
                    </PaginationItem>
                    {generatePageNumbers().map(page => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                href="#"
                                onClick={() => setCurrentPage(page)}
                                isActive={page === currentPage}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => setCurrentPage(currentPage + 1)}
                            isActive={currentPage === totalPages}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>

            <Dialog open={isCreating} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Новий клієнт</DialogTitle>
                        <DialogDescription>Заповніть дані нового клієнта</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="userSearch" className="text-right">
                                Користувач
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="justify-between col-span-3"
                                    >
                                        {selectedUserData ? selectedUserData.name : "Виберіть користувача..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>

                                </PopoverTrigger>
                                <PopoverContent>
                                    <Command>
                                        <CommandInput placeholder="Пошук..."
                                                      value={userSearchQuery}
                                                      onValueChange={(e) => {
                                                          setUserSearchQuery(e);
                                                      }} />
                                        <CommandList>
                                            {existingUsers.length === 0 ? (
                                                <CommandEmpty>Користувачів не знайдено.</CommandEmpty>
                                            ) : (

                                                <CommandGroup>

                                                    {existingUsers.map((user) => (
                                                        <CommandItem
                                                            key={user.userId}
                                                            value={user.name}

                                                            onSelect={() => {
                                                                setSelectedUserData(user);
                                                                setSelectedUser(user.userId);
                                                                setUserSearchQuery("");
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedUserData?.userId === user.userId ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {user.name} ({user.email})
                                                        </CommandItem>
                                                    ))}

                                                </CommandGroup>

                                                )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullName" className="text-right">
                                ПІБ
                            </Label>
                            <Input
                                id="fullName"
                                value={formData.fullName || ""}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="col-span-3"
                                disabled={!!selectedUser}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="col-span-3"
                                disabled={!!selectedUser}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Телефон
                            </Label>
                            <Input
                                id="phone"
                                value={formData.phone || ""}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="col-span-3"
                                disabled={!!selectedUser}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactInfo" className="text-right">
                                Додаткова інформація
                            </Label>
                            <Input
                                id="contactInfo"
                                value={formData.contactInfo || ""}
                                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Скасувати
                        </Button>
                        <Button type="button" onClick={handleCreateClient}>
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={isEditing} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Редагування клієнта</DialogTitle>
                        <DialogDescription>
                            Змініть дані клієнта
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullName" className="text-right">
                                ПІБ
                            </Label>
                            <Input
                                id="fullName"
                                value={formData.fullName || ""}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Телефон
                            </Label>
                            <Input
                                id="phone"
                                value={formData.phone || ""}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactInfo" className="text-right">
                                Додаткова інформація
                            </Label>
                            <Input
                                id="contactInfo"
                                value={formData.contactInfo || ""}
                                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                                className="col-span-3"
                                placeholder="Додаткові контактні дані"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Скасувати
                        </Button>
                        <Button type="button" onClick={handleUpdateClient}>
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
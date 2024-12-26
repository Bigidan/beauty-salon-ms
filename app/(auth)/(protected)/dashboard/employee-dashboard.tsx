"use client";

import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {getEmployees, createEmployee, updateEmployee, getServices, toggleWorkingEmployee} from "@/app/db/db_manager";
import { Employee } from "@/types/employee";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp";

export default function EmployeeDashboardPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allServices, setServices] = useState<{ name: string, servicesId: number }[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({
        fullName: "",
        phone: "",
        isWorking: false,
        services: [], // Початкове значення як порожній масив
    });

    const fetchServices = async () => {
        try {
            const response = await getServices();
            setServices(response);
        } catch (error) {
            console.error("Помилка при завантаженні послуг:", error);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await getEmployees();
            setEmployees(response);
        } catch (error) {
            console.error("Помилка завантаження працівників:", error);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreateEmployee = async () => {
        try {
            await createEmployee(formData);
            await fetchEmployees();
            resetForm();
        } catch (error) {
            console.error("Помилка створення працівника:", error);
        }
    };

    const handleEditEmployee = async () => {
        try {
            if (formData.employeeId) {
                await updateEmployee(formData);
                await fetchEmployees();
                resetForm();
            }
        } catch (error) {
            console.error("Помилка редагування працівника:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: "",
            phone: "",
            isWorking: false,
            services: [],
        });
        setIsCreating(false);
        setIsEditing(false);
    };

    const filteredEmployees = employees.filter(employee =>
        employee.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (serviceId: number, name: string) => {
        const updatedServices = formData.services ? [...formData.services] : [];
        const serviceIndex = updatedServices.findIndex(service => service.serviceId === serviceId);

        if (serviceIndex === -1) {
            updatedServices.push({ serviceId, name });
        } else {
            updatedServices.splice(serviceIndex, 1);
        }

        setFormData({ ...formData, services: updatedServices });
    };



    return (
        <div className="w-full p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Працівники</h1>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати працівника
                </Button>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Input
                        placeholder="Пошук працівників..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee) => (
                    <Card key={employee.employeeId} className="cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">
                                {employee.fullName}
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setFormData(employee);
                                            setIsEditing(true);
                                        }}
                                    >
                                        Редагувати
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            await toggleWorkingEmployee(employee.employeeId, employee.isWorking);
                                            await fetchEmployees();
                                        }}
                                    >
                                        {employee.isWorking ? "Звільнити" : "Найняти"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {employee.services.map(service => service.name).join(', ')}
                            </p>
                            <p className="text-sm">
                                {employee.phone}
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Badge variant={employee.isWorking ? "default" : "secondary"}>
                                {employee.isWorking ? "Активний" : "Не найнятий"}
                            </Badge>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreating || isEditing} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Редагування працівника" : "Новий працівник"}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Змініть дані працівника" : "Заповніть дані нового працівника"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Поле для введення імені */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="fullName" className="text-right">Ім&#39;я</label>
                            <Input
                                id="fullName"
                                value={formData.fullName || ""}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className="col-span-3"
                            />
                        </div>

                        {/* Поле для вибору послуг */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="services" className="text-right">Послуги</label>
                            <div className="col-span-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            {formData.services && formData.services.length > 0
                                                ? `Обрано послуг: ${formData.services.length}`
                                                : "Оберіть послуги"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[450px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Пошук послуг..."/>
                                            <CommandList>
                                                <CommandGroup>
                                                    {allServices.map((service) => (
                                                        <CommandItem
                                                            key={service.servicesId}
                                                            onSelect={() => toggleSelection(service.servicesId, service.name)}>
                                                            <Checkbox
                                                                checked={formData.services?.some(s => s.serviceId === service.servicesId)}
                                                            />
                                                            <span className="ml-2">{service.name}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">
                                Номер
                            </Label>
                            <InputOTP
                                maxLength={10}
                                id="image"
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e})}
                                className="col-span-3"
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0}/>
                                    <InputOTPSlot index={1}/>
                                    <InputOTPSlot index={2}/>
                                </InputOTPGroup>
                                <InputOTPGroup>
                                    <InputOTPSlot index={3}/>
                                    <InputOTPSlot index={4}/>
                                    <InputOTPSlot index={5}/>
                                </InputOTPGroup>
                                <InputOTPGroup>
                                    <InputOTPSlot index={6}/>
                                    <InputOTPSlot index={7}/>
                                </InputOTPGroup>
                                <InputOTPGroup>
                                    <InputOTPSlot index={8}/>
                                    <InputOTPSlot index={9}/>
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Скасувати
                        </Button>
                        <Button
                            type="button"
                            onClick={isEditing ? handleEditEmployee : handleCreateEmployee}
                        >
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

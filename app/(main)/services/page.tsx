"use client";

import React, {useCallback, useEffect, useState} from 'react';
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getServices, getEmployeeByService, addAppointment } from "@/app/db/db_manager";

import { getSession } from "@/lib/auth/sesion";

import {Service} from "@/types/service";
import {User as UserType} from "@/types/user";
import Link from "next/link";


const TimePicker = ({ label, time, setTime, isDisable = false }: { label: string; time: string; setTime: (time: string) => void; isDisable: boolean }) => {
    const handleTimeChange = (values: string) => {
        setTime(values);
    };

    return (
        <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{label}</Label>
            <InputOTP maxLength={4} value={time} onChange={handleTimeChange} disabled={isDisable}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                </InputOTPGroup>
                <span>:</span>
                <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                </InputOTPGroup>
            </InputOTP>
        </div>
    );
};

const ServicesPage = () => {

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<{id: number, name: string}[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startTime, setStartTime] = useState("0900");


    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<UserType | null>(null);
    const [client, setClient] = useState(0);
    
    const fetchUser = async () => {
        setIsLoading(true); // Встановлюємо стан завантаження
        try {
            const parsed = await getSession();
            const user = parsed?.user as UserType;
            setUser(user);
            return(user.userId);
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
            return(0);
        } finally {
            setIsLoading(false); // Завершуємо завантаження
        }
    };
    const fetchClient = useCallback(async () => {
        const userId = await fetchUser();
        if (userId != 0) setClient(userId);
    }, []);
    useEffect(() => {
        fetchClient();
    }, [fetchClient]);


    useEffect(() => {
        const fetchServices = async () => {
            const servicesData = await getServices();
            setServices(servicesData);
        };
        fetchServices();
    }, []);

    useEffect(() => {
        if (selectedService) {
            const fetchEmployees = async () => {
                const employeesData = await getEmployeeByService(selectedService.servicesId);
                setEmployees(employeesData);
            };
            fetchEmployees();
        }
    }, [selectedService]);

    const handleBookService = async (service: Service) => {
        // if (!user) {
        //     setIsAuthDialogOpen(true);
        //     return;
        // }
        setSelectedService(service);
        setIsDialogOpen(true);
    };

    const handleBookingSubmit = async (employeeId: number) => {
        if (!user) {
            return;
        }

        const startHour = parseInt(startTime.slice(0, 2));
        const startMinute = parseInt(startTime.slice(2));
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(startHour, startMinute);

        try {
            await addAppointment({
                clientId: client,
                serviceId: selectedService?.servicesId || 0,
                employeeId: employeeId,
                appointmentDate: appointmentDate,
                price: selectedService?.price || 0,
            });

            setIsDialogOpen(false);
            setSelectedService(null);
        } catch (error) {
            console.error("Помилка при створенні запису:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Наші послуги</h1>
                {user && (
                    <div className="flex items-center gap-4">
                        <span>Вітаємо, {user.name}!</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <Card key={service.servicesId} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{service.name}</CardTitle>
                            <CardDescription>
                                Тривалість: {service.duration} хв
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">{service.description || 'Немає опису'}</p>
                            <p className="text-lg font-bold mb-4">{service.price} грн</p>
                            <Button
                                className="w-full"
                                onClick={() => handleBookService(service)}
                            >
                                Записатись
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Записатись на {selectedService?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">

                        {!user && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Потрібен об.запис</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Link href="/login" className="font-normal">
                                        <Button>
                                            Увійти
                                        </Button>
                                    </Link>
                                    <Link href="/register" className="font-normal">
                                        <Button>
                                            Зареєструватися
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Дата</Label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal col-span-3",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : "Оберіть дату"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => setSelectedDate(date || new Date())}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <TimePicker
                            label="Час"
                            time={startTime}
                            setTime={setStartTime}
                            isDisable={false}
                        />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Майстер</Label>
                            <Select onValueChange={(value) => handleBookingSubmit(Number(value))}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Оберіть майстра" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee) => (
                                        <SelectItem key={employee.id} value={employee.id.toString()}>
                                            {employee.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Скасувати
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ServicesPage;
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {Loader2, Trash2} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {deleteAppointment, getAppointmentById, updateAppointment} from "@/app/db/db_manager";
import { getSession } from "@/lib/auth/sesion";
import { User as UserType } from "@/types/user";
import BigCalendar from "@/components/ui/date/big-calender";
import {Label} from "@/components/ui/label";
import {DatePicker, TimePicker} from "@/app/(auth)/(protected)/dashboard/schedule-dashboard";
import {format} from "date-fns";


const ClientProfilePage = () => {

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1); // Змінює значення для перезавантаження
    };

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<UserType | null>(null);
    const [client, setClient] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newAppointment, setNewAppointment] = useState({
        clientName: "",
        clientId: 1,
        phone: "",
        serviceId: "",
        employeeId: 0,
        startTime: new Date(),
        endTime: new Date(),
    });


    const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);


    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [startTime, setStartTime] = useState<string>("0900");
    const [endTime, setEndTime] = useState<string>("1000");



    const fetchUser = async () => {
        setIsLoading(true);
        try {
            const parsed = await getSession();
            const user = parsed?.user as UserType;
            setUser(user);
            return user.userId;
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
            return 0;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClient = useCallback(async () => {
        const userId = await fetchUser();
        if (userId !== 0) {
            setClient(userId);
        }
    }, []);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    const handleSelectEvent = async (eventId: number) => {
        setSelectedAppointmentId(eventId);
        setIsDialogOpen(true);
        try {
            const appointment = await getAppointmentById(eventId);
            setSelectedAppointmentId(eventId);
            // Populate form with appointment data
            setNewAppointment({
                ...newAppointment,
                clientId: appointment[0].clientId || 0,
                serviceId: appointment[0].serviceId?.toString() || "",
                employeeId: appointment[0].employeeId || 0,
            });

            const appointmentDate = new Date(appointment[0].startTime);
            setSelectedDate(appointmentDate);

            // Format time for the TimePicker
            setStartTime(format(appointmentDate, 'HHmm'));
            const endDate = new Date(appointmentDate);
            endDate.setMinutes(endDate.getMinutes() + (appointment[0].duration || 0));
            setEndTime(format(endDate, 'HHmm'));

            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error loading appointment:", error);
        }
    };

    const resetForm = () => {
        setNewAppointment({
            clientName: "",
            clientId: 1,
            phone: "",
            serviceId: "",
            employeeId: 0,
            startTime: new Date(),
            endTime: new Date(),
        });
        setStartTime("0900");
        setEndTime("1000");
        setSelectedDate(new Date());
    };

    const handleSave = async () => {
        if (!selectedDate) {
            alert("Оберіть дату!");
            return;
        }

        const startHour = parseInt(startTime.slice(0, 2));
        const startMinute = parseInt(startTime.slice(2));
        const endHour = parseInt(endTime.slice(0, 2));
        const endMinute = parseInt(endTime.slice(2));

        const startDate = new Date(selectedDate);
        startDate.setHours(startHour, startMinute);

        const endDate = new Date(selectedDate);
        endDate.setHours(endHour, endMinute);

        // Time validation remains the same...
        const openingTimeInMinutes = 6 * 60;
        const closingTimeInMinutes = 21 * 60;
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

        if (startMinutes < openingTimeInMinutes) {
            alert("Ми не працюємо до 6 ранку)");
            return;
        }

        if (endMinutes > closingTimeInMinutes) {
            alert("Ми не працюємо після 9 вечора)");
            return;
        }

        const appointmentData = {
            clientId: client,
            serviceId: Number(newAppointment.serviceId),
            employeeId: newAppointment.employeeId,
            appointmentDate: startDate,
            price: 0,
        };


        try {
                console.log(selectedAppointmentId);
            const dAppointment = await updateAppointment(selectedAppointmentId!,
                    appointmentData.clientId,
                    appointmentData.serviceId,
                    appointmentData.employeeId,
                    appointmentData.appointmentDate);
            setIsDialogOpen(false);
            handleRefresh();
            resetForm();

            if (dAppointment) {
                setIsDialogOpen(false);
                handleRefresh();
            }

        } catch (error) {
            console.error("Error saving appointment:", error);
            alert('Помилка при збереженні запису');
        }
    };

    const handleCancelAppointment = async () => {
        if (!selectedAppointmentId) return;

        if (window.confirm('Ви впевнені, що хочете видалити цей запис?')) {
            try {
                await deleteAppointment(selectedAppointmentId);
                setIsDialogOpen(false);
                handleRefresh();
                resetForm();
            } catch (error) {
                console.error("Error deleting appointment:", error);
                alert('Помилка при видаленні запису');
            }
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
                <h1 className="text-3xl font-bold">Мій профіль</h1>
                {user && (
                    <div className="flex items-center gap-4">
                        <span>Вітаємо, {user.name}!</span>
                    </div>
                )}
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Мої записи</CardTitle>
                </CardHeader>
                <CardContent>
                    <BigCalendar
                        refreshTrigger={refreshTrigger}
                        clientId={client}
                        selectable={true}
                        onEventClick={handleSelectEvent}
                    />
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle>Редагування запису</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Дата</Label>
                            <div className="col-span-3">
                                <DatePicker selectedDate={selectedDate || new Date()}
                                            setSelectedDate={setSelectedDate}/>
                            </div>
                        </div>
                        <TimePicker label="Початок" time={startTime} setTime={setStartTime} isDisable={false}/>
                        <TimePicker label="Кінець" time={endTime} setTime={setEndTime} isDisable={true}/>
                    </div>
                    <DialogFooter>
                        <div>
                            <Button variant="destructive" onClick={handleCancelAppointment}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Видалити
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Скасувати
                            </Button>
                            <Button onClick={handleSave}>
                                Зберегти
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientProfilePage;
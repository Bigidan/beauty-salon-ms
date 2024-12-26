import React, {useEffect, useState} from "react";
import { format } from "date-fns";
import {CalendarIcon, Check, ChevronsUpDown, Plus, Trash2} from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import BigCalendar from "@/components/ui/date/big-calender";
import {EmployeeSelector} from "@/components/ui/employee-selector";
import {
    addAppointment,
    deleteAppointment,
    getAppointmentById,
    getEmployeeByService,
    getServices,
    searchClients, updateAppointment
} from "@/app/db/db_manager";
import {Service} from "@/types/service";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";

export const DatePicker = ({ selectedDate, setSelectedDate }: { selectedDate: Date; setSelectedDate: (date: Date) => void }) => {
    return (
        <Popover modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Виберіть дату</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) =>
                    {
                        setSelectedDate(date!)
                    }
                }
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
};

export const TimePicker = ({ label, time, setTime, isDisable = false }: { label: string; time: string; setTime: (time: string) => void; isDisable: boolean }) => {
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

const ScheduleDashboardPage = () => {
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<{id: number, name: string}[]>([]);

    const [clientSearchQuery, setClientSearchQuery] = useState("");
    const [existingClients, setExistingClients] = useState<{
        clientId: number,
        userId: number | null,
        email: string | null,
        fullName: string | null
    }[]>([]);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [selectedClientData, setSelectedClientData] = useState<{
        clientId: number,
        userId: number | null,
        email: string | null,
        fullName: string | null
    } | null>(null);

    const fetchUsers = async (query: string) => {
        try {
            // Замінити `searchUsers` на реальну функцію для отримання користувачів
            const response = await searchClients(query);
            setExistingClients(response);
        } catch (error) {
            console.error("Помилка пошуку користувачів:", error);
        }
    };

    useEffect(() => {
        if (clientSearchQuery.length > 2) {
            fetchUsers(clientSearchQuery);
        }
    }, [clientSearchQuery]);



    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0);
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

    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [startTime, setStartTime] = useState<string>("0900");
    const [endTime, setEndTime] = useState<string>("1000");


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



    const fetchEmployees = async (serviceId: number) => {
        try {
            const response = await getEmployeeByService(serviceId);
            setEmployees(response);
            console.log(response);
        } catch (error) {
            console.error("Помилка при завантаженні послуг:", error);
        }
    };
    useEffect(() => {
        fetchEmployees(Number(newAppointment.serviceId));
    }, [newAppointment.serviceId]);



    useEffect(() => {
        if (newAppointment.serviceId && startTime) {
            const selectedService = services.find(
                (service) => service.servicesId.toString() === newAppointment.serviceId
            );
            if (selectedService) {
                const startHour = parseInt(startTime.slice(0, 2));
                const startMinute = parseInt(startTime.slice(2));
                const duration = selectedService.duration; // У хвилинах

                const endDate = new Date(selectedDate || new Date());
                endDate.setHours(startHour, startMinute + duration);

                const endHour = endDate.getHours().toString().padStart(2, "0");
                const endMinute = endDate.getMinutes().toString().padStart(2, "0");
                setEndTime(`${endHour}${endMinute}`);
            }
        }
    }, [newAppointment.serviceId, startTime, selectedDate, services]);



    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1); // Змінює значення для перезавантаження
    };

    const handleEventClick = async (eventId: number) => {
        try {
            const appointment = await getAppointmentById(eventId);
            setSelectedAppointmentId(eventId);
            setDialogMode('edit');

            // Populate form with appointment data
            setSelectedClient(appointment[0].clientId);
            setSelectedClientData({
                clientId: appointment[0].clientId || 0,
                userId: appointment[0].userId,
                email: appointment[0].email,
                fullName: appointment[0].clientName,
            });
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
        setSelectedClient(null);
        setSelectedClientData(null);
        setClientSearchQuery("");
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
    const handleDelete = async () => {
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
            clientId: selectedClient || 0,
            serviceId: Number(newAppointment.serviceId),
            employeeId: newAppointment.employeeId,
            appointmentDate: startDate,
            price: 0,
        };

        let dAppointment = "";

        try {
            if (dialogMode === 'create') {
                const createdAppointment = await addAppointment(appointmentData);
                dAppointment = createdAppointment.message;
            } else {
                console.log(selectedAppointmentId);
                await updateAppointment(selectedAppointmentId!,
                    appointmentData.clientId,
                    appointmentData.serviceId,
                    appointmentData.employeeId,
                    appointmentData.appointmentDate);

            }
            setIsDialogOpen(false);
            handleRefresh();
            resetForm();

            if (dAppointment.includes("Запис успішно додано!")) {
                setIsDialogOpen(false);
                handleRefresh();
            }

        } catch (error) {
            console.error("Error saving appointment:", error);
            alert('Помилка при збереженні запису');
        }
    };

    const handleDialogOpen = (open: boolean) => {
        if (!open) {
            resetForm();
            setDialogMode('create');
            setSelectedAppointmentId(null);
        }
        setIsDialogOpen(open);
    };


    return (
        <div className="flex w-full">
            <div className="flex-grow">
                <BigCalendar
                    refreshTrigger={refreshTrigger}
                    selectedEmployeeId={selectedEmployeeId}
                    selectable={true}
                    onEventClick={handleEventClick}
                />
            </div>
            <div className="sticky lg:w-60 hidden lg:flex flex-col top-0 h-full border-l">
                <div className="h-16 border-y border-sidebar-border mb-2">
                    <EmployeeSelector onEmployeeSelect={setSelectedEmployeeId} />
                </div>
                <Button className="w-fit" onClick={() => {
                    setDialogMode('create');
                    handleDialogOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Новий запис
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogContent className="sm:max-w-[620px]">
                        <DialogHeader>
                            <DialogTitle>{dialogMode === 'create' ? 'Новий запис' : 'Редагування запису'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userSearch" className="text-right">
                                    Клієнт
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="justify-between col-span-3"
                                        >
                                            {selectedClientData ? selectedClientData.fullName : "Виберіть клієнта..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>

                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Command>
                                            <CommandInput placeholder="Пошук..."
                                                          value={clientSearchQuery}
                                                          onValueChange={(e) => {
                                                              setClientSearchQuery(e);
                                                          }} />
                                            <CommandList>
                                                {existingClients.length === 0 ? (
                                                    <CommandEmpty>Користувачів не знайдено.</CommandEmpty>
                                                ) : (

                                                    <CommandGroup>

                                                        {existingClients.map((client) => (
                                                            <CommandItem
                                                                key={client.clientId}
                                                                value={client.fullName || ""}

                                                                onSelect={() => {
                                                                    setSelectedClientData(client);
                                                                    setSelectedClient(client.clientId);
                                                                    setClientSearchQuery("");
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedClientData?.clientId === client.clientId ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {client.fullName} ({client.email})
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
                                <Label htmlFor="service" className="text-right">
                                    Послуга
                                </Label>
                                <Select
                                    value={newAppointment.serviceId}
                                    onValueChange={(value) => setNewAppointment((prev) => ({
                                        ...prev,
                                        serviceId: value
                                    }))}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Оберіть послугу"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map((service) => (
                                            <div key={service.servicesId}>
                                                <SelectItem
                                                    value={service.servicesId.toString()}>{service.name} - {service.duration}хв</SelectItem>
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="service" className="text-right">
                                    Майстер
                                </Label>
                                <Select
                                    value={newAppointment.employeeId.toString()}
                                    onValueChange={(value) => setNewAppointment((prev) => ({
                                        ...prev,
                                        employeeId: Number(value)
                                    }))}
                                    disabled={employees.length === 0}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Оберіть майстра"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((employee) => (
                                            <div key={employee.id}>
                                                <SelectItem
                                                    value={employee.id.toString()}>{employee.name}</SelectItem>
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                {dialogMode === 'edit' && (
                                    <Button variant="destructive" onClick={handleDelete}>
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Видалити
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleDialogOpen(false)}>
                                    Скасувати
                                </Button>
                                <Button onClick={handleSave}>
                                    {dialogMode === 'create' ? 'Створити' : 'Зберегти'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default ScheduleDashboardPage;

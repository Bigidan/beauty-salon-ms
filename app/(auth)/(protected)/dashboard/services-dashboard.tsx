import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal, Search } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {createService, getServices, toggleServiceVisibility} from "@/app/db/db_manager";
import {Service} from "@/types/service";


export default function ServicesDashboardPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Service>>({
        name: "",
        description: "",
        price: 0,
        duration: 0,
        isHidden: false,
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

    const handleCreateService = async () => {
        try {
            await createService(formData);
            await fetchServices();
            resetForm();
        } catch (error) {
            console.error("Помилка при створенні послуги:", error);
        }
    };

    const handleUpdateService = async () => {
        if (!editingServiceId) return;
        try {
            // await updateService(editingServiceId, formData);
            await fetchServices();
            resetForm();
        } catch (error) {
            console.error("Помилка при оновленні послуги:", error);
        }
    };

    const toggleHideService = async (serviceId: number, isHidden: boolean) => {
        try {
            await toggleServiceVisibility(serviceId, isHidden);
            await fetchServices();
        } catch (error) {
            console.error("Помилка при зміні видимості послуги:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: 0,
            duration: 0,
            isHidden: false,
        });
        setIsEditing(false);
        setIsCreating(false);
        setEditingServiceId(null);
    };

    const startEditing = (service: Service) => {
        setIsEditing(true);
        setEditingServiceId(service.servicesId);
        setFormData({
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            isHidden: service.isHidden,
        });
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Послуги</h1>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Нова послуга
                </Button>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Пошук послуг..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                    <Card key={service.servicesId} className={service.isHidden ? "opacity-60" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">{service.name}</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEditing(service)}>
                                        Редагувати
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => toggleHideService(service.servicesId, service.isHidden || false)}
                                    >
                                        {service.isHidden ? "Показати" : "Приховати"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Badge variant="secondary">{service.duration} хв.</Badge>
                            <Badge variant="default">{service.price} грн</Badge>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreating || isEditing} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Редагування послуги" : "Нова послуга"}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Змініть дані послуги" : "Заповніть дані нової послуги"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Назва</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Опис</Label>
                            <Input
                                id="description"
                                value={formData.description || ""}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Ціна</Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">Тривалість (хв)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Скасувати
                        </Button>
                        <Button
                            type="button"
                            onClick={isEditing ? handleUpdateService : handleCreateService}
                        >
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
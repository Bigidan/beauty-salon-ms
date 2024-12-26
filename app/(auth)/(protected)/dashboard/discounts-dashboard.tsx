"use client";

import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal, Calendar, Search } from "lucide-react";
import { format } from "date-fns";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {createDiscount, getDiscounts, toggleDiscountActive, updateDiscount} from "@/app/db/db_manager";
import {Discount} from "@/types/discount";
import DateRangePicker from "@/components/ui/date/pick-date";
import {DateRange} from "react-day-picker";


export default function DiscountsDashboardPage() {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
    const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Discount>>({
        discountType: 'PERCENTAGE',
        value: 0,
        conditions: "",
        startDate: new Date(),
        endDate: new Date(),
        isActive: false,
    });

    const fetchDiscounts = async () => {
        try {
            const response = await getDiscounts();
            setDiscounts(response);
        } catch (error) {
            console.error("Помилка завантаження знижок:", error);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const handleCreateDiscount = async () => {
        try {
            await createDiscount(formData);
            await fetchDiscounts();
            resetForm();
        } catch (error) {
            console.error("Помилка створення знижки:", error);
        }
    };
    const handleEditDiscount = async () => {
        if (!selectedDiscountId) return;
        try {
            await updateDiscount(selectedDiscountId, formData);
            await fetchDiscounts();
            resetForm();
        } catch (error) {
            console.error("Помилка редагування знижки:", error);
        }
    };


    const resetForm = () => {
        setFormData({
            discountType: 'PERCENTAGE',
            value: 0,
            conditions: "",
            isActive: false,
            startDate: new Date(),
            endDate: new Date(),
        });
        setIsEditing(false);
        setIsCreating(false);
        setSelectedDiscount(null);
    };

    const formatDate = (timestamp: Date) => {
        return format(new Date(timestamp), 'dd.MM.yyyy');
    };

    const filteredDiscounts = discounts.filter(discount =>
        discount.conditions?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            setFormData({
                ...formData,
                startDate: range.from,
                endDate: range.to
            });
        }
    };

    return (
        <div className="w-full p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Знижки</h1>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Нова знижка
                </Button>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Пошук знижок..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiscounts.map((discount) => (
                    <Card
                        key={discount.id}
                        className={`cursor-pointer ${!discount.isActive ? "opacity-60" : ""}`}
                        onClick={() => setSelectedDiscount(discount)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">
                                {discount.value}{discount.discountType === 'PERCENTAGE' ? '%' : ' грн'}
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDiscountId(discount.id);
                                        setIsEditing(true);
                                        setFormData(discount);
                                    }}>
                                        Редагувати
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={async (e) => {
                                        e.stopPropagation();
                                        await toggleDiscountActive(discount.id, discount.isActive);
                                        await fetchDiscounts();
                                    }}>
                                        {discount.isActive ? "Деактивувати" : "Активувати"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{discount.conditions}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span className="text-sm">
                                    {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                                </span>
                            </div>
                            <Badge variant={discount.isActive ? "default" : "secondary"}>
                                {discount.isActive ? "Активна" : "Неактивна"}
                            </Badge>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreating || isEditing} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Редагування знижки" : "Нова знижка"}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Змініть дані знижки" : "Заповніть дані нової знижки"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="discountType" className="text-right">Тип</Label>
                            <Select
                                value={formData.discountType}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    discountType: value as 'PERCENTAGE' | 'FIXED'
                                })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Оберіть тип знижки" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Відсоток</SelectItem>
                                    <SelectItem value="FIXED">Фіксована сума</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value" className="text-right">Значення</Label>
                            <Input
                                id="value"
                                type="number"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="conditions" className="text-right">Умови</Label>
                            <Input
                                id="conditions"
                                value={formData.conditions || ""}
                                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right" htmlFor="range">Період</Label>
                            <div className="col-span-3 relative" id="range">
                                <DateRangePicker onDateChange={handleDateChange} />
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Скасувати
                        </Button>
                        <Button
                            type="button"
                            onClick={isEditing ? handleEditDiscount : handleCreateDiscount}
                        >
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedDiscount} onOpenChange={(open) => !open && setSelectedDiscount(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Деталі знижки</DialogTitle>
                    </DialogHeader>
                    {selectedDiscount && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium">Тип знижки:</div>
                                <div className="col-span-2">
                                    {selectedDiscount.discountType === 'PERCENTAGE' ? 'Відсоткова' : 'Фіксована сума'}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium">Значення:</div>
                                <div className="col-span-2">
                                    {selectedDiscount.value}
                                    {selectedDiscount.discountType === 'PERCENTAGE' ? '%' : ' грн'}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium">Умови:</div>
                                <div className="col-span-2">{selectedDiscount.conditions}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium">Період дії:</div>
                                <div className="col-span-2">
                                    {formatDate(selectedDiscount.startDate)} - {formatDate(selectedDiscount.endDate)}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium">Статус:</div>
                                <div className="col-span-2">
                                    <Badge variant={selectedDiscount.isActive ? "default" : "secondary"}>
                                        {selectedDiscount.isActive ? "Активна" : "Неактивна"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
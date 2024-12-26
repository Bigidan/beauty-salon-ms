import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale/uk';
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    onDateChange: (range: DateRange | undefined) => void;
    className?: string;
}

const DateRangePicker = ({ onDateChange, className }: DateRangePickerProps) => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 30),
    });

    const handleDateChange = (newDate: DateRange | undefined) => {
        setDate(newDate);
        onDateChange(newDate);
    };

    const handleQuickSelect = (value: string) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let from: Date;
        let to: Date;

        switch (value) {
            case "thisMonth":
                from = startOfMonth;
                to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case "lastMonth":
                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case "thisYear":
                from = startOfYear;
                to = new Date(now.getFullYear(), 11, 31);
                break;
            case "lastYear":
                from = new Date(now.getFullYear() - 1, 0, 1);
                to = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                from = now;
                to = now;
        }

        const newRange = { from, to };
        setDate(newRange);
        onDateChange(newRange);
    };

    return (
        <Popover modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "LLL dd, y", { locale: uk })} -{" "}
                                {format(date.to, "LLL dd, y", { locale: uk })}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y", { locale: uk })
                        )
                    ) : (
                        <span>Оберіть діапазон</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div>
                    <Select onValueChange={handleQuickSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Швидкий вибір" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            <SelectItem value="thisMonth">Цей місяць</SelectItem>
                            <SelectItem value="lastMonth">Минулий місяць</SelectItem>
                            <SelectItem value="thisYear">Цей рік</SelectItem>
                            <SelectItem value="lastYear">Минулий рік</SelectItem>
                        </SelectContent>
                    </Select>

                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                        weekStartsOn={1}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DateRangePicker;
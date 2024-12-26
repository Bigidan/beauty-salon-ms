"use client";

import React from 'react';

import {
    type ChartConfig,
} from "@/components/ui/chart"
import {DateRange} from "react-day-picker";
import ResponsiveCardGroup from "@/components/ui/stats/responsive-card-group";
import DateRangePicker from "@/components/ui/date/pick-date";


const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
]


const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#2563eb",
    },
    mobile: {
        label: "Mobile",
        color: "#60a5fa",
    },
} satisfies ChartConfig

const StatsDashboardPage = () => {


    const cards = [
        {
            id: "clients",
            title: "Активність клієнтів",
            description: "Деталі активності",
            chartData: chartData,
            chartConfig: chartConfig,
        },
        {
            id: "discounts",
            title: "Використання знижок",
            description: "Деталі використання",
            chartData: chartData,
            chartConfig: chartConfig,
        },
        {
            id: "services",
            title: "Популярність послуг",
            description: "Деталі популярності",
            chartData: chartData,
            chartConfig: chartConfig,
        },
    ];

    const handleDateChange = (range: DateRange | undefined) => {
        // Обробка вибраних дат
        console.log(range);
    };

    return (
        <div>
            <DateRangePicker onDateChange={handleDateChange} />

                <div className="p-4">
                    <ResponsiveCardGroup cards={cards}/>
                </div>
        </div>
    );
};

export default StatsDashboardPage;

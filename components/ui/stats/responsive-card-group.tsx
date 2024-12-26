import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import {Bar, BarChart, CartesianGrid, XAxis} from "recharts";
import {Button} from "@/components/ui/button";
import {Fullscreen} from "lucide-react";

type CardConfig = {
    id: string;
    title: string;
    description: string;
    chartData: any;
    chartConfig: ChartConfig;
};

type ResponsiveCardGroupProps = {
    cards: CardConfig[];
};

const ResponsiveCardGroup: React.FC<ResponsiveCardGroupProps> = ({ cards }) => {
    const [activeCard, setActiveCard] = useState<string | null>(cards[0]?.id || null);

    const handleCardClick = (cardId: string) => {
        setActiveCard(cardId);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-3">
            {/* Ліва частина: Велика картка */}
            <div className="flex-[3]">
                {cards
                    .filter((card) => card.id === activeCard)
                    .map((card) => (
                        <Card
                            key={card.id}
                            className="h-auto"
                        >
                            <CardHeader>
                                <CardTitle>{card.title}</CardTitle>
                                <CardDescription className="flex items-center w-full justify-between">
                                    {card.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={card.chartConfig} className="min-h-[200px] w-full">
                                <BarChart accessibilityLayer data={card.chartData}>
                                    <CartesianGrid vertical={false}/>
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent/>}/>
                                    <ChartLegend content={<ChartLegendContent/>}/>
                                    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}/>
                                    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4}/>
                                </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            ))}
        </div>

            {/* Права частина: Дві малі картки */}
            <div className="grid grid-rows-2 gap-3 flex-[1]">
                {cards
                    .filter((card) => card.id !== activeCard)
                    .map((card) => (
                        <Card
                            key={card.id}
                            className=" cursor-pointer"
                        >
                            <CardHeader>
                                <CardTitle>{card.title}</CardTitle>
                                <CardDescription className="flex items-center w-full justify-between">
                                    {card.description}
                                    <Button
                                        onClick={() => handleCardClick(card.id)}
                                        variant="outline"
                                    >
                                        <Fullscreen />
                                    </Button>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={card.chartConfig} className="w-full">
                                    <BarChart accessibilityLayer data={card.chartData}>
                                        <CartesianGrid vertical={false}/>
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickFormatter={(value) => value.slice(0, 3)}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent/>}/>
                                        <ChartLegend content={<ChartLegendContent/>}/>
                                        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}/>
                                        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4}/>
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    ))}
            </div>
        </div>
    );
};

export default ResponsiveCardGroup;

"use client";

import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { uk } from 'date-fns/locale/uk';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCallback, useEffect, useState } from "react";
import "./big-calendar.css"
import { getAppointments, getClientAppointments } from "@/app/db/db_manager";

const locales = {
    'uk': uk,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    employeeId?: number;
}

interface BigCalendarProps {
    selectedEmployeeId?: number;
    clientId?: number;
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
    onEventClick?: (eventId: number) => void;
    selectable?: boolean;
    refreshTrigger?: number;
}

const BigCalendar: React.FC<BigCalendarProps> = ({
                                                     selectedEmployeeId = 0,
                                                     clientId,
                                                     onSelectSlot,
                                                     onEventClick,
                                                     selectable = false,
                                                     refreshTrigger,
                                                 }) => {
    const [view, setView] = useState<View>(Views.WEEK);
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const fetchSchedule = useCallback(async () => {
        try {
            let appointmentData;

            // Визначаємо, який тип даних потрібно завантажити
            if (clientId) {
                // Якщо передано ID клієнта, отримуємо записи клієнта
                appointmentData = await getClientAppointments(clientId);
            } else {
                // Інакше отримуємо записи за працівником
                appointmentData = await getAppointments(selectedEmployeeId);
            }

            // Перетворення даних розкладу в формат подій календаря
            const calendarEvents = appointmentData.map(appointment => ({
                id: appointment.id,
                title: appointment.title || "Запис",
                start: appointment.start || new Date(),
                end: appointment.end || new Date(),
                employeeId: appointment.employeeId || 0,
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Помилка завантаження розкладу:", error);
        }
    }, [selectedEmployeeId, clientId]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule, selectedEmployeeId, clientId, refreshTrigger]);

    const handleViewChange = (newView: View) => {
        setView(newView);
    };

    const handleEventClick = (event: CalendarEvent) => {
        if (onEventClick) {
            onEventClick(event.id);
        }
    };

    return (
        <Calendar
            culture="uk"
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "98%", minHeight: "800px" }}
            views={["week", "month", "day"]}
            view={view}
            onView={handleViewChange}
            min={new Date(2024,1,0,6,0,0)}
            max={new Date(2024,1,0,21,0,0)}
            selectable={selectable}
            onSelectSlot={onSelectSlot}
            onSelectEvent={handleEventClick}
        />
    );
};

export default BigCalendar;
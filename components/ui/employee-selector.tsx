"use client";

import { useEffect, useState } from "react"
import { ChevronsUpDown, User2 } from "lucide-react"

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { getEmployees } from "@/app/db/db_manager"

interface Employee {
    employeeId: number
    fullName: string
    phone: string
    isWorking: boolean
    services: Array<{
        serviceId: number
        name: string
    }>
}

interface EmployeeSelectorProps {
    onEmployeeSelect: (employeeId: number) => void
}

export function EmployeeSelector({ onEmployeeSelect }: EmployeeSelectorProps) {
    const { isMobile } = useSidebar()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await getEmployees()
                setEmployees(data)
                // За замовчуванням встановлюємо "Всі працівники"
                setSelectedEmployee(null)
                onEmployeeSelect(0)
            } catch (error) {
                console.error("Помилка завантаження співробітників:", error)
            }
        }

        fetchEmployees()
    }, [])

    const handleEmployeeSelect = (employee: Employee | null) => {
        setSelectedEmployee(employee)
        onEmployeeSelect(employee?.employeeId || 0)
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg">
                                    <User2 className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {selectedEmployee ? selectedEmployee.fullName : "Всі працівники"}
                                </span>
                                <span className="truncate text-xs">
                                    {selectedEmployee ? selectedEmployee.phone : "Показати всіх"}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="start"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel>Співробітники</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                            {/* Додаємо опцію "Всі працівники" */}
                            <DropdownMenuItem
                                onClick={() => handleEmployeeSelect(null)}
                                className="flex items-center gap-2"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg">
                                        <User2 className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="font-semibold">Всі працівники</span>
                                    <span className="text-xs">Показати розклад всіх</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {employees.map((employee) => (
                                <DropdownMenuItem
                                    key={employee.employeeId}
                                    onClick={() => handleEmployeeSelect(employee)}
                                    className="flex items-center gap-2"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            <User2 className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="font-semibold">{employee.fullName}</span>
                                        <span className="text-xs">{employee.phone}</span>
                                    </div>
                                    {employee.isWorking && (
                                        <span className="ml-auto text-xs text-green-500">
                                            Працює
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ptBR } from "date-fns/locale";


interface DatePickerProps {
    selected: Date
    onChange: (date: Date) => void
}

export function DatePicker({ selected, onChange }: DatePickerProps) {
    // const [date, setDate] = React.useState<Date>(selected)

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !selected && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selected ? format(selected, "dd/MM/yyyy") : <span>Selecionar uma data</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selected || new Date()}
                    // @ts-ignore
                    onSelect={onChange}
                    initialFocus
                    locale={ptBR}
                />
            </PopoverContent>
        </Popover>
    )
}

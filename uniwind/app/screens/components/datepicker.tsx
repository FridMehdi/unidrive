import { useState } from "react";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import { DatePicker } from "@/components/forms/DatePicker";

export default function DatePickerScreen() {
    const [date1, setDate1] = useState<Date | undefined>(undefined);
    const [date2, setDate2] = useState<Date | undefined>(new Date());
    const [date3, setDate3] = useState<Date | undefined>(undefined);

    return (
        <>
            <Header showBackButton title="DatePicker" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <DatePicker
                    variant="classic"
                    label="Classic Variant"
                    placeholder="Select a date"
                    value={date1}
                    onChange={setDate1}
                    containerClassName="mb-8 mt-8"
                />

                <DatePicker
                    variant="inline"
                    label="Inline Variant"
                    placeholder="Select a date"
                    value={date2}
                    onChange={setDate2}
                    containerClassName="mb-8"
                />

                <DatePicker
                    variant="underlined"
                    label="Underlined Variant"
                    value={date3}
                    onChange={setDate3}
                    containerClassName="mb-8"
                />

                <DatePicker
                    variant="classic"
                    label="With Min/Max Date"
                    placeholder="Select a date"
                    value={undefined}
                    onChange={() => {}}
                    minDate={new Date(2024, 0, 1)}
                    maxDate={new Date(2025, 11, 31)}
                    containerClassName="mb-8"
                />

                <DatePicker
                    variant="classic"
                    label="With Error"
                    placeholder="Select a date"
                    value={undefined}
                    onChange={() => {}}
                    error="Please select a valid date"
                    containerClassName="mb-8"
                />

                <DatePicker
                    variant="classic"
                    label="Disabled"
                    placeholder="Select a date"
                    value={new Date()}
                    onChange={() => {}}
                    disabled
                    containerClassName="mb-8"
                />
            </ThemedScroller>
        </>
    );
}

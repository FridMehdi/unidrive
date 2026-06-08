import { useState } from "react";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Select from "@/components/forms/Select";

const COUNTRY_OPTIONS = [
    { label: "United States", value: "us" },
    { label: "United Kingdom", value: "uk" },
    { label: "Canada", value: "ca" },
    { label: "Australia", value: "au" },
    { label: "Germany", value: "de" },
];

const CATEGORY_OPTIONS = [
    { label: "Personal", value: "personal" },
    { label: "Work", value: "work" },
    { label: "Ideas", value: "ideas" },
    { label: "Archive", value: "archive" },
];

export default function SelectScreen() {
    const [country, setCountry] = useState<string | number | undefined>(undefined);
    const [category, setCategory] = useState<string | number>("personal");
    const [underlined, setUnderlined] = useState<string | number | undefined>(undefined);

    return (
        <>
            <Header showBackButton title="Select" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Select
                    variant="classic"
                    label="Classic Variant"
                    placeholder="Select a country"
                    options={COUNTRY_OPTIONS}
                    value={country}
                    onChange={setCountry}
                    containerClassName="mb-8 mt-8"
                />

           
                <Select
                    variant="underlined"
                    label="Underlined Variant"
                    placeholder="Select option"
                    options={COUNTRY_OPTIONS}
                    value={underlined}
                    onChange={setUnderlined}
                    containerClassName="mb-8"
                />

                <Select
                    variant="classic"
                    label="With Error"
                    placeholder="Select a country"
                    options={COUNTRY_OPTIONS}
                    value={undefined}
                    onChange={() => {}}
                    error="Please select a country"
                    containerClassName="mb-8"
                />

                <Select
                    variant="classic"
                    label="Disabled"
                    placeholder="Select option"
                    options={CATEGORY_OPTIONS}
                    value="work"
                    onChange={() => {}}
                    disabled
                    containerClassName="mb-8"
                />
            </ThemedScroller>
        </>
    );
}

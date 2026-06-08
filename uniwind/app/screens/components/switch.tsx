import { View } from "react-native";
import { useState } from "react";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Switch from "@/components/forms/Switch";

export default function SwitchScreen() {
    const [value1, setValue1] = useState(false);
    const [value2, setValue2] = useState(true);
    const [value3, setValue3] = useState(false);
    const [value4, setValue4] = useState(true);
    const [value5, setValue5] = useState(false);

    return (
        <>
            <Header showBackButton title="Switch" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Basic" titleSize="md" className="mt-4">
                    <View className="bg-secondary rounded-2xl px-4">
                        <Switch
                            value={value1}
                            onChange={setValue1}
                            label="Basic Toggle"
                            containerPadding="px-2 py-6"
                        />
                    </View>
                </Section>

                <Section title="With Description" titleSize="md" className="mt-8">
                    <View className="bg-secondary rounded-2xl px-4">
                        <Switch
                            value={value2}
                            onChange={setValue2}
                            label="Notifications"
                            containerPadding="px-2 py-6"
                            description="Receive push notifications for updates"
                        />
                    </View>
                </Section>


                <Section title="With icons" titleSize="md" className="mt-8">
                    <View className="bg-secondary rounded-2xl">
                        <Switch
                            className="px-4 py-4 border-b border-border"
                            value={value4}
                            onChange={setValue4}
                            label="Email Notifications"
                            description="Get notified via email"
                            icon="Mail"
                        />
                        <Switch
                            className="px-4 py-4 border-b border-border"
                            value={value5}
                            onChange={setValue5}
                            label="Sound Effects"
                            description="Play sounds for actions"
                            icon="Volume2"
                        />
                        <Switch
                            className="px-4 py-4"
                            value={true}
                            onChange={() => {}}
                            label="Auto Sync"
                            description="Sync data automatically"
                            icon="RefreshCw"
                            disabled
                        />
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

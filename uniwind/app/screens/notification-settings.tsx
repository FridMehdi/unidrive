import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Switch from "@/components/forms/Switch";
import { useState } from "react";

export default function NotificationSettingsScreen() {
    const [reminders, setReminders] = useState(true);
    const [sync, setSync] = useState(true);
    const [dailySummary, setDailySummary] = useState(true);
    const [pinnedNotes, setPinnedNotes] = useState(true);
    const [suggestions, setSuggestions] = useState(false);
    const [updates, setUpdates] = useState(true);

    return (
        <>
            <Header showBackButton />
            <ThemedScroller className="p-global">
                <Section title="Notifications" titleSize="4xl" className="mt-4 mb-10" />
                <View className="gap-4">
                    <Switch label="Note reminders" description="Get notified about your reminders" icon="Bell" value={reminders} onChange={setReminders} />
                    <Switch label="Sync notifications" description="When your notes are synced" icon="RefreshCw" value={sync} onChange={setSync} />
                    <Switch label="Daily summary" description="Daily recap of your notes" icon="Calendar" value={dailySummary} onChange={setDailySummary} />
                    <Switch label="Pinned notes" description="Updates to pinned notes" icon="Pin" value={pinnedNotes} onChange={setPinnedNotes} />
                    <Switch label="Smart suggestions" description="AI-powered note suggestions" icon="Lightbulb" value={suggestions} onChange={setSuggestions} />
                    <Switch label="App updates" description="New features and improvements" icon="Sparkles" value={updates} onChange={setUpdates} />
                </View>
            </ThemedScroller>
        </>
    );
}

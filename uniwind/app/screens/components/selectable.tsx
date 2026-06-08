import { useState } from "react";
import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Selectable from "@/components/forms/Selectable";
import ThemedText from "@/components/ThemedText";

export default function SelectableScreen() {
    const [selected1, setSelected1] = useState(false);
    const [selected2, setSelected2] = useState(true);
    const [planSelected, setPlanSelected] = useState<string>("pro");

    return (
        <>
            <Header showBackButton title="Selectable" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <View className="mt-6 mb-4">
                    <ThemedText className="text-lg font-semibold mb-3">Basic Usage</ThemedText>
                    <Selectable
                        title="Option One"
                        containerPadding="p-6"
                        description="This is a description for option one"
                        selected={selected1}
                        onPress={() => setSelected1(!selected1)}
                    />
                    <Selectable
                        title="Option Two"
                        containerPadding="p-6"
                        description="This option is selected by default"
                        selected={selected2}
                        onPress={() => setSelected2(!selected2)}
                    />
                </View>

                <View className="mb-4">
                    <ThemedText className="text-lg font-semibold mb-3">With Icons</ThemedText>
                    <Selectable
                        title="Email Notifications"
                        description="Receive updates via email"
                        icon="Mail"
                        selected={false}
                        onPress={() => {}}
                    />
                    <Selectable
                        title="Push Notifications"
                        description="Receive push notifications"
                        icon="Bell"
                        selected={true}
                        onPress={() => {}}
                    />
                    <Selectable
                        title="SMS Notifications"
                        description="Receive SMS messages"
                        icon="MessageSquare"
                        selected={false}
                        onPress={() => {}}
                    />
                </View>

                <View className="mb-8">
                    <ThemedText className="text-lg font-semibold mb-3">Subscription Plans</ThemedText>
                    <Selectable
                        title="Free Plan"
                        description="Basic features, limited storage"
                        icon="User"
                        selected={planSelected === "free"}
                        onPress={() => setPlanSelected("free")}
                    />
                    <Selectable
                        title="Pro Plan"
                        description="All features, unlimited storage"
                        icon="Star"
                        selected={planSelected === "pro"}
                        onPress={() => setPlanSelected("pro")}
                    />
                    <Selectable
                        title="Enterprise"
                        description="Custom solutions for teams"
                        icon="Building"
                        selected={planSelected === "enterprise"}
                        onPress={() => setPlanSelected("enterprise")}
                    />
                </View>

                <View className="mb-8">
                    <ThemedText className="text-lg font-semibold mb-3">With Error</ThemedText>
                    <Selectable
                        title="Accept Terms"
                        description="You must accept the terms to continue"
                        icon="FileText"
                        selected={false}
                        onPress={() => {}}
                        error="Please accept the terms and conditions"
                    />
                </View>
            </ThemedScroller>
        </>
    );
}

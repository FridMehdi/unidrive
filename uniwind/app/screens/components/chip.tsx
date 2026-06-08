import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { Chip } from "@/components/Chip";

export default function ChipScreen() {
    return (
        <>
            <Header showBackButton title="Chip" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Sizes" titleSize="md" className="mt-4 mb-1">
                    <View className="flex-row flex-wrap gap-2 items-center mt-2">
                        <Chip label="XS" size="xs" />
                        <Chip label="SM" size="sm" />
                        <Chip label="MD" size="md" />
                        <Chip label="LG" size="lg" />
                        <Chip label="XL" size="xl" />
                        <Chip label="XXL" size="xxl" />
                    </View>
                </Section>

                <Section title="Selected State" titleSize="md" className="my-6">
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        <Chip label="Not Selected" isSelected={false} />
                        <Chip label="Selected" isSelected={true} />
                    </View>
                </Section>

                <Section title="With Icons" titleSize="md" className="my-6">
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        <Chip label="Home" icon="Home" />
                        <Chip label="Settings" icon="Settings" />
                        <Chip label="Star" icon="Star" isSelected />
                    </View>
                </Section>

                <Section title="Selectable (Tap to toggle)" titleSize="md" className="my-6">
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        <Chip label="React Native" selectable />
                        <Chip label="TypeScript" selectable />
                        <Chip label="Expo" selectable />
                    </View>
                </Section>

                <Section title="Category Filter Example" titleSize="md" className="my-6">
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        <Chip label="All" isSelected />
                        <Chip label="Work" icon="Briefcase" />
                        <Chip label="Personal" icon="User" />
                        <Chip label="Ideas" icon="Lightbulb" />
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { Button } from "@/components/Button";
import ThemedText from "@/components/ThemedText";

export default function ButtonScreen() {
    return (
        <>
            <Header showBackButton title="Button" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Variants" titleSize="lg" className="mt-4 mb-4">
                    <View className="gap-3">
                        <Button title="Primary" variant="primary" />
                        <Button title="Secondary" variant="secondary" />
                        <Button title="Outline" variant="outline" />
                        <Button title="Ghost" variant="ghost" />
                    </View>
                </Section>

                <Section title="Sizes" titleSize="lg" className="mb-4">
                    <View className="gap-3">
                        <Button title="Small" size="small" />
                        <Button title="Medium" size="medium" />
                        <Button title="Large" size="large" />
                    </View>
                </Section>

                <Section title="Rounded" titleSize="lg" className="mb-4">
                    <View className="gap-3">
                        <Button title="None" rounded="none" />
                        <Button title="Medium" rounded="md" />
                        <Button title="Full" rounded="full" />
                    </View>
                </Section>

                <Section title="With Icons" titleSize="lg" className="mb-4">
                    <View className="gap-3">
                        <Button title="Icon Start" iconStart="Plus" />
                        <Button title="Icon End" iconEnd="ArrowRight" />
                        <Button title="Both Icons" iconStart="Star" iconEnd="ChevronRight" />
                    </View>
                </Section>

                <Section title="States" titleSize="lg" className="mb-4">
                    <View className="gap-3">
                        <Button title="Loading..." loading />
                        <Button title="Disabled" disabled />
                    </View>
                </Section>

                <Section title="Combined" titleSize="lg" className="mb-8">
                    <View className="gap-3">
                        <Button
                            title="Get Started"
                            variant="primary"
                            size="large"
                            rounded="full"
                            iconEnd="ArrowRight"
                        />
                        <Button
                            title="Learn More"
                            variant="outline"
                            rounded="full"
                            iconStart="Info"
                        />
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

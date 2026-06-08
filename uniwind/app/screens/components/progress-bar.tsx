import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import ProgressBar from "@/components/ProgressBar";
import ThemedText from "@/components/ThemedText";

export default function ProgressBarScreen() {
    return (
        <>
            <Header showBackButton title="Progress Bar" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Progress Values" titleSize="lg" className="mt-4 mb-4">
                    <View className="gap-4">
                        <View>
                            <ThemedText className="mb-2 opacity-60">0%</ThemedText>
                            <ProgressBar percentage={0} />
                        </View>
                        <View>
                            <ThemedText className="mb-2 opacity-60">25%</ThemedText>
                            <ProgressBar percentage={25} />
                        </View>
                        <View>
                            <ThemedText className="mb-2 opacity-60">50%</ThemedText>
                            <ProgressBar percentage={50} />
                        </View>
                        <View>
                            <ThemedText className="mb-2 opacity-60">75%</ThemedText>
                            <ProgressBar percentage={75} />
                        </View>
                        <View>
                            <ThemedText className="mb-2 opacity-60">100%</ThemedText>
                            <ProgressBar percentage={100} />
                        </View>
                    </View>
                </Section>

                <Section title="Use Case: File Upload" titleSize="lg" className="mb-4">
                    <View className="bg-secondary rounded-2xl p-4">
                        <View className="flex-row items-center mb-3">
                            <ThemedText className="font-semibold flex-1">Uploading photo.jpg</ThemedText>
                            <ThemedText className="opacity-60">67%</ThemedText>
                        </View>
                        <ProgressBar percentage={67} />
                    </View>
                </Section>

                <Section title="Use Case: Course Progress" titleSize="lg" className="mb-4">
                    <View className="bg-secondary rounded-2xl p-4">
                        <ThemedText className="font-semibold mb-1">React Native Basics</ThemedText>
                        <ThemedText className="text-sm opacity-60 mb-3">8 of 12 lessons completed</ThemedText>
                        <ProgressBar percentage={66} />
                    </View>
                </Section>

                <Section title="Use Case: Profile Completion" titleSize="lg" className="mb-8">
                    <View className="bg-secondary rounded-2xl p-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <ThemedText className="font-semibold">Profile Completion</ThemedText>
                            <ThemedText className="text-highlight font-semibold">85%</ThemedText>
                        </View>
                        <ProgressBar percentage={85} />
                        <ThemedText className="text-sm opacity-60 mt-3">
                            Add a profile photo to complete your profile
                        </ThemedText>
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

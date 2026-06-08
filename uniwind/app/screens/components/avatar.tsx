import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Avatar from "@/components/Avatar";
import ThemedText from "@/components/ThemedText";

const SAMPLE_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

export default function AvatarScreen() {
    return (
        <>
            <Header showBackButton title="Avatar" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Sizes" titleSize="md" className="mt-4 mb-6">
                    <View className="flex-row items-end gap-3 flex-wrap">
                        <View className="items-center">
                            <Avatar size="xxs" src={SAMPLE_AVATAR} />
                            <ThemedText className="text-xs mt-1 opacity-50">xxs</ThemedText>
                        </View>
                        <View className="items-center">
                            <Avatar size="xs" src={SAMPLE_AVATAR} />
                            <ThemedText className="text-xs mt-1 opacity-50">xs</ThemedText>
                        </View>
                        <View className="items-center">
                            <Avatar size="sm" src={SAMPLE_AVATAR} />
                            <ThemedText className="text-xs mt-1 opacity-50">sm</ThemedText>
                        </View>
                        <View className="items-center">
                            <Avatar size="md" src={SAMPLE_AVATAR} />
                            <ThemedText className="text-xs mt-1 opacity-50">md</ThemedText>
                        </View>
                        <View className="items-center">
                            <Avatar size="lg" src={SAMPLE_AVATAR} />
                            <ThemedText className="text-xs mt-1 opacity-50">lg</ThemedText>
                        </View>
                        <View className="items-center">
                            <Avatar size="xl" src={SAMPLE_AVATAR} />
                            <ThemedText className="text-xs mt-1 opacity-50">xl</ThemedText>
                        </View>
                    </View>
                </Section>

                <Section title="With Initials (No Image)" titleSize="md" className="my-6">
                    <View className="flex-row gap-3 flex-wrap">
                        <Avatar size="lg" name="John Doe" />
                        <Avatar size="lg" name="Alice Smith" />
                        <Avatar size="lg" name="Bob" />
                        <Avatar size="lg" name="Sarah Connor" />
                    </View>
                </Section>

                <Section title="With Border" titleSize="md" className="my-6">
                    <View className="flex-row gap-3 flex-wrap">
                        <Avatar size="lg" src={SAMPLE_AVATAR} border />
                        <Avatar size="lg" name="JD" border />
                        <Avatar size="xl" src={SAMPLE_AVATAR} border />
                    </View>
                </Section>

                <Section title="Custom Background" titleSize="md" className="my-6">
                    <View className="flex-row gap-3 flex-wrap">
                        <Avatar size="lg" textColor="text-white" name="Anthony Balkan" bgColor="bg-red-400" />
                        <Avatar size="lg" textColor="text-white" name="Celine Dion" bgColor="bg-blue-400" />
                        <Avatar size="lg" textColor="text-white" name="Elvis Presley" bgColor="bg-green-400" />
                        <Avatar size="lg" textColor="text-white" name="Frank" bgColor="bg-purple-400" />
                    </View>
                </Section>

                    <Section title="User List Example" titleSize="md" className="my-6">
                    <View className="bg-secondary rounded-2xl p-4 mt-4">
                        <View className="flex-row items-center mb-4">
                            <Avatar size="md" src={SAMPLE_AVATAR} />
                            <View className="ml-3">
                                <ThemedText className="font-semibold">John Doe</ThemedText>
                                <ThemedText className="text-sm opacity-50">john@example.com</ThemedText>
                            </View>
                        </View>
                        <View className="flex-row items-center mb-4">
                            <Avatar size="md" name="Alice Smith" border />
                            <View className="ml-3">
                                <ThemedText className="font-semibold">Alice Smith</ThemedText>
                                <ThemedText className="text-sm opacity-50">alice@example.com</ThemedText>
                            </View>
                        </View>
                        <View className="flex-row items-center">
                            <Avatar size="md" name="Bob Wilson" bgColor="bg-highlight" />
                            <View className="ml-3">
                                <ThemedText className="font-semibold">Bob Wilson</ThemedText>
                                <ThemedText className="text-sm opacity-50">bob@example.com</ThemedText>
                            </View>
                        </View>
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

import { View, Image } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Expandable from "@/components/Expandable";
import ThemedText from "@/components/ThemedText";
import { Button } from "@/components/Button";
import Icon from "@/components/Icon";
import { Chip } from "@/components/Chip";

export default function ExpandableScreen() {
    return (
        <>
            <Header showBackButton title="Expandable" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Basic" titleSize="lg" className="mt-4" />
                    <Expandable title="What is Noty?" hasBorder={false}>
                        <ThemedText className="opacity-80">
                            Noty is a note-taking app template built with React Native and Expo.
                            It provides a beautiful, customizable foundation for building your own note-taking application.
                        </ThemedText>
                    </Expandable>

                <Section title="With Icon & Description" titleSize="lg" className="mb-2 mt-8" />
                    <Expandable
                        icon="Info"
                        title="How does it work?"
                        hasBorder={false}
                        description="Tap to learn more"
                    >
                        <ThemedText className="opacity-80">
                            Simply tap the header to expand and see more content. Tap again to collapse.
                            The description prop shows a subtitle in the header, while children render as the expandable content.
                        </ThemedText>
                    </Expandable>

                <Section title="Rich Content" titleSize="lg" className="mb-2 mt-8" />
                    <Expandable icon="Image" title="With Image">
                        <Image
                            source={{ uri: "https://picsum.photos/400/200" }}
                            className="w-full h-32 rounded-xl mb-3"
                        />
                        <ThemedText className="opacity-80">
                            Expandable sections can contain images and any other media content.
                        </ThemedText>
                    </Expandable>

                    <Expandable icon="List" title="With List Items">
                        <View className="gap-3">
                            {["Create notes quickly", "Organize with folders", "Search everything", "Sync across devices"].map((item, i) => (
                                <View key={i} className="flex-row items-center gap-3">
                                    <Icon name="Check" size={16} className="text-primary" />
                                    <ThemedText>{item}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </Expandable>

                    <Expandable icon="Sparkles" title="With Actions" hasBorder={false}>
                        <ThemedText className="opacity-80 mb-4">
                            You can include interactive elements like buttons and chips inside expandable content.
                        </ThemedText>
                        <View className="flex-row gap-2 mb-3">
                            <Chip label="Feature" />
                            <Chip label="Popular" />
                            <Chip label="New" />
                        </View>
                        <Button title="Learn More" size="small" />
                    </Expandable>
                <Section title="FAQ Example" titleSize="lg" className="mb-2 mt-8" />
                    <View className="gap-2">
                        <Expandable icon="CreditCard" title="What payment methods do you accept?">
                            <ThemedText className="opacity-80">
                                We accept all major credit cards, PayPal, and Apple Pay. All payments are securely processed through Stripe.
                            </ThemedText>
                        </Expandable>
                        <Expandable icon="RefreshCw" title="Can I cancel my subscription?">
                            <ThemedText className="opacity-80">
                                Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.
                            </ThemedText>
                        </Expandable>
                        <Expandable icon="Shield" title="Is my data secure?">
                            <ThemedText className="opacity-80 mb-3">
                                Absolutely. We use industry-standard encryption to protect your data:
                            </ThemedText>
                            <View className="gap-2">
                                <View className="flex-row items-center gap-2">
                                    <Icon name="Lock" size={14} className="text-primary" />
                                    <ThemedText className="text-sm">End-to-end encryption</ThemedText>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <Icon name="Server" size={14} className="text-primary" />
                                    <ThemedText className="text-sm">Secure cloud storage</ThemedText>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <Icon name="Key" size={14} className="text-primary" />
                                    <ThemedText className="text-sm">Two-factor authentication</ThemedText>
                                </View>
                            </View>
                        </Expandable>
                        <Expandable icon="HelpCircle" title="How do I contact support?" hasBorder={false}>
                            <ThemedText className="opacity-80 mb-3">
                                You can reach our support team via email or through the in-app help center. We typically respond within 24 hours.
                            </ThemedText>
                            <Button title="Contact Support" variant="outline" size="small" />
                        </Expandable>
                    </View>
            </ThemedScroller>
        </>
    );
}

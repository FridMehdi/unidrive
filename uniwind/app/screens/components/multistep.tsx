import { View } from "react-native";
import MultiStep, { Step } from "@/components/MultiStep";
import ThemedText from "@/components/ThemedText";
import Icon, { IconName } from "@/components/Icon";
import { router } from "expo-router";
import Selectable from "@/components/forms/Selectable";
import { useState } from "react";
import Input from "@/components/forms/Input";

const interests = [
    { id: "design", title: "Design", description: "Design related interests", icon: "Palette" },
    { id: "development", title: "Development", description: "Development related interests", icon: "Code" },
    { id: "marketing", title: "Marketing", description: "Marketing related interests", icon: "Megaphone" },
    { id: "business", title: "Business", description: "Business related interests", icon: "Briefcase" },
    { id: "photography", title: "Photography", description: "Photography related interests", icon: "Camera" },
    { id: "music", title: "Music", description: "Music related interests", icon: "Music" },
];

export default function MultiStepScreen() {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <MultiStep
            onComplete={() => router.back()}
            onClose={() => router.back()}
            showHeader={true}
            showStepIndicator={true}
        >
            <Step title="Welcome">
                <View className="flex-1 px-global justify-center">
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 rounded-full bg-highlight/10 items-center justify-center mb-6">
                            <Icon name="Sparkles" size={40} className="rounded-full bg-secondary p-6" />
                        </View>
                        <ThemedText className="text-3xl font-bold text-center mb-3">
                            Welcome to Noty
                        </ThemedText>
                        <ThemedText className="text-center opacity-60 px-8">
                            Your personal space for capturing ideas, organizing thoughts, and staying productive.
                        </ThemedText>
                    </View>
                </View>
            </Step>

            <Step title="Your Name">
                <View className="flex-1 px-global pt-8">
                    <ThemedText className="text-3xl font-bold mb-2">
                        What's your name?
                    </ThemedText>
                    <ThemedText className="opacity-60 mb-8">
                        Let us know how to address you.
                    </ThemedText>
                    <Input
                        placeholder="Enter your name"
                        variant="classic"
                    />
                </View>
            </Step>

            <Step title="Interests" optional>
                <View className="flex-1 px-global pt-8">
                    <ThemedText className="text-3xl font-bold mb-2">
                        What are you interested in?
                    </ThemedText>
                    <ThemedText className="opacity-60 mb-8">
                        Select topics to personalize your experience.
                    </ThemedText>
                    <View className="gap-0">
                        {interests.map((interest) => (
                            <Selectable
                                key={interest.id}
                                icon={interest.icon as IconName}
                                title={interest.title}
                                description={interest.description}
                                selected={selectedInterests.includes(interest.id)}
                                onPress={() => toggleInterest(interest.id)}
                            />
                        ))}
                    </View>
                </View>
            </Step>

            <Step title="Ready">
                <View className="flex-1 px-global justify-center">
                    <View className="items-center">
                        <View className="w-24 h-24 rounded-full items-center justify-center mb-6">
                            <Icon name="Check" size={40} color="white" className="rounded-full bg-highlight p-6" />
                        </View>
                        <ThemedText className="text-3xl font-bold text-center mb-3">
                            All set!
                        </ThemedText>
                        <ThemedText className="text-center opacity-60 px-8">
                            Start capturing your ideas and let Noty help you stay organized.
                        </ThemedText>
                    </View>
                </View>
            </Step>
        </MultiStep>
    );
}

import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Review from "@/components/Review";
import ThemedText from "@/components/ThemedText";

const SAMPLE_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";
const SAMPLE_AVATAR_2 = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

export default function ReviewScreen() {
    return (
        <>
            <Header showBackButton title="Review" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Basic Review" titleSize="lg" className="mt-4 mb-8">
                    <View className="bg-secondary rounded-2xl p-4">
                        <Review
                            rating={5}
                            description="Excellent app! Very intuitive and easy to use. Highly recommended for anyone looking to organize their notes."
                            date="2 days ago"
                        />
                    </View>
                </Section>

                <Section title="With Username" titleSize="lg" className="mb-8">
                    <View className="bg-secondary rounded-2xl p-4">
                        <Review
                            rating={4}
                            description="Great features and clean design. Would love to see more customization options in future updates."
                            date="1 week ago"
                            username="John Doe"
                        />
                    </View>
                </Section>

                <Section title="With Avatar" titleSize="lg" className="mb-8">
                    <View className="bg-secondary rounded-2xl p-4">
                        <Review
                            rating={5}
                            description="This app has completely changed how I manage my daily tasks. The sync feature works flawlessly!"
                            date="3 days ago"
                            username="Sarah Wilson"
                            avatar={SAMPLE_AVATAR_2}
                        />
                    </View>
                </Section>

                <Section title="Different Ratings" titleSize="lg" className="mb-8">
                    <View className="gap-4">
                        <View className="bg-secondary rounded-2xl p-4">
                            <Review
                                rating={5}
                                description="Perfect! 5 stars."
                                date="Today"
                                username="Happy User"
                            />
                        </View>
                        <View className="bg-secondary rounded-2xl p-4">
                            <Review
                                rating={3}
                                description="It's okay, but could use some improvements."
                                date="Yesterday"
                                username="Neutral User"
                            />
                        </View>
                        <View className="bg-secondary rounded-2xl p-4">
                            <Review
                                rating={1}
                                description="Not what I expected."
                                date="Last week"
                                username="Critical User"
                            />
                        </View>
                    </View>
                </Section>

                <Section title="Review List Example" titleSize="lg" className="mb-8">
                    <View className="bg-secondary rounded-2xl">
                        <Review
                            className="p-4 border-b border-border"
                            rating={5}
                            description="Love the dark mode feature!"
                            date="1 hour ago"
                            username="Mike Johnson"
                            avatar={SAMPLE_AVATAR}
                        />
                        <Review
                            className="p-4 border-b border-border"
                            rating={4}
                            description="Very useful for daily note-taking."
                            date="5 hours ago"
                            username="Emily Chen"
                            avatar={SAMPLE_AVATAR_2}
                        />
                        <Review
                            className="p-4"
                            rating={5}
                            description="Best note app I've used so far."
                            date="2 days ago"
                            username="Alex Turner"
                        />
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { CardScroller } from "@/components/CardScroller";
import Card from "@/components/Card";
import ThemedText from "@/components/ThemedText";

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop";
const SAMPLE_IMAGE_2 = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop";
const SAMPLE_IMAGE_3 = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&h=200&fit=crop";

export default function CardScrollerScreen() {
    return (
        <>
            <Header showBackButton title="Card Scroller" />
            <ThemedScroller className="flex-1 bg-background">
                <Section title="Basic" titleSize="lg" className="mt-4 mb-4">
                    <ThemedText className="opacity-60 mb-2">
                        Horizontal scrolling container for cards.
                    </ThemedText>
                </Section>

                <CardScroller className="mb-8">
                    <Card
                        title="Mountain View"
                        description="Beautiful scenery"
                        image={SAMPLE_IMAGE}
                        variant="classic"
                        width={200}
                        imageHeight={120}
                    />
                    <Card
                        title="Forest Trail"
                        description="Nature escape"
                        image={SAMPLE_IMAGE_2}
                        variant="classic"
                        width={200}
                        imageHeight={120}
                    />
                    <Card
                        title="Lake Side"
                        description="Peaceful retreat"
                        image={SAMPLE_IMAGE_3}
                        variant="classic"
                        width={200}
                        imageHeight={120}
                    />
                </CardScroller>


                <CardScroller title="With title" className="mb-8">
                    <Card
                        title="Destination 1"
                        image={SAMPLE_IMAGE}
                        variant="overlay"
                        width={140}
                        imageHeight={200}
                    />
                    <Card
                        title="Destination 2"
                        image={SAMPLE_IMAGE_2}
                        variant="overlay"
                        width={140}
                        imageHeight={200}
                    />
                    <Card
                        title="Destination 3"
                        image={SAMPLE_IMAGE_3}
                        variant="overlay"
                        width={140}
                        imageHeight={200}
                    />
                </CardScroller>


                <CardScroller title="With link" allUrl="/screens/components" className="mb-8">
                    <Card
                        title="Item 1"
                        description="$99"
                        image={SAMPLE_IMAGE}
                        variant="classic"
                        width={160}
                        imageHeight={150}
                    />
                    <Card
                        title="Item 2"
                        description="$149"
                        image={SAMPLE_IMAGE_2}
                        variant="classic"
                        width={160}
                        imageHeight={150}
                    />
                    <Card
                        title="Item 3"
                        description="$199"
                        image={SAMPLE_IMAGE_3}
                        variant="classic"
                        width={160}
                        imageHeight={150}
                    />
                </CardScroller>


                <CardScroller title="Custom spacing" space={4} className="mb-8">
                    <View className="w-32 h-32 bg-highlight rounded-2xl items-center justify-center">
                        <ThemedText className="text-white font-bold">1</ThemedText>
                    </View>
                    <View className="w-32 h-32 bg-highlight rounded-2xl items-center justify-center">
                        <ThemedText className="text-white font-bold">2</ThemedText>
                    </View>
                    <View className="w-32 h-32 bg-highlight rounded-2xl items-center justify-center">
                        <ThemedText className="text-white font-bold">3</ThemedText>
                    </View>
                    <View className="w-32 h-32 bg-highlight rounded-2xl items-center justify-center">
                        <ThemedText className="text-white font-bold">4</ThemedText>
                    </View>
                </CardScroller>

                <View className="h-8" />
            </ThemedScroller>
        </>
    );
}

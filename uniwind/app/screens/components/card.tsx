import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Card from "@/components/Card";

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop";
const SAMPLE_IMAGE_2 = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop";

export default function CardScreen() {
    return (
        <>
            <Header showBackButton title="Card" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Classic Variant" titleSize="lg" className="mt-4 mb-4">
                    <Card
                        title="Mountain Adventure"
                        description="Explore the beautiful mountain ranges"
                        image={SAMPLE_IMAGE}
                        variant="classic"
                    />
                </Section>

                <Section title="Overlay Variant" titleSize="lg" className="mb-4">
                    <Card
                        title="Nature Escape"
                        description="Find peace in the wilderness"
                        image={SAMPLE_IMAGE_2}
                        variant="overlay"
                        imageHeight={200}
                    />
                </Section>

                <Section title="With Badge" titleSize="lg" className="mb-4">
                    <Card
                        title="Featured Destination"
                        description="Top pick for this season"
                        image={SAMPLE_IMAGE}
                        variant="classic"
                        badge="Featured"
                        badgeColor="#6366f1"
                    />
                </Section>

                <Section title="With Price & Rating" titleSize="lg" className="mb-4">
                    <Card
                        title="Luxury Resort"
                        description="5-star accommodation"
                        image={SAMPLE_IMAGE_2}
                        variant="classic"
                        price="$299/night"
                        rating={4.8}
                    />
                </Section>

                <Section title="With Button" titleSize="lg" className="mb-4">
                    <Card
                        title="Book Your Stay"
                        description="Limited availability"
                        image={SAMPLE_IMAGE}
                        variant="classic"
                        button="Book Now"
                        onButtonPress={() => {}}
                    />
                </Section>

                <Section title="With Favorite" titleSize="lg" className="mb-4">
                    <Card
                        title="Save for Later"
                        description="Add to your wishlist"
                        image={SAMPLE_IMAGE_2}
                        variant="classic"
                        hasFavorite
                    />
                </Section>

                
            </ThemedScroller>
        </>
    );
}

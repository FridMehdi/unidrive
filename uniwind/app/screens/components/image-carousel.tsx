import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import ImageCarousel from "@/components/ImageCarousel";
import ThemedText from "@/components/ThemedText";

const SAMPLE_IMAGES = [
    "https://images.pexels.com/photos/7932264/pexels-photo-7932264.jpeg",
    "https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg",
    "https://images.pexels.com/photos/459319/pexels-photo-459319.jpeg",
    "https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg",
];

export default function ImageCarouselScreen() {
    return (
        <>
            <Header showBackButton title="ImageCarousel" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <View className="mt-6 mb-4">
                    <ThemedText className="text-lg font-semibold mb-3">Dot Pagination</ThemedText>
                    <ImageCarousel
                        images={SAMPLE_IMAGES}
                        height={200}
                        showPagination={true}
                        paginationStyle="dots"
                        rounded="2xl"
                    />
                </View>

                <View className="mb-4">
                    <ThemedText className="text-lg font-semibold mb-3">Number Pagination</ThemedText>
                    <ImageCarousel
                        images={SAMPLE_IMAGES}
                        height={200}
                        showPagination={true}
                        paginationStyle="numbers"
                        rounded="2xl"
                    />
                </View>

                <View className="mb-4">
                    <ThemedText className="text-lg font-semibold mb-3">No Pagination</ThemedText>
                    <ImageCarousel
                        images={SAMPLE_IMAGES}
                        height={180}
                        showPagination={false}
                        rounded="xl"
                    />
                </View>

                <View className="mb-4">
                    <ThemedText className="text-lg font-semibold mb-3">Rounded Corners</ThemedText>
                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <ImageCarousel
                                images={[SAMPLE_IMAGES[0]]}
                                height={120}
                                showPagination={false}
                                rounded="lg"
                            />
                            <ThemedText className="text-xs text-center mt-1 opacity-50">lg</ThemedText>
                        </View>
                        <View className="flex-1">
                            <ImageCarousel
                                images={[SAMPLE_IMAGES[1]]}
                                height={120}
                                showPagination={false}
                                rounded="2xl"
                            />
                            <ThemedText className="text-xs text-center mt-1 opacity-50">2xl</ThemedText>
                        </View>
                    </View>
                </View>

                <View className="mb-8">
                    <ThemedText className="text-lg font-semibold mb-3">Tall Carousel</ThemedText>
                    <ImageCarousel
                        images={SAMPLE_IMAGES.slice(0, 2)}
                        height={300}
                        showPagination={true}
                        paginationStyle="dots"
                        rounded="2xl"
                    />
                </View>
            </ThemedScroller>
        </>
    );
}

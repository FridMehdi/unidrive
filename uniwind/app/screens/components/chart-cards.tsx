import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { SmallChartCard } from "@/components/SmallChartCard";
import { SmallCircleCard } from "@/components/SmallCircleCard";
import ThemedText from "@/components/ThemedText";

export default function ChartCardsScreen() {
    return (
        <>
            <Header showBackButton title="Chart Cards" />
            <ThemedScroller className="flex-1 bg-background px-global">
                
                    <SmallChartCard
                        className="mb-4"
                        title="Weekly Activity"
                        subtitle="Last 7 days"
                        data={[20, 45, 28, 80, 99, 43, 65]}
                    />

                    <SmallChartCard
                        title="Steps"
                        className="mb-4"
                        subtitle="This week"
                        data={[5000, 7500, 6200, 8100, 9200, 7800, 8500]}
                        value="8,500"
                        unit="steps"
                    />

                    <SmallChartCard
                        title="Revenue"
                        className="mb-4"
                        subtitle="Monthly trend"
                        data={[120, 150, 180, 140, 200, 220, 190]}
                        lineColor="#22c55e"
                        value="$2,450"
                        unit="total"
                    />

                    <SmallCircleCard
                        title="Progress"
                        className="mb-4"
                        subtitle="Course completion"
                        percentage={75}
                    />

                    <SmallCircleCard
                        title="Storage Used"
                        className="mb-4"
                        subtitle="of 100 GB"
                        percentage={42}
                        value="42"
                        unit="GB"
                    />

                    <SmallCircleCard
                        title="Tasks"
                        className="mb-4"
                        subtitle="This week"
                        percentage={0}
                        comparison={{
                            category1: {
                                name: "Completed",
                                value: 12,
                                color: "#22c55e"
                            },
                            category2: {
                                name: "Pending",
                                value: 5,
                                color: "#f97316"
                            }
                        }}
                    />

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <SmallCircleCard
                                title="Health"
                                className="mb-4"
                                percentage={85}
                                size={60}
                            />
                        </View>
                        <View className="flex-1">
                            <SmallCircleCard
                                title="Goals"
                                percentage={60}
                                size={60}
                                circleColor="#f97316"
                            />
                        </View>
                    </View>
            </ThemedScroller>
        </>
    );
}

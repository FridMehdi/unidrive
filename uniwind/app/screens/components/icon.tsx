import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Icon, { IconName } from "@/components/Icon";
import ThemedText from "@/components/ThemedText";
import useThemeColors from "@/contexts/ThemeColors";

const ICONS: IconName[] = [
    "Home", "User", "Settings", "Bell", "Search",
    "Plus", "Minus", "Check", "X", "ChevronRight",
    "ChevronLeft", "ChevronDown", "ChevronUp", "ArrowRight", "ArrowLeft",
    "Heart", "Star", "Mail", "Phone", "MapPin",
    "Calendar", "Clock", "Camera", "Image", "FileText",
    "Folder", "Download", "Upload", "Share", "Link",
    "Edit", "Trash", "Copy", "Eye", "EyeOff",
    "Lock", "Unlock", "Key", "Shield", "AlertTriangle",
    "Info", "HelpCircle", "MessageCircle", "Send", "Bookmark",
    "Tag", "Filter", "Menu", "MoreHorizontal", "MoreVertical",
    "Sun", "Moon", "Cloud", "Zap", "Award",
    "Gift", "ShoppingCart", "CreditCard", "DollarSign", "Percent",
    "RefreshCw", "RotateCcw", "Play", "Pause", "Volume2",
    "Wifi", "Bluetooth", "Battery", "Smartphone", "Monitor",
    "Globe", "Flag", "Compass", "Map", "Navigation",
];

export default function IconScreen() {
    const colors = useThemeColors();

    return (
        <>
            <Header showBackButton title="Icons" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Available Icons" titleSize="lg" className="mt-4 mb-4">
                    <ThemedText className="opacity-60 mb-4">
                        Tap any icon to see its name. Icons are from Lucide.
                    </ThemedText>
                    <View className="flex-row flex-wrap gap-2">
                        {ICONS.map((iconName) => (
                            <View
                                key={iconName}
                                className="w-16 h-16 bg-secondary rounded-xl items-center justify-center"
                            >
                                <Icon name={iconName} size={24} color={colors.text} />
                                <ThemedText className="text-[8px] mt-1 opacity-50">
                                    {iconName}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </Section>

                <Section title="Sizes" titleSize="lg" className="mb-4">
                    <View className="flex-row items-end gap-4 bg-secondary p-4 rounded-2xl">
                        <View className="items-center">
                            <Icon name="Star" size={16} color={colors.text} />
                            <ThemedText className="text-xs mt-1 opacity-50">16</ThemedText>
                        </View>
                        <View className="items-center">
                            <Icon name="Star" size={20} color={colors.text} />
                            <ThemedText className="text-xs mt-1 opacity-50">20</ThemedText>
                        </View>
                        <View className="items-center">
                            <Icon name="Star" size={24} color={colors.text} />
                            <ThemedText className="text-xs mt-1 opacity-50">24</ThemedText>
                        </View>
                        <View className="items-center">
                            <Icon name="Star" size={32} color={colors.text} />
                            <ThemedText className="text-xs mt-1 opacity-50">32</ThemedText>
                        </View>
                        <View className="items-center">
                            <Icon name="Star" size={48} color={colors.text} />
                            <ThemedText className="text-xs mt-1 opacity-50">48</ThemedText>
                        </View>
                    </View>
                </Section>

                <Section title="Colors" titleSize="lg" className="mb-8">
                    <View className="flex-row gap-4 bg-secondary p-4 rounded-2xl">
                        <Icon name="Heart" size={32} color="#ef4444" />
                        <Icon name="Heart" size={32} color="#f97316" />
                        <Icon name="Heart" size={32} color="#eab308" />
                        <Icon name="Heart" size={32} color="#22c55e" />
                        <Icon name="Heart" size={32} color="#3b82f6" />
                        <Icon name="Heart" size={32} color="#8b5cf6" />
                    </View>
                </Section>
            </ThemedScroller>
        </>
    );
}

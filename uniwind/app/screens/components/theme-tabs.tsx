import { View } from "react-native";
import Header from "@/components/Header";
import Section from "@/components/layout/Section";
import ThemeTabs, { ThemeTab } from "@/components/ThemeTabs";
import ThemedText from "@/components/ThemedText";
import { Button } from "@/components/Button";
import Icon from "@/components/Icon";
import useThemeColors from "@/contexts/ThemeColors";
import Avatar from "@/components/Avatar";

export default function ThemeTabsScreen() {
    const colors = useThemeColors();

    return (
        <>
            <Header className="bg-secondary" showBackButton title="Theme Tabs" />
            <ThemeTabs
                classNameBg="bg-secondary"
                headerComponent={
                    <View className="px-global pt-4 pb-8 bg-secondary items-center justify-center">
                        <Avatar name="John Doe" size="xl" bgColor="bg-neutral-500" textColor="text-white" border />
                        <ThemedText className="font-bold text-2xl mt-2">
                            Tabs header
                        </ThemedText>
                    </View>
                }
            >
                <ThemeTab name="Overview">
                    <View className="flex-1 items-center justify-center">
                        <ThemedText className="text-2xl font-bold">Overview</ThemedText>
                    </View>
                </ThemeTab>

                <ThemeTab name="Activity">
                    <View className="flex-1 items-center justify-center">
                        <ThemedText className="text-2xl font-bold">Activity</ThemedText>
                    </View>
                </ThemeTab>

                <ThemeTab name="Settings">
                    <View className="flex-1 items-center justify-center">
                        <ThemedText className="text-2xl font-bold">Settings</ThemedText>
                    </View>
                </ThemeTab>
            </ThemeTabs>
        </>
    );
}

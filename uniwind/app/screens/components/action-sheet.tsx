import { View } from "react-native";
import { useRef } from "react";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import ActionSheetThemed from "@/components/ActionSheetThemed";
import { ActionSheetRef } from "react-native-actions-sheet";
import { Button } from "@/components/Button";
import ThemedText from "@/components/ThemedText";
import Icon from "@/components/Icon";
import useThemeColors from "@/contexts/ThemeColors";
import { ActionSheetItem } from "@/components/ActionSheetThemed";

export default function ActionSheetScreen() {
    const colors = useThemeColors();
    const basicSheetRef = useRef<ActionSheetRef>(null);
    const confirmSheetRef = useRef<ActionSheetRef>(null);
    const menuSheetRef = useRef<ActionSheetRef>(null);

    return (
        <>
            <Header showBackButton title="Action Sheet" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Basic" subtitle="A themed bottom sheet that adapts to light/dark mode." titleSize="lg" className="mt-4 mb-8">
                    
                    <Button
                        title="Open Basic Sheet"
                        onPress={() => basicSheetRef.current?.show()}
                        variant="primary"
                        rounded="full"
                    />
                </Section>

                    <Section title="Confirmation Dialog" subtitle="Use for confirmations, success messages, or alerts." titleSize="lg" className="mb-8">
                        
                    <Button
                        title="Open Confirmation"
                        onPress={() => confirmSheetRef.current?.show()}
                        variant="primary"
                        rounded="full"
                    />
                </Section>

                <Section title="Menu / Options" subtitle="Use for action menus or option lists." titleSize="lg" className="mb-8">
                    <Button
                        title="Open Menu"
                        onPress={() => menuSheetRef.current?.show()}
                        variant="primary"
                        rounded="full"
                    />
                </Section>
            </ThemedScroller>

            {/* Basic Sheet */}
            <ActionSheetThemed ref={basicSheetRef} gestureEnabled>
                <View className="p-6">
                    <ThemedText className="text-2xl font-bold mb-2">Basic Sheet</ThemedText>
                    <ThemedText className="opacity-60 mb-6">
                        This is a basic action sheet with some content. It supports gestures for dismissal.
                    </ThemedText>
                    <Button
                        title="Close"
                        onPress={() => basicSheetRef.current?.hide()}
                        rounded="full"
                    />
                </View>
            </ActionSheetThemed>

            {/* Confirmation Sheet */}
            <ActionSheetThemed ref={confirmSheetRef} gestureEnabled>
                <View className="px-6 pt-10 pb-6 items-center">
                    <Icon name="Check" size={24} className="w-20 h-20 bg-green-500 rounded-full mb-6" color="white" />
                    <ThemedText className="font-semibold text-3xl">Success!</ThemedText>
                    <ThemedText className="text-lg text-center px-10 opacity-60 mt-2 mb-8">
                        Your action was completed successfully.
                    </ThemedText>
                    <Button
                        title="Done"
                        onPress={() => confirmSheetRef.current?.hide()}
                        rounded="full"
                        className="!bg-highlight w-full"
                        textClassName="!text-white"
                    />
                </View>
            </ActionSheetThemed>

            {/* Menu Sheet */}
            <ActionSheetThemed ref={menuSheetRef} gestureEnabled>
                <View className="p-4">
                    <ThemedText className="text-lg font-bold mb-4 px-2">Actions</ThemedText>
                    <ActionSheetItem title="Edit" onPress={() => menuSheetRef.current?.hide()} icon="Edit" />
                    <ActionSheetItem title="Duplicate" onPress={() => menuSheetRef.current?.hide()} icon="Copy" />
                    <ActionSheetItem title="Share" onPress={() => menuSheetRef.current?.hide()} icon="Share" />
                    <View className="h-px bg-border my-2" />
                    <ActionSheetItem title="Delete" onPress={() => menuSheetRef.current?.hide()} icon="Trash" />
                </View>
            </ActionSheetThemed>
        </>
    );
}

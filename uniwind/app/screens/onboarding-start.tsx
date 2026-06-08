import { Link } from "expo-router";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingStartScreen() {
    const insets = useSafeAreaInsets();
    return (
        <>
            <ImageBackground style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} source={require('@/assets/img/onboarding-start.jpg')} className="flex-1">
                <View className="flex-1 items-start justify-end p-10">
                    <Text className="text-5xl text-white font-bold">Hello there!</Text>
                    <Text className="text-white text-base my-2">Let's get you started. This is a sample onboarding that you can remove or replace.</Text>
                    <Link href="/screens/onboarding" asChild>
                        <Pressable className="bg-white w-full mt-6 items-center justify-center rounded-full p-4">
                            <Text className="text-black text-base font-semibold">Get Started</Text>
                        </Pressable>
                    </Link>
                </View>
            </ImageBackground>
        </>
    );
}
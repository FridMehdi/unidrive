import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Input from "@/components/forms/Input";

export default function InputScreen() {
    return (
        <View className='flex-1 bg-background'>
            <Header showBackButton title="Input" />
            <ThemedScroller
                className="flex-1 bg-background px-global"
                automaticallyAdjustKeyboardInsets={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 150 }}
            >
                    <Input
                        variant="classic"
                        label="Classic Variant"
                        placeholder="Enter your email"
                        containerClassName="mb-8 mt-8"
                    />

                    <Input
                        variant="label-inside"
                        label="Label Inside Variant"
                        placeholder="Enter your full name"
                        containerClassName="mb-8"
                    />

                    <Input
                        variant="underlined"
                        label="Underlined Variant"
                        containerClassName="mb-8"
                    />


                    <Input
                        variant="classic"
                        label="Password Input"
                        isPassword
                        placeholder="Enter password"
                        containerClassName="mb-8"
                    />

                    <Input
                        variant="classic"
                        label="With Right Icon"
                        rightIcon="Search"
                        placeholder="Search..."
                        containerClassName="mb-8"
                    />

                    <Input
                        variant="classic"
                        label="With Error"
                        value="invalid-email"
                        error="Please enter a valid email address"
                        containerClassName="mb-8"
                    />

                    <Input
                        variant="classic"
                        label="Multiline"
                        isMultiline
                        placeholder="Enter a longer description..."
                        containerClassName="mb-8"
                    />
            </ThemedScroller>
        </View>
    );
}

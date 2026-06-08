import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Pressable, Animated, Platform, ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import useThemeColors from '@/contexts/ThemeColors';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { InputVariant } from './Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SelectOption {
    label?: string;
    value: string | number;
}

interface SelectProps {
    label?: string;
    placeholder?: string;
    options: SelectOption[];
    value?: string | number;
    onChange: (value: string | number) => void;
    error?: string;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;
    style?: ViewStyle;
    variant?: InputVariant;
    inputBgColor?: string;
    borderColor?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    placeholder = 'Select option',
    options,
    value,
    onChange,
    error,
    disabled = false,
    className = '',
    containerClassName = '',
    style,
    variant = 'inline',
    inputBgColor = 'bg-secondary',
    borderColor = 'border-border'
}) => {
    const { theme } = useTheme();
    const colors = useThemeColors();
    const actionSheetRef = useRef<ActionSheetRef>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SelectOption | undefined>(
        options.find(option => option.value === value)
    );

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.bg);
            NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');

            return () => {
                NavigationBar.setBackgroundColorAsync(colors.bg);
                NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');
            };
        }
    }, [theme, colors.bg]);

    const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        if (variant !== 'classic') {
            Animated.timing(animatedLabelValue, {
                toValue: (isFocused || selectedOption) ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [isFocused, selectedOption, animatedLabelValue, variant]);

    const labelStyle = {
        top: animatedLabelValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, -8],
        }),
        fontSize: animatedLabelValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedLabelValue.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.placeholder, colors.text],
        }),
        left: 12,
        paddingHorizontal: 8,
        position: 'absolute' as 'absolute',
        zIndex: 50,
        backgroundColor: colors.bg,
    };

    const handleSelect = (option: SelectOption) => {
        setSelectedOption(option);
        onChange(option.value);
        actionSheetRef.current?.hide();
    };

    const handlePress = () => {
        if (disabled) return;
        setIsFocused(true);
        actionSheetRef.current?.show();
    };

    const handleClose = () => {
        setIsFocused(false);
    };
    const insets = useSafeAreaInsets();
    // Render the action sheet
    const renderActionSheet = () => (
        <ActionSheet
            ref={actionSheetRef}
            onClose={handleClose}
            isModal={true}
            enableGesturesInScrollView={true}
            statusBarTranslucent={true}
            drawUnderStatusBar={false}
            containerStyle={{
                backgroundColor: colors.bg,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: insets.bottom,
            }}
            animated={true}
            openAnimationConfig={{
                stiffness: 3000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01
            }}
            closeAnimationConfig={{
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01
            }}
        >
            <View className="p-4">
                {options.map((option) => (
                    <Pressable
                        key={option.value}
                        onPress={() => handleSelect(option)}
                        className={twMerge('py-3 px-4 rounded-lg mb-2', selectedOption?.value === option.value ? inputBgColor : '')}
                    >
                        <ThemedText>
                            {option.label}
                        </ThemedText>
                    </Pressable>
                ))}
            </View>
        </ActionSheet>
    );

    if (variant === 'inline') {
        return (
            <View className={`mb-global relative ${containerClassName}`} style={style}>
                {label && (
                    <ThemedText className="mb-2 font-medium absolute top-2 left-3 text-xs text-text opacity-60">{label}</ThemedText>
                )}
                <TouchableOpacity
                    onPress={handlePress}
                    disabled={disabled}
                    className={twMerge(
                        'rounded-lg px-global h-16 flex-row justify-between items-center',
                        inputBgColor,
                        error ? 'border-red-500' : isFocused ? borderColor : 'border-border/60',
                        disabled ? 'opacity-50' : '',
                        className
                    )}
                >
                    <ThemedText className={selectedOption ? 'text-text text-base' : 'text-text text-base'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </ThemedText>
                    <Icon name="ChevronDown" size={20} color={colors.text} className='' />
                </TouchableOpacity>
                {error && (
                    <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
                )}
                {renderActionSheet()}
            </View>
        );
    }

    if (variant === 'classic') {
        return (
            <View className={`mb-global relative ${containerClassName}`} style={{ position: 'relative', ...style }}>
                {label && (
                    <ThemedText className="mb-2 font-medium">{label}</ThemedText>
                )}
                <View className="relative">
                    <TouchableOpacity
                        onPress={handlePress}
                        disabled={disabled}
                        className={twMerge(
                            'border rounded-xl px-3 h-14 text-text flex-row justify-between items-center',
                            inputBgColor,
                            error ? 'border-red-500' : borderColor,
                            disabled ? 'opacity-50' : '',
                            className
                        )}
                    >
                        <ThemedText className={selectedOption ? 'text-text' : 'text-text opacity-60'}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </ThemedText>
                        <Icon name="ChevronDown" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
                {error && (
                    <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
                )}
                {renderActionSheet()}
            </View>
        );
    }

    if (variant === 'underlined') {
        return (
            <View className={`mb-global relative ${containerClassName}`} style={{ position: 'relative', ...style }}>
                <View className="relative">
                    <Pressable className={`px-0 ${inputBgColor} z-40`} onPress={handlePress}>
                        <Animated.Text
                            style={[{
                                top: animatedLabelValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [16, -8],
                                }),
                                fontSize: animatedLabelValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [16, 12],
                                }),
                                color: animatedLabelValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [colors.placeholder, colors.text],
                                }),
                                left: 0,
                                paddingHorizontal: 0,
                                position: 'absolute',
                                zIndex: 50,
                                backgroundColor: colors.bg,
                            }]}
                            className="text-text"
                        >
                            {label}
                        </Animated.Text>
                    </Pressable>

                    <TouchableOpacity
                        onPress={handlePress}
                        disabled={disabled}
                        className={twMerge(
                            'border-b-2 py-3 px-0 h-14 pr-0 text-text bg-transparent border-t-0 border-l-0 border-r-0 flex-row justify-between items-center',
                            error ? 'border-red-500' : isFocused ? borderColor : 'border-border',
                            disabled ? 'opacity-50' : '',
                            className
                        )}
                    >
                        <ThemedText className={selectedOption ? 'text-text' : 'transparent'}>
                            {selectedOption ? selectedOption.label : ''}
                        </ThemedText>
                        <Icon name="ChevronDown" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {error && (
                    <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
                )}
                {renderActionSheet()}
            </View>
        );
    }

    return (
        <View className={`mb-8 relative ${containerClassName}`} style={style}>
            <Pressable
                className={`z-40 px-1 ${inputBgColor}`}
                style={{ position: 'absolute', left: -6, top: 0 }}
                onPress={handlePress}
            >
                <Animated.Text
                    style={[labelStyle]}
                    className="bg-background text-text"
                >
                    {label}
                </Animated.Text>
            </Pressable>

            <TouchableOpacity
                onPress={handlePress}
                disabled={disabled}
                className={twMerge(
                    'border rounded-lg py-3 px-3 h-14 text-text bg-transparent flex-row justify-between items-center',
                    error ? 'border-red-500' : isFocused ? borderColor : 'border-border',
                    disabled ? 'opacity-50' : '',
                    className
                )}
            >
                <ThemedText className={selectedOption ? 'text-text' : 'transparent'}>
                    {selectedOption ? selectedOption.label : ''}
                </ThemedText>
                <Icon name="ChevronDown" size={20} color={colors.text} />
            </TouchableOpacity>

            {error && (
                <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
            )}
            {renderActionSheet()}
        </View>
    );
};

export default Select;
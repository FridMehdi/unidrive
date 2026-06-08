import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput as RNTextInput, Animated, Pressable, TextInputProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import Icon, { IconName } from '../Icon';
import ThemedText from '../ThemedText';
import useThemeColors from '@/contexts/ThemeColors';

export type InputVariant = 'classic' | 'underlined' | 'label-inside';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  error?: string;
  isPassword?: boolean;
  className?: string;
  containerClassName?: string;
  isMultiline?: boolean;
  variant?: InputVariant;
  inRow?: boolean;
  inputBgColor?: string;
  borderColor?: string;
}

const Input: React.FC<CustomTextInputProps> = ({
  label,
  rightIcon,
  onRightIconPress,
  error,
  isPassword = false,
  className = '',
  containerClassName = '',
  value,
  onChangeText,
  isMultiline = false,
  variant = 'classic',
  inRow = false,
  inputBgColor = 'bg-secondary',
  borderColor = 'border-border',
  ...props
}) => {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Handle label animation for underlined variant
  useEffect(() => {
    if (variant === 'underlined') {
      const hasValue = localValue !== '';
      Animated.timing(animatedLabelValue, {
        toValue: (isFocused || hasValue) ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, localValue, animatedLabelValue, variant]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    onChangeText?.(text);
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine the right icon based on props and password state
  const renderRightIcon = () => {
    if (isPassword) {
      return (
        <Pressable
          onPress={togglePasswordVisibility}
          className={`absolute right-3 ${variant === 'classic' ? 'top-[15px]' : 'top-[18px]'} z-10`}
        >
          <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={20} color={colors.text} />
        </Pressable>
      );
    }

    if (rightIcon) {
      return (
        <Pressable
          onPress={onRightIconPress}
          className={`absolute right-3 ${variant === 'classic' ? 'top-[15px]' : 'top-[18px]'} z-10`}
        >
          <Icon name={rightIcon} size={20} color={colors.text} />
        </Pressable>
      );
    }

    return null;
  };


  // Classic non-animated input
  if (variant === 'classic') {
    return (
      <View className={`mb-4 relative ${containerClassName}`} style={{ position: 'relative' }}>
        {label && (
          <ThemedText className="mb-2 font-medium">{label}</ThemedText>
        )}
        <View className="relative">
          <RNTextInput
            ref={inputRef}
            className={twMerge(
              'border rounded-xl px-3 text-text',
              inputBgColor,
              isMultiline ? 'h-36 pt-4' : 'h-14',
              (isPassword || rightIcon) ? 'pr-10' : '',
              error ? 'border-red-500' : borderColor,
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ color: colors.text, borderColor: colors.border }}
            value={localValue}
            onChangeText={handleChangeText}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor={colors.placeholder}
            numberOfLines={isMultiline ? 4 : 1}
            textAlignVertical={isMultiline ? 'top' : 'center'}
            multiline={isMultiline}
            {...props}
          />
          {renderRightIcon()}
        </View>
        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
      </View>
    );
  }

  // Underlined input with only bottom border
  if (variant === 'underlined') {
    return (
      <View className={`mb-global relative ${containerClassName}`} style={{ position: 'relative' }}>
        <View className="relative">
          <Pressable className='px-0 bg-secondary z-40' onPress={() => inputRef.current?.focus()}>
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
                left: 0, // No left padding for underlined variant
                paddingHorizontal: 0, // No horizontal padding
                position: 'absolute',
                zIndex: 50,
                //backgroundColor: colors.bg,
              }]}
              className="text-text font-semibold"
            >
              {label}
            </Animated.Text>
          </Pressable>

          <RNTextInput
            ref={inputRef}
            className={twMerge(
              'border-b-2 py-3 px-0 text-text bg-transparent border-t-0 border-l-0 border-r-0',
              isMultiline ? 'h-36 pt-4' : 'h-14',
              (isPassword || rightIcon) ? 'pr-10' : '',
              error ? 'border-red-500' : borderColor,
              className
            )}
            onFocus={() => setIsFocused(true)}
            style={{ borderColor: colors.border, color: colors.text }}
            onBlur={() => setIsFocused(false)}
            value={localValue}
            onChangeText={handleChangeText}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor="transparent"
            numberOfLines={isMultiline ? 4 : 1}
            textAlignVertical={isMultiline ? 'top' : 'center'}
            multiline={isMultiline}
            {...props}
          />

          {renderRightIcon()}
        </View>

        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
      </View>
    );
  }

  // Label inside variant - label positioned inside the input border
  if (variant === 'label-inside') {
    return (
      <View className={`mb-4 relative ${containerClassName}`}>
        <View
          className={twMerge(
            'border rounded-xl relative',
            inputBgColor,
            error ? 'border-red-500' : borderColor
          )}
        >
          {label && (
            <ThemedText
              className="text-xs font-medium px-3 pt-2 opacity-60"
            >
              {label}
            </ThemedText>
          )}
          <RNTextInput
            ref={inputRef}
            className={`px-3 ${isMultiline ? 'h-28 pb-3' : 'h-10 pb-3'} ${(isPassword || rightIcon) ? 'pr-10' : ''}
              text-text bg-transparent
              ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ borderColor: colors.border, color: colors.text }}
            value={localValue}
            onChangeText={handleChangeText}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor={colors.placeholder}
            numberOfLines={isMultiline ? 4 : 1}
            textAlignVertical={isMultiline ? 'top' : 'center'}
            multiline={isMultiline}
            {...props}
          />
          {renderRightIcon()}
        </View>
        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
      </View>
    );
  }

  // Default to classic if no variant matches
  return (
    <View className={`mb-4 relative ${containerClassName}`} style={{ position: 'relative' }}>
      {label && (
        <ThemedText className="mb-2 font-medium">{label}</ThemedText>
      )}
      <View className="relative">
        <RNTextInput
          ref={inputRef}
          className={twMerge(
            'border rounded-xl px-3 text-text',
            inputBgColor,
            isMultiline ? 'h-36 pt-4' : 'h-14',
            (isPassword || rightIcon) ? 'pr-10' : '',
            error ? 'border-red-500' : borderColor,
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ borderColor: colors.border, color: colors.text }}
          value={localValue}
          onChangeText={handleChangeText}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={colors.placeholder}
          numberOfLines={isMultiline ? 4 : 1}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          multiline={isMultiline}
          {...props}
        />
        {renderRightIcon()}
      </View>
      {error && (
        <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
      )}
    </View>
  );
};

export default Input;
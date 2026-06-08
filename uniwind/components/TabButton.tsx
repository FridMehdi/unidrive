import useThemeColors from '@/contexts/ThemeColors';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps, forwardRef, useEffect, useState, ReactNode } from 'react';
import { Text, Pressable, View, Animated } from 'react-native';
import Icon, { IconName } from '@/components/Icon';
import ThemedText from './ThemedText';
import Avatar from './Avatar';
import AnimatedView from './AnimatedView';

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: IconName;
  avatar?: string;
  customContent?: ReactNode;
  labelAnimated?: boolean;
  hasBadge?: boolean;
  isLabelVisible?: boolean;
};

export const TabButton = forwardRef<View, TabButtonProps>(
  ({ icon, avatar, children, isFocused, onPress, customContent, labelAnimated = true, hasBadge = false, isLabelVisible = true, ...props }, ref) => {
    const colors = useThemeColors();

    // Use Animated Values to control opacity and translateY
    const [labelOpacity] = useState(new Animated.Value(isFocused ? 1 : 0));
    const [labelMarginBottom] = useState(new Animated.Value(isFocused ? 0 : 10));
    const [lineScale] = useState(new Animated.Value(isFocused ? 0 : 10));

    // Animate opacity and translation when the tab becomes focused or unfocused
    useEffect(() => {
      Animated.parallel([
        Animated.timing(labelOpacity, {
          toValue: isFocused ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(labelMarginBottom, {
          toValue: isFocused ? 0 : 10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(lineScale, {
          toValue: isFocused ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isFocused]);

    // Render icon or custom content
    const renderContent = () => {
      if (customContent) {
        return customContent;
      }
      
      if (icon) {
        return (
          <View className="relative">
            <View className={`w-full relative ${isFocused ? 'opacity-100' : 'opacity-40'}`}>
              <Icon name={icon} size={24} strokeWidth={isFocused ? 2.5 : 2} color={colors.text} />
            </View>
            {hasBadge && (
              <View className="absolute w-3 h-3 rounded-full bg-red-500 -top-1 -right-1.5" />
            )}
          </View>
        );
      }
      if (avatar) {
        return (
          <View className={`rounded-full border-2 ${isFocused ? 'border-highlight' : 'border-transparent'}`}>
            <Avatar src={avatar} size="xxs"  />
          </View>
        );
      }
      return null;
    };

    return (
      <Pressable
        className={`w-1/5 overflow-hidden ${isFocused ? '' : ''}`}
        ref={ref}
        {...props}
        onPress={onPress}>
        <View className="flex-col items-center justify-center pt-4 pb-0 w-full relative">
          
          {renderContent()}

          {labelAnimated ? (
            <Animated.View className="relative"
              style={{
                opacity: isLabelVisible ? labelOpacity : 0,
                transform: [{ translateY: labelMarginBottom }],
              }}
            >
              <Text className={`text-[9px] mt-px ${isFocused ? 'text-text' : 'text-text'}`}>
                {children}
              </Text>
            </Animated.View>
          ) : (
            <ThemedText className={`text-[9px] mt-px ${isLabelVisible ? '' : 'opacity-0'}`}>
              {children}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  }
);

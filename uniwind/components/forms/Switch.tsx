import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, Animated, Switch as RNSwitch, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';
import ThemedText from '../ThemedText';
import Icon, { IconName } from '../Icon';
import useThemeColors from '@/contexts/ThemeColors';

interface SwitchProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  containerPadding?: string;
}

const Switch: React.FC<SwitchProps> = ({
  value,
  onChange,
  label,
  description,
  icon,
  disabled = false,
  className = '',
  style,
  containerPadding = 'p-1',
}) => {
  const colors = useThemeColors();
  const [isOn, setIsOn] = useState(value ?? false);
  const slideAnim = useRef(new Animated.Value(value ?? false ? 1 : 0)).current;

  // Handle controlled vs uncontrolled state
  const isControlled = value !== undefined;
  const switchValue = isControlled ? value : isOn;

  // Sync animation with controlled value changes
  useEffect(() => {
    if (isControlled) {
      Animated.spring(slideAnim, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12
      }).start();
    }
  }, [value, isControlled, slideAnim]);

  const toggleSwitch = () => {
    if (disabled) return;
    
    const newValue = !switchValue;
    
    // Update internal state if uncontrolled
    if (!isControlled) {
      setIsOn(newValue);
    }
    
    // Call callback if provided
    onChange?.(newValue);
    
    // Animate the switch
    Animated.spring(slideAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12
    }).start();
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={toggleSwitch} 
      disabled={disabled}
      className={twMerge('flex-row items-center', containerPadding, disabled ? 'opacity-50' : '', className)}
      style={style}
    >
      {icon && (
        <View className="size-12 rounded-2xl bg-secondary mr-4 items-center justify-center">
          <Icon name={icon} size={20} color={colors.text} />
        </View>
      )}
      
      <View className="flex-1">
        {label && (
          <ThemedText className="font-semibold text-base">{label}</ThemedText>
        )}
        {description && (
          <ThemedText className="text-xs opacity-50 pr-4">
            {description}
          </ThemedText>
        )}
      </View>
      

        <View className="w-14 h-8 rounded-full">
          <View
            className={twMerge('w-full h-full border border-border rounded-full absolute', switchValue ? 'bg-highlight' : 'bg-secondary')}
          />
          <Animated.View
            style={{
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [-0.2, 1.2],
                  outputRange: [1, 28]
                })
              }]
            }}
            className="w-6 h-6 bg-white rounded-full shadow-sm my-1 border border-border"
          />
        </View>
    </TouchableOpacity>
  );
};

export default Switch; 
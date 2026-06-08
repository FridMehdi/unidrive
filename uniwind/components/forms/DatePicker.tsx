import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Platform, Animated, Pressable, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import useThemeColors from '@/contexts/ThemeColors';
import { formatToYYYYMMDD } from '@/utils/date';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { InputVariant } from './Input';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
  disabled?: boolean;
  containerClassName?: string;
  variant?: InputVariant;
  inputBgColor?: string;
  borderColor?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  maxDate,
  minDate,
  error,
  disabled = false,
  containerClassName = '',
  variant = 'inline',
  inputBgColor = 'bg-secondary',
  borderColor = 'border-border',
}) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const [isFocused, setIsFocused] = useState(false);
  const colors = useThemeColors();
  const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (variant !== 'classic') {
      Animated.timing(animatedLabelValue, {
        toValue: (isFocused || value) ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, value, animatedLabelValue, variant]);

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

  const showDatePicker = () => {
    if (disabled) return;
    setIsFocused(true);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setIsFocused(false);
    setDatePickerVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      hideDatePicker();
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    hideDatePicker();
  };

  // Helper function to render date picker modal/component
  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          isVisible={isDatePickerVisible}
          onBackdropPress={hideDatePicker}
          style={{ margin: 0, justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: colors.bg }} className="rounded-t-xl items-center justify-center w-full">
            <View style={{ borderBottomColor: colors.border }} className="flex-row justify-between items-center p-4 border-b w-full">
              <Button
                title="Cancel"
                variant="ghost"
                onPress={hideDatePicker}
                textClassName="text-base font-normal"
              />
              <ThemedText className="text-lg font-medium">
                {label || 'Select Date'}
              </ThemedText>
              <Button
                title="Done"
                variant="ghost"
                onPress={handleConfirm}
                textClassName="text-base font-semibold"
              />
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={maxDate}
              minimumDate={minDate}
              themeVariant={colors.isDark ? 'dark' : 'light'}
              style={{ backgroundColor: colors.bg }}
            />
          </View>
        </Modal>
      );
    } else {
      return isDatePickerVisible && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      );
    }
  };

  // Inline variant with label as placeholder (matching TimePicker.tsx exactly)
  if (variant === 'inline') {
    return (
      <View className={`mb-global relative ${containerClassName}`}>
        {label && (
          <Text className="mb-2 z-20 font-medium absolute top-2 left-3 text-xs text-text">{label}</Text>
        )}
        <TouchableOpacity
          onPress={showDatePicker}
          disabled={disabled}
          className={twMerge(
            'border rounded-2xl px-3 h-16 pt-7 pr-10',
            inputBgColor,
            error ? 'border-red-500' : isFocused ? borderColor : 'border-border',
            disabled ? 'opacity-50' : ''
          )}
        >
          <Text className={value ? 'text-text' : 'text-text'}>
            {value ? formatToYYYYMMDD(value) : placeholder}
          </Text>
        </TouchableOpacity>
        <Pressable className="absolute right-3 top-[18px] z-10">
          <Icon name="Calendar" size={20} color={colors.text} />
        </Pressable>
        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Classic variant (matching TimePicker.tsx exactly)
  if (variant === 'classic') {
    return (
      <View className={`mb-global relative ${containerClassName}`} style={{ position: 'relative' }}>
        {label && (
          <ThemedText className="mb-2 font-medium">{label}</ThemedText>
        )}
        <View className="relative">
          <TouchableOpacity
            onPress={showDatePicker}
            disabled={disabled}
            className={twMerge(
              'border rounded-2xl px-3 h-14 pr-10 text-text',
              inputBgColor,
              error ? 'border-red-500' : borderColor,
              disabled ? 'opacity-50' : ''
            )}
          >
            <View className="flex-1 justify-center">
              <ThemedText className={value ? 'text-text' : 'text-text opacity-60'}>
              {value ? formatToYYYYMMDD(value) : placeholder}
            </ThemedText>
            </View>
          </TouchableOpacity>
          <Pressable className="absolute right-3 top-[15px] z-10">
            <Icon name="Calendar" size={20} color={colors.text} />
          </Pressable>
        </View>
        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Underlined variant (matching TimePicker.tsx exactly)
  if (variant === 'underlined') {
    return (
      <View className={`mb-global relative ${containerClassName}`} style={{ position: 'relative' }}>
        <View className="relative">
          <Pressable className='px-0 bg-secondary z-40' onPress={showDatePicker}>
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
            onPress={showDatePicker}
            disabled={disabled}
            className={twMerge(
              'border-b-2 py-3 px-0 h-14 pr-10 text-text bg-transparent border-t-0 border-l-0 border-r-0',
              error ? 'border-red-500' : borderColor,
              disabled ? 'opacity-50' : ''
            )}
          >
            <View className="flex-1 justify-center">
              <ThemedText className={value ? 'text-text' : 'transparent'}>
              {value ? formatToYYYYMMDD(value) : ''}
            </ThemedText>
            </View>
          </TouchableOpacity>

          <Pressable className="absolute right-0 top-[18px] z-10">
            <Icon name="Calendar" size={20} color={colors.text} />
          </Pressable>
        </View>

        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Default animated variant (matching TimePicker.tsx exactly)
  return (
    <View className={`mb-8 relative ${containerClassName}`}>
      <Pressable
        className='z-40 px-1 bg-background'
        style={{ position: 'absolute', left: -6, top: 0 }}
        onPress={showDatePicker}
      >
          <Animated.Text 
            style={[labelStyle]} 
          className="bg-background text-text"
          >
            {label}
          </Animated.Text>
        </Pressable>

        <TouchableOpacity
          onPress={showDatePicker}
        disabled={disabled}
        className={twMerge(
          'border rounded-2xl py-3 px-3 h-14 pr-10 text-text bg-transparent',
          error ? 'border-red-500' : borderColor,
          disabled ? 'opacity-50' : ''
        )}
        >
        <View className="flex-1 justify-center">
          <ThemedText className={value ? 'text-text' : 'transparent'}>
            {value ? formatToYYYYMMDD(value) : ''}
          </ThemedText>
        </View>
        </TouchableOpacity>

        <Pressable className="absolute right-3 top-[18px] z-10">
          <Icon name="Calendar" size={20} color={colors.text} />
        </Pressable>

      {error && (
        <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
      )}
      {renderDatePicker()}
    </View>
  );
}; 
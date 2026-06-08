import React, { useRef, useState } from 'react';
import { View, PanResponder, Animated, Dimensions } from 'react-native';
import ThemedText from './ThemedText';
import Icon from './Icon';
import useThemeColors from '@/contexts/ThemeColors';

interface SwipeButtonProps {
  onSuccess: () => void;
  text?: string;
  icon?: string;
  backgroundColor?: string;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width - 32; // 16px padding de chaque côté
const THUMB_SIZE = 56;
const SWIPE_THRESHOLD = BUTTON_WIDTH - THUMB_SIZE - 8;

export default function SwipeButton({
  onSuccess,
  text = 'Glisser pour confirmer',
  icon = 'ChevronRight',
  backgroundColor = '#22c55e',
  disabled = false,
}: SwipeButtonProps) {
  const colors = useThemeColors();
  const [swiped, setSwiped] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !swiped,
      onMoveShouldSetPanResponder: () => !disabled && !swiped,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx >= 0 && gesture.dx <= SWIPE_THRESHOLD) {
          translateX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx >= SWIPE_THRESHOLD * 0.8) {
          // Succès du swipe
          Animated.timing(translateX, {
            toValue: SWIPE_THRESHOLD,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSwiped(true);
            onSuccess();
          });
        } else {
          // Retour à la position initiale
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View
      style={{
        width: BUTTON_WIDTH,
        height: 64,
        borderRadius: 16,
        backgroundColor: disabled ? colors.border : backgroundColor,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Texte */}
      <ThemedText
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {text}
      </ThemedText>

      {/* Thumb glissant */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          left: 4,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: 12,
          backgroundColor: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Icon name={icon as any} size={28} color={disabled ? colors.subtext : backgroundColor} />
      </Animated.View>
    </View>
  );
}

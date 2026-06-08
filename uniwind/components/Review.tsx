import React from 'react';
import { View, ViewStyle } from 'react-native';
import ThemedText from './ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import Icon from './Icon';
import Avatar from './Avatar';

interface ReviewProps {
  rating: number;
  description: string;
  date: string;
  username?: string;
  avatar?: string;
  className?: string;
  style?: ViewStyle;
}

const Review: React.FC<ReviewProps> = ({
  rating,
  description,
  date,
  username,
  avatar,
  className = '',
  style
}) => {
  const colors = useThemeColors();
  
  const renderStars = () => {
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Icon 
          key={i}
          name="Star" 
          size={14} 
          fill={i < rating ? colors.text : colors.border}
          color={i < rating ? colors.text : colors.text}
          strokeWidth={0}
          className="mr-0.5"
        />
      );
    }
    
    return (
      <View className="flex-row items-center justify-start">
        {stars}
        <ThemedText className="text-sm ml-1">{rating}</ThemedText>
      </View>
    );
  };

  return (
    <View className={` ${className}`} style={style}>
      <View className="flex-row">
        {(avatar || username) && (
          <Avatar 
            src={avatar}
            name={username}
            size="sm"
            className="mr-3"
            border
          />
        )}
        <View className="flex-1">
          {username && (
            <ThemedText className="font-bold mb-1">{username}</ThemedText>
          )}
          <View className="flex-row justify-between items-center mb-2">
            {renderStars()}
            <ThemedText className="text-sm opacity-50">{date}</ThemedText>
          </View>
          <ThemedText className="text-base">{description}</ThemedText>
        </View>
      </View>
    </View>
  );
};

export default Review; 
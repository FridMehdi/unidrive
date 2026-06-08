import React from 'react';
import { View, Pressable, ViewStyle, Image } from 'react-native';
import { Link } from 'expo-router';
import Icon, { IconName } from './Icon';
import ThemedText from './ThemedText';

interface ListLinkProps {
  icon?: IconName;
  image?: string;
  imageSize?: 'sm' | 'md' | 'lg' | 'xl';
  title: string;
  description?: string;
  href?: string;
  onPress?: () => void;
  showChevron?: boolean;
  className?: string;
  iconSize?: number;
  rightIcon?: IconName;
  disabled?: boolean;
  style?: ViewStyle;
  hasBorder?: boolean;
  paddingX?: 'none' | 'sm' | 'md' | 'lg';
  paddingY?: 'none' | 'sm' | 'md' | 'lg';
}

const ListLink: React.FC<ListLinkProps> = ({
  icon,
  image,
  imageSize = 'md',
  title,
  description,
  href,
  onPress,
  showChevron = false,
  className = '',
  iconSize = 20,
  rightIcon = 'ChevronRight',
  disabled = false,
  style,
  hasBorder = false,
  paddingX = 'none',
  paddingY = 'sm',
}) => {
  const getPaddingX = () => {
    switch (paddingX) {
      case 'none': return '';
      case 'sm': return 'px-2';
      case 'md': return 'px-4';
      case 'lg': return 'px-6';
      default: return '';
    }
  };

  const getPaddingY = () => {
    switch (paddingY) {
      case 'none': return '';
      case 'sm': return 'py-2';
      case 'md': return 'py-4';
      case 'lg': return 'py-6';
      default: return 'py-4';
    }
  };

  const getImageSize = () => {
    switch (imageSize) {
      case 'sm': return { width: 40, height: 40, borderRadius: 8 };
      case 'md': return { width: 48, height: 48, borderRadius: 10 };
      case 'lg': return { width: 56, height: 56, borderRadius: 12 };
      case 'xl': return { width: 64, height: 64, borderRadius: 14 };
      default: return { width: 48, height: 48, borderRadius: 10 };
    }
  };

  const Content = () => (
    <View
      className={`flex-row items-center ${getPaddingX()} ${getPaddingY()} ${className} ${disabled ? 'opacity-50' : ''}`}
      style={style}
    >
      {image && (
        <Image
          source={{ uri: image }}
          style={getImageSize()}
          className="mr-4"
        />
      )}
      {icon && !image && (
        <View className="mr-4 size-12 rounded-2xl bg-secondary items-center justify-center">
          <Icon name={icon} size={iconSize} />
        </View>
      )}
      <View className="flex-1">
        <ThemedText className="text-base font-semibold">{title}</ThemedText>
        {description && (
          <ThemedText className="text-xs opacity-60">{description}</ThemedText>
        )}
      </View>
      {showChevron && (

          <Icon name={rightIcon} size={16} className='p-1' />

      )}
    </View>
  );

  if (href && !disabled) {
    return (
      <Link href={href} asChild>
        <Pressable className={`w-full ${hasBorder ? 'border-b border-border' : ''}`}>
          <Content />
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`${hasBorder ? 'border-b border-border' : ''}`}
    >
      <Content />
    </Pressable>
  );
};

export default ListLink;

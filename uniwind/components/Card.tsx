import { router } from 'expo-router';
import { View, Text, Image, ImageBackground, TouchableOpacity, ViewStyle, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { twMerge } from 'tailwind-merge';
import ThemedText from './ThemedText';
import { Button } from './Button';
import { shadowPresets } from '@/utils/useShadow';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import useThemeColors from '@/contexts/ThemeColors';
import Favorite from './Favorite';
interface CardProps {
    title: string;
    description?: string;
    hasShadow?: boolean;
    image: string | ImageSourcePropType;
    href?: string;
    onPress?: () => void;
    variant?: 'classic' | 'overlay' | 'compact' | 'minimal';
    className?: string;
    button?: string;
    onButtonPress?: () => void;
    price?: string;
    rating?: number;
    badge?: string;
    badgeColor?: string;
    icon?: string;
    iconColor?: string;
    imageHeight?: number;
    showOverlay?: boolean;
    hasFavorite?: boolean;  
    overlayGradient?: readonly [string, string];
    width?: any;
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    children?: React.ReactNode;
    style?: ViewStyle;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    padding?: 'sm' | 'md' | 'lg' | 'xl' ;
}

const Card: React.FC<CardProps> = ({
    title,
    description,
    image,
    hasShadow = false,
    href,
    onPress,
    variant = 'classic',
    className = 'w-full',
    button,
    onButtonPress,
    price,
    rating,
    badge,
    hasFavorite = false,
    badgeColor = '#000000',
    imageHeight = 200,
    showOverlay = true,
    overlayGradient = ['transparent', 'rgba(0,0,0,0.5)'] as readonly [string, string],
    rounded = '2xl',
    width = '100%',
    children,
    style,
    titleSize = 'md',
    padding = 'md',
    ...props
}) => {
    const handlePress = () => {
        if (onPress) {
            onPress();
        }
    };

    const getRoundedClass = () => {
        switch (rounded) {
            case 'none': return 'rounded-none';
            case 'sm': return 'rounded-sm';
            case 'md': return 'rounded-md';
            case 'lg': return 'rounded-lg';
            case 'xl': return 'rounded-xl';
            case '2xl': return 'rounded-2xl';
            case 'full': return 'rounded-full';
            default: return 'rounded-lg';
        }
    };

    const getPaddingClass = () => {
        switch (padding) {
            case 'sm': return 'p-2';
            case 'md': return 'p-4';
            case 'lg': return 'p-6';
            case 'xl': return 'p-8';
            default: return 'p-4';
        }
    };

    const renderBadge = () => {
        if (!badge) return null;
        return (
            <View
                className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full ${getRoundedClass()}`}
                style={{ backgroundColor: badgeColor }}
            >
                <Text className="text-white text-xs font-medium">{badge}</Text>
            </View>
        );
    };
    const colors = useThemeColors();
    const renderRating = () => {
        if (!rating) return null;
        return (
            <View className="flex-row items-center">
                <MaterialIcons name="star" size={16} color={variant === 'overlay' ? 'white' : colors.text} />
                <ThemedText className={`text-xs ml-0 ${variant === 'overlay' ? '!text-white' : 'text-text'}`}>{rating}</ThemedText>
            </View>
        );
    };

    const renderPrice = () => {
        if (!price) return null;
        return (
            <ThemedText className={`text-sm ${variant === 'overlay' ? 'text-white' : 'text-text'}`}>{price}</ThemedText>
        );
    };

    const renderContent = () => {
        const cardContent = (
            <View
                className={twMerge('bg-secondary', getRoundedClass(), className)}
                style={[
                    hasShadow && {
                        ...shadowPresets.card
                    },
                    style
                ]}>
                <View className="relative">
                    {hasFavorite && (
                        <View className='absolute top-2 right-2 z-50'>
                            <Favorite
                                initialState={false}
                                productName={title}
                                size={24}
                                isWhite
                            />
                        </View>
                    )}
                    {variant === 'overlay' ? (
                        <ImageBackground
                            source={typeof image === 'string' ? { uri: image } : image}
                            className={`w-full overflow-hidden ${getRoundedClass()}`}
                            style={{ height: imageHeight || 200 }}
                        >
                            {showOverlay && (
                                <LinearGradient
                                    colors={overlayGradient}
                                    style={{width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}
                                >
                                    <View className={`${getPaddingClass()} absolute bottom-0 left-0 right-0`}>
                                        <Text className={`text-${titleSize} font-bold text-white`}>{title}</Text>
                                        {description && (
                                            <Text numberOfLines={1} className="text-sm text-white">{description}</Text>
                                        )}
                                        {(price || rating) && (
                                            <View className="flex-row items-center mt-1 justify-between mt-2">
                                                {renderPrice()}
                                                {renderRating()}
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                            )}
                        </ImageBackground>
                    ) : (
                        <Image
                            source={typeof image === 'string' ? { uri: image } : image}
                            className={`w-full ${getRoundedClass()}`}
                            style={{ height: imageHeight || 200, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                        />
                    )}
                    {renderBadge()}
                </View>

                {variant !== 'overlay' && (
                    <View className={`${getPaddingClass()} w-full`}>


                        <ThemedText className={`text-${titleSize} font-semibold`}>{title}</ThemedText>

                        {description && (
                            <ThemedText numberOfLines={1} className="text-xs">
                                {description}
                            </ThemedText>
                        )}
                        {(price || rating) && (
                            <View className="flex-row items-center mt-auto justify-between pt-3">
                                {renderPrice()}
                                {renderRating()}
                            </View>
                        )}
                        {children}
                        {button && (
                            <Button
                                className='mt-3'
                                title={button}
                                size='small'
                                onPress={onButtonPress}
                            />
                        )}
                    </View>
                )}
            </View>
        );

        if (href) {
            return (
                <TouchableOpacity className={twMerge(variant === 'overlay' ? '!h-auto' : '', className)} activeOpacity={0.8} onPress={() => router.push(href)} style={{ width: width, ...style }}>
                    {cardContent}
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity className={twMerge(variant === 'overlay' ? '!h-auto' : '', className)} activeOpacity={0.8} onPress={handlePress} style={{ width: width, ...style }}>
                {cardContent}
            </TouchableOpacity>
        );
    };

    return renderContent();
};

export default Card;
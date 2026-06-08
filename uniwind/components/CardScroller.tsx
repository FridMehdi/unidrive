import { ScrollView, View, ViewStyle } from "react-native";
import ThemedText from "./ThemedText";
import { Link } from "expo-router";

// Define prop types
interface CardScrollerProps {
  title?: string;
  img?: string;
  allUrl?: string;
  children: React.ReactNode;
  enableSnapping?: boolean;
  snapInterval?: number;
  className?: string;
  style?: ViewStyle;
  space?: number;
  titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const CardScroller = ({
  title,
  img,
  allUrl,
  children,
  enableSnapping = false,
  snapInterval = 0,
  className,
  style,
  space = 10,
  titleSize = 'sm',
  }: CardScrollerProps) => {
  return (
    <View className={`w-full flex flex-col  ${title ? 'pt-global' : 'pt-0'} ${className}`} style={style}>
      <View className={`w-full flex flex-row justify-between items-center ${title ? 'mb-2' : 'mb-0'}`}>
        {title && <ThemedText className={`text-${titleSize} font-bold`}>{title}</ThemedText>}
        {allUrl && (
          <View className='flex flex-col'>
            <Link href={allUrl} className="text-text uppercase">
              See all
            </Link>
            <View className='h-px w-full mt-[1px]' />
          </View>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment='center'
        decelerationRate={enableSnapping ? 0.85 : 'normal'}
        snapToInterval={enableSnapping ? snapInterval : undefined}
        className={`-mx-global px-global`}
        contentContainerStyle={{ columnGap: space }}
        style={style}
      >
        {children}
        <View className="w-4 h-px" />
      </ScrollView>
    </View>
  );
};

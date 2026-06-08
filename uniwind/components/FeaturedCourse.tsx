import { LinearGradient } from "expo-linear-gradient";
import { Dimensions } from "react-native";
import { ImageBackground, Pressable, View, Text } from "react-native";
import Icon from "./Icon";
import { router } from "expo-router";

const windowWidth = Dimensions.get('window').width;

export default function FeaturedCourse(props: any) {
    return (
      <Pressable onPress={() => router.push('/screens/course-detail')} style={{ width: windowWidth - 50 }} className=' h-[220px] rounded-3xl overflow-hidden relative'>
        <Text className="absolute top-4 right-4 text-white text-sm font-bold bg-highlight px-2 py-1 rounded-full z-20">Popular</Text>
        <ImageBackground
          source={props.image}
          style={{ width: '100%', height: '100%' }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={{ width: '100%', height: '100%', padding: 20, flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Text className='text-white text-xl font-bold mb-1 capitalize'>{props.title}</Text>
            <View className='flex-row items-center gap-3'>
              <View className='flex-row items-center'>
                <Icon name='Star' size={11} color='white' fill='white' />
                <Text className='text-white text-sm ml-1'>{props.rating}</Text>
              </View>
              <View className='w-1 h-1 bg-white rounded-full opacity-70' />
              <View className='flex-row items-center'>
                <Icon name='Clock' size={11} color='white' />
                <Text className='text-white text-sm ml-1'>{props.duration}</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    );
  };
  
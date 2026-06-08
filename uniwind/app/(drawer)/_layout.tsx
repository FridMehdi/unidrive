import React from 'react';
import { Drawer } from 'expo-router/drawer';
import useThemeColors from '@/contexts/ThemeColors';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { useFonts, Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { DrawerProvider } from '@/contexts/DrawerContext';
// Create a ref to the drawer instance that can be used across the app
export const drawerRef = React.createRef();

export default function DrawerLayout() {
    const colors = useThemeColors();
    const [fontsLoaded] = useFonts({
        Outfit_400Regular,
        Outfit_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <DrawerProvider>
            <Drawer
                ref={drawerRef}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'slide',
                    drawerPosition: 'right',
                    drawerStyle: {
                        backgroundColor: colors.secondary,
                        width: '85%',
                        flex: 1,
                    },
                    overlayColor: 'rgba(0,0,0, 0.4)',
                    swipeEdgeWidth: 100,
                    
                }}
                drawerContent={(props) => <CustomDrawerContent />}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        title: 'Noty',
                        drawerLabel: 'Home',
                    }}
                />
            </Drawer>
        </DrawerProvider>
    );
}
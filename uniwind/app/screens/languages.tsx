import { TouchableOpacity, View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import Icon from "@/components/Icon";
import AnimatedView from "@/components/AnimatedView";
import ThemedText from "@/components/ThemedText";
import { SvgXml } from 'react-native-svg';
import { US, ES } from 'country-flag-icons/string/3x2';

const languages = [
    { title: 'English', nativeName: 'English', code: 'EN', flag: US },
    { title: 'Spanish', nativeName: 'Español', code: 'ES', flag: ES },
];

export default function LanguagesScreen() {
    return (
        <>
            <Header showBackButton title="Languages" />
            <ThemedScroller className="p-global">
                <Section title="Select your language" titleSize="4xl" className="mt-4 mb-10" />
                {languages.map((lang, index) => (
                    <LanguageItem
                        key={index}
                        title={lang.title}
                        nativeName={lang.nativeName}
                        code={lang.code}
                        flag={lang.flag}
                        selected={lang.code === 'EN'}
                    />
                ))}
            </ThemedScroller>
        </>
    );
}

interface LanguageItemProps {
    title: string;
    nativeName: string;
    code: string;
    flag: string;
    selected: boolean;
}

const LanguageItem = ({ title, nativeName, flag, selected }: LanguageItemProps) => (
    <TouchableOpacity
        activeOpacity={0.8}
        className="flex-row items-center py-6 border-b border-border"
    >
        <View className="w-7 h-7 mr-6 rounded overflow-hidden">
            <SvgXml xml={flag} width={28} height={28} />
        </View>
        <View className="flex-1">
            <ThemedText className='text-lg font-bold'>{nativeName}</ThemedText>
            <ThemedText className='text-sm opacity-60'>{title}</ThemedText>
        </View>
        {selected && (
            <AnimatedView animation="bounceIn" duration={500}>
                <Icon name="Check" size={25} />
            </AnimatedView>
        )}
    </TouchableOpacity>
);

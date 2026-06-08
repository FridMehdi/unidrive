import Header from "@/components/Header";
import ListLink from "@/components/ListLink";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { View } from "react-native";
import { shadowPresets } from "@/utils/useShadow";

export default function ComponentsScreen() {
    return (
        <>
            <Header showBackButton title="Components" />
            <ThemedScroller className="flex-1 bg-background px-global">
                <Section title="Core UI" titleSize="2xl" className="mt-4 mb-2" />
                <View style={shadowPresets.large} className=" mb-4">
                    <ListLink icon="RectangleHorizontal" title="Button" description="Variants, sizes, icons, states" href="/screens/components/button" />
                    <ListLink icon="Square" title="Card" description="Classic, overlay, with badges" href="/screens/components/card" />
                    <ListLink icon="Circle" title="Chip" description="Sizes, icons, selectable" href="/screens/components/chip" />
                    <ListLink icon="User" title="Avatar" description="Sizes, images, initials" href="/screens/components/avatar" />
                </View>

                <Section title="Forms" titleSize="2xl" className="mt-6 mb-2" />
                <View style={shadowPresets.large} className=" mb-4">
                    <ListLink icon="TextCursorInput" title="Input" description="Classic, underlined, label-inside" href="/screens/components/input" />
                    <ListLink icon="ChevronDown" title="Select" description="Dropdown with action sheet" href="/screens/components/select" />
                    <ListLink icon="Calendar" title="DatePicker" description="Date selection with variants" href="/screens/components/datepicker" />
                    <ListLink icon="CheckSquare" title="Selectable" description="Selection cards with icons" href="/screens/components/selectable" />
                    <ListLink icon="ToggleRight" title="Switch" description="Toggle with labels and icons" href="/screens/components/switch" />
                </View>

                <Section title="Layout" titleSize="2xl" className="mt-6 mb-2" />
                <View style={shadowPresets.large} className=" mb-4">
                    <ListLink icon="ChevronsUpDown" title="Expandable" description="Tap to expand and collapse" href="/screens/components/expandable" />
                    <ListLink icon="Layers" title="Card Scroller" description="Horizontal scrolling cards" href="/screens/components/card-scroller" />
                    <ListLink icon="Images" title="Image Carousel" description="Swipeable image gallery" href="/screens/components/image-carousel" />
                    <ListLink icon="PanelBottom" title="Action Sheet" description="Bottom sheet modals" href="/screens/components/action-sheet" />
                    <ListLink icon="Columns" title="Tabs" description="Swipeable tab navigation" href="/screens/components/theme-tabs" />
                </View>

                <Section title="Data Display" titleSize="2xl" className="mt-6 mb-2" />
                <View style={shadowPresets.large} className=" mb-4">
                    <ListLink icon="Star" title="Review" description="User reviews with ratings" href="/screens/components/review" />
                    <ListLink icon="BarChart3" title="Chart Cards" description="Line & circle chart cards" href="/screens/components/chart-cards" />
                </View>

                <Section title="Navigation" titleSize="2xl" className="mt-6 mb-2" />
                <View style={shadowPresets.large} className=" mb-4">
                    <ListLink icon="ListOrdered" title="MultiStep" description="Step-by-step onboarding flow" href="/screens/components/multistep" />
                </View>

                <Section title="Utilities" titleSize="2xl" className="mt-6 mb-2" />
                <View style={shadowPresets.large} className=" mb-4">
                    <ListLink icon="Shapes" title="Icons" description="Available icon set" href="/screens/components/icon" />
                    <ListLink icon="Loader" title="Progress Bar" description="Progress indicators" href="/screens/components/progress-bar" />
                </View>
            </ThemedScroller>
        </>
    );
}

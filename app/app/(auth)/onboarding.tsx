import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, ScrollView, useWindowDimensions, Animated, Easing,
  NativeSyntheticEvent, NativeScrollEvent
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GraduationCap, Award, Users, Flame, Sparkles, MessageCircle } from "lucide-react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../src/context/LanguageContext";

const ONBOARDED_KEY = "insyte_has_onboarded";

// Web floats the slide icon with Framer's y: [0,-10,0] on a 3.5s loop.
// Same effect via a looped Animated sequence.
function useFloat() {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -10, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return y;
}

export default function Onboarding() {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const floatY = useFloat();

  const slides = [
    { Icon: GraduationCap, title: t.landHeadline, desc: t.welcomeTagline, chips: [] as { Icon: any; label: string; color: string }[] },
    {
      Icon: Award,
      title: t.landFeat2t,
      desc: t.landFeat2d,
      chips: [
        { Icon: Flame, label: "7", color: "#fb923c" },
        { Icon: Award, label: "+250 XP", color: "#fcd34d" },
        { Icon: Sparkles, label: "AI", color: "#c4b5fd" }
      ]
    },
    {
      Icon: Users,
      title: t.landFeat1t,
      desc: t.landFeat4d,
      chips: [{ Icon: MessageCircle, label: t.landFeat4t, color: "#6ee7b7" }]
    }
  ];
  const last = index === slides.length - 1;

  const goToWelcome = () => {
    AsyncStorage.setItem(ONBOARDED_KEY, "1");
    router.replace("/(auth)/welcome");
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))));
  };

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: page * width, animated: true });
    setIndex(page);
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Soft gradient instead of blurred circles — RN can't blur a View, so
          circles render hard-edged. Same depth, no ugly seams. */}
      <LinearGradient
        colors={["#1e1b4b", "#020617", "#000000"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      <View className="flex-row items-center justify-between px-5 pt-16">
        <Text className="text-lg font-extrabold text-indigo-300 font-display">insyte</Text>
        {!last && (
          <Pressable onPress={goToWelcome} className="px-3 py-2">
            <Text className="text-xs font-bold text-slate-400">{t.introSkip}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        className="flex-1"
      >
        {slides.map((slide, i) => {
          const { Icon } = slide;
          return (
            <View key={i} style={{ width }} className="items-center justify-center px-8">
              <View className="items-center max-w-sm">
                <Animated.View style={{ transform: [{ translateY: floatY }] }}>
                  <LinearGradient
                    colors={["#6366f1", "#7c3aed"]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={{ padding: 24, borderRadius: 32, marginBottom: 28 }}
                  >
                    <Icon size={56} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
                <Text className="text-3xl font-extrabold text-white font-display text-center leading-tight mb-3">
                  {slide.title}
                </Text>
                <Text className="text-slate-300 text-sm text-center leading-relaxed">{slide.desc}</Text>
                {slide.chips.length > 0 && (
                  <View className="flex-row flex-wrap items-center justify-center gap-3 mt-6">
                    {slide.chips.map((chip, k) => {
                      const ChipIcon = chip.Icon;
                      return (
                        <View
                          key={k}
                          className="flex-row items-center gap-1.5 px-3.5 py-2 bg-slate-900/70 border border-slate-700/60 rounded-2xl"
                        >
                          <ChipIcon size={16} color={chip.color} />
                          <Text className="text-xs font-bold text-white">{chip.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className="px-8 pb-10 pt-2">
        <View className="flex-row items-center justify-center gap-2 mb-6">
          {slides.map((_, k) => (
            <Pressable key={k} onPress={() => goToPage(k)} hitSlop={8}>
              <View className={`h-2 rounded-full ${k === index ? "w-6 bg-indigo-400" : "w-2 bg-slate-700"}`} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => (last ? goToWelcome() : goToPage(index + 1))} className="active:opacity-90">
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
          >
            <Text className="text-white font-bold text-sm">{last ? t.landCtaStart : t.introNext}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

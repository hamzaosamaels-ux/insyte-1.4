import React, { useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../src/context/LanguageContext";

const ONBOARDED_KEY = "insyte_has_onboarded";

// Web's AppIntro uses a Framer Motion drag="x" gesture for the slide swipe.
// Native equivalent, per the Phase 1 plan: a plain pagingEnabled ScrollView —
// a standard, zero-extra-library idiom for swipeable slides.
export default function Onboarding() {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const slides = [
    { title: t.landHeadline, desc: t.welcomeTagline, chips: [] as string[] },
    { title: t.landFeat2t, desc: t.landFeat2d, chips: ["🔥 7", "+250 XP", "AI"] },
    { title: t.landFeat1t, desc: t.landFeat4d, chips: [t.landFeat4t] }
  ];
  const last = index === slides.length - 1;

  const goToWelcome = () => {
    AsyncStorage.setItem(ONBOARDED_KEY, "1");
    router.replace("/(auth)/welcome");
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(slides.length - 1, page)));
  };

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: page * width, animated: true });
    setIndex(page);
  };

  return (
    <View className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between px-5 pt-14">
        <Text className="text-lg font-extrabold text-indigo-300 font-display">insyte</Text>
        {!last && (
          <Pressable onPress={goToWelcome}>
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
        {slides.map((slide, i) => (
          <View key={i} style={{ width }} className="items-center justify-center px-8">
            <View className="items-center max-w-sm">
              <View className="p-6 bg-indigo-600 rounded-[2rem] mb-7">
                <Text className="text-4xl">🎓</Text>
              </View>
              <Text className="text-2xl font-extrabold text-white font-display text-center leading-tight mb-3">
                {slide.title}
              </Text>
              <Text className="text-slate-300 text-sm text-center leading-relaxed">{slide.desc}</Text>
              {slide.chips.length > 0 && (
                <View className="flex-row flex-wrap items-center justify-center gap-3 mt-6">
                  {slide.chips.map((chip, k) => (
                    <View key={k} className="px-3.5 py-2 bg-slate-900/70 border border-slate-700/60 rounded-2xl">
                      <Text className="text-xs font-bold text-white">{chip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-8 pb-10 pt-2">
        <View className="flex-row items-center justify-center gap-2 mb-6">
          {slides.map((_, k) => (
            <Pressable key={k} onPress={() => goToPage(k)}>
              <View className={`h-2 rounded-full ${k === index ? "w-6 bg-indigo-400" : "w-2 bg-slate-700"}`} />
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => (last ? goToWelcome() : goToPage(index + 1))}
          className="py-4 bg-indigo-600 active:bg-indigo-500 rounded-2xl items-center"
        >
          <Text className="text-white font-bold text-sm">{last ? t.landCtaStart : t.introNext}</Text>
        </Pressable>
      </View>
    </View>
  );
}

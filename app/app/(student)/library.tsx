import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Linking, FlatList } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useAppData } from "../../src/context/AppDataContext";
import { useLanguage } from "../../src/context/LanguageContext";

type Kind = "all" | "lesson" | "video" | "slides" | "link" | "homework";

interface Resource {
  id: string;
  kind: Exclude<Kind, "all">;
  title: string;
  subtitle: string;
  url?: string;
  classId: string;
}

// Same shape as web's Library: one flat, filterable list built client-side
// from lessons + tasks. Zero API calls of its own.
export default function StudentLibrary() {
  const { currentUser } = useAuth();
  const { classes, lessons, tasks } = useAppData();
  const { t } = useLanguage();

  const [kind, setKind] = useState<Kind>("all");
  const [query, setQuery] = useState("");

  const myClassIds = useMemo(
    () => new Set(classes.filter(c => currentUser?.joinedClasses?.includes(c.id)).map(c => c.id)),
    [classes, currentUser?.joinedClasses]
  );

  const resources = useMemo<Resource[]>(() => {
    const out: Resource[] = [];
    for (const l of lessons) {
      if (!myClassIds.has(l.classId)) continue;
      out.push({ id: `lesson-${l.id}`, kind: "lesson", title: l.title, subtitle: t.libLessons, classId: l.classId });
      if (l.videoUrl) out.push({ id: `video-${l.id}`, kind: "video", title: l.title, subtitle: t.libVideos, url: l.videoUrl, classId: l.classId });
      if (l.pptUrl) out.push({ id: `slides-${l.id}`, kind: "slides", title: l.title, subtitle: t.libSlides, url: l.pptUrl, classId: l.classId });
      if (l.webUrl) out.push({ id: `link-${l.id}`, kind: "link", title: l.webUrlTitle || l.title, subtitle: t.libLinks, url: l.webUrl, classId: l.classId });
    }
    for (const task of tasks) {
      if (!myClassIds.has(task.classId)) continue;
      out.push({ id: `hw-${task.id}`, kind: "homework", title: task.title, subtitle: `${t.libDue} ${task.dueDate}`, classId: task.classId });
    }
    return out;
  }, [lessons, tasks, myClassIds, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter(r =>
      (kind === "all" || r.kind === kind) &&
      (!q || r.title.toLowerCase().includes(q))
    );
  }, [resources, kind, query]);

  const chips: { key: Kind; label: string }[] = [
    { key: "all", label: t.libAll },
    { key: "lesson", label: t.libLessons },
    { key: "video", label: t.libVideos },
    { key: "slides", label: t.libSlides },
    { key: "link", label: t.libLinks },
    { key: "homework", label: t.libHomework }
  ];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#0b081a]">
      <View className="p-4 pb-2">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.librarySearch}
          placeholderTextColor="#64748b"
          className="w-full px-4 py-2.5 bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-xl text-sm text-slate-800 dark:text-white"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-1">
          {chips.map(c => (
            <Pressable
              key={c.key}
              onPress={() => setKind(c.key)}
              className={`mx-1 px-3.5 py-2 rounded-xl border ${
                kind === c.key
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-white dark:bg-[#18142c] border-slate-200 dark:border-[#2b244c]"
              }`}
            >
              <Text className={`text-[11px] font-bold ${kind === c.key ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-sm text-slate-500 dark:text-slate-400">{t.libEmpty}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            // Web opens these in a new tab; Linking.openURL is the native
            // equivalent (handoff, not an embed — embeds land in Phase 5).
            onPress={() => item.url && Linking.openURL(item.url)}
            disabled={!item.url}
            className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 mb-2.5 active:opacity-70"
          >
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-[11px] text-indigo-500 font-semibold mt-1">{item.subtitle}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

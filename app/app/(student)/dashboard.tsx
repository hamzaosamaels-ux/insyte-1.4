import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Modal, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useAppData } from "../../src/context/AppDataContext";
import { useLanguage } from "../../src/context/LanguageContext";

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const { classes, students, announcements, events, loading, refresh, joinClass, leaveClass } = useAppData();
  const { t } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const myClasses = useMemo(
    () => classes.filter(c => currentUser?.joinedClasses?.includes(c.id)),
    [classes, currentUser?.joinedClasses]
  );
  const myClassIds = useMemo(() => new Set(myClasses.map(c => c.id)), [myClasses]);

  const myAnnouncements = useMemo(
    () => announcements.filter(a => myClassIds.has(a.classId)).slice(0, 5),
    [announcements, myClassIds]
  );
  const myEvents = useMemo(
    () => events.filter(e => myClassIds.has(e.classId)).slice(0, 5),
    [events, myClassIds]
  );

  // Classmates ranked by XP — the leaderboard, same idea as web's lobby
  const leaderboard = useMemo(() => {
    const peers = students.filter(s => s.joinedClasses?.some(id => myClassIds.has(id)));
    return [...peers].sort((a, b) => b.xp - a.xp).slice(0, 10);
  }, [students, myClassIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    setJoinError(null);
    const err = await joinClass(joinCode.trim());
    setJoining(false);
    if (err) {
      setJoinError(err);
      return;
    }
    setJoinCode("");
    setJoinOpen(false);
  };

  const handleLeave = async (classId: string) => {
    setLeavingId(classId);
    await leaveClass(classId);
    setLeavingId(null);
  };

  if (loading && myClasses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#0b081a]">
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-[#0b081a]"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
    >
      {/* Standing */}
      <View className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 mb-4">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.standing}</Text>
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
          {currentUser?.name}
        </Text>
        <Text className="text-xs text-indigo-500 font-semibold mt-0.5">{currentUser?.rank}</Text>
        <View className="flex-row gap-4 mt-3">
          <View>
            <Text className="text-[10px] text-slate-400 uppercase">{t.level}</Text>
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{currentUser?.level ?? 1}</Text>
          </View>
          <View>
            <Text className="text-[10px] text-slate-400 uppercase">{t.totalXp}</Text>
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{currentUser?.xp ?? 0}</Text>
          </View>
          <View>
            <Text className="text-[10px] text-slate-400 uppercase">{t.streakLabel}</Text>
            <Text className="text-base font-bold text-orange-500">{currentUser?.streak ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Classes */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.enrolledClassroom}</Text>
        <Pressable onPress={() => setJoinOpen(true)} className="px-3 py-1.5 bg-indigo-600 active:bg-indigo-500 rounded-lg">
          <Text className="text-white text-[11px] font-bold">{t.joinBtn}</Text>
        </Pressable>
      </View>

      {myClasses.length === 0 ? (
        <View className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-5 mb-4">
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">{t.noClassesYet}</Text>
        </View>
      ) : (
        myClasses.map(c => (
          <View key={c.id} className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 mb-2.5">
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.name}</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5">{c.teacherName}</Text>
            {c.description ? (
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{c.description}</Text>
            ) : null}
            <Pressable
              onPress={() => handleLeave(c.id)}
              disabled={leavingId === c.id}
              className="mt-3 self-start px-3 py-1.5 border border-red-300 dark:border-red-500/40 rounded-lg active:bg-red-50 dark:active:bg-red-950/30"
            >
              <Text className="text-[11px] font-bold text-red-500">
                {leavingId === c.id ? "..." : t.leaveClass}
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {/* Announcements */}
      {myAnnouncements.length > 0 && (
        <View className="mt-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.announcements}</Text>
          {myAnnouncements.map(a => (
            <View key={a.id} className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 mb-2.5">
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.title}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.content}</Text>
              <Text className="text-[10px] text-slate-400 mt-2">{a.authorName}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Events */}
      {myEvents.length > 0 && (
        <View className="mt-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.scheduledEvents}</Text>
          {myEvents.map(e => (
            <View key={e.id} className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 mb-2.5">
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{e.title}</Text>
              <Text className="text-[11px] text-indigo-500 font-semibold mt-0.5">{e.date} {e.time}</Text>
              {e.description ? (
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.description}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <View className="mt-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.leaderboard}</Text>
          <View className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-2">
            {leaderboard.map((s, i) => (
              <View
                key={s.id}
                className={`flex-row items-center justify-between px-3 py-2.5 rounded-xl ${s.id === currentUser?.id ? "bg-indigo-50 dark:bg-indigo-950/30" : ""}`}
              >
                <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                  <Text className="text-[11px] font-mono font-bold text-slate-400 w-5">{i + 1}</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-1" numberOfLines={1}>
                    {s.name}
                  </Text>
                </View>
                <Text className="text-[11px] font-bold text-indigo-500">{s.xp} XP</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Join class modal */}
      <Modal visible={joinOpen} transparent animationType="fade" onRequestClose={() => setJoinOpen(false)}>
        <Pressable className="flex-1 bg-black/70 items-center justify-center p-6" onPress={() => setJoinOpen(false)}>
          <Pressable
            className="w-full max-w-sm bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{t.joinClassTitle}</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.joinClassDesc}</Text>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder={t.classCodePlaceholder}
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-xl text-sm text-slate-800 dark:text-white"
            />
            {joinError && <Text className="text-xs text-red-500 mt-2">{joinError}</Text>}
            <View className="flex-row justify-end gap-2.5 mt-4">
              <Pressable onPress={() => setJoinOpen(false)} className="px-4 py-2.5">
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleJoin}
                disabled={joining}
                className="px-4 py-2.5 bg-indigo-600 active:bg-indigo-500 rounded-xl disabled:opacity-60"
              >
                <Text className="text-white text-xs font-bold">{joining ? "..." : t.joinBtn}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Modal, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../src/context/AuthContext";
import { useAppData } from "../../src/context/AppDataContext";
import { useLanguage } from "../../src/context/LanguageContext";

export default function TeacherLobby() {
  const { currentUser } = useAuth();
  const { classes, students, loading, refresh, createClass, joinClass, adjustStudentXp } = useAppData();
  const { t } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create / join community modal (web has a 3-way switcher; native starts
  // with the two that matter most — add-subject-inside-community is Phase 5+)
  const [modalMode, setModalMode] = useState<"create" | "join" | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inline XP editing (web: ±10 buttons + tap-the-number-to-type-exact)
  const [editingXpFor, setEditingXpFor] = useState<string | null>(null);
  const [xpDraft, setXpDraft] = useState("");
  const [busyStudent, setBusyStudent] = useState<string | null>(null);

  const myClasses = useMemo(
    () => classes.filter(c => c.teacherId === currentUser?.id || currentUser?.joinedClasses?.includes(c.id)),
    [classes, currentUser?.id, currentUser?.joinedClasses]
  );
  const myClassIds = useMemo(() => new Set(myClasses.map(c => c.id)), [myClasses]);
  const myStudents = useMemo(
    () => students.filter(s => s.joinedClasses?.some(id => myClassIds.has(id))),
    [students, myClassIds]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openModal = (mode: "create" | "join") => {
    setModalMode(mode);
    setFormName("");
    setFormCode("");
    setFormDesc("");
    setFormError(null);
  };

  const handleSubmitModal = async () => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    let err: string | null;
    if (modalMode === "join") {
      if (!formCode.trim()) { setSubmitting(false); return; }
      err = await joinClass(formCode.trim());
    } else {
      if (!formName.trim() || !formCode.trim()) { setSubmitting(false); return; }
      err = await createClass(formName.trim(), formCode.trim().toUpperCase(), formDesc.trim());
    }
    setSubmitting(false);
    if (err) { setFormError(err); return; }
    setModalMode(null);
  };

  const commitXp = async (studentId: string, currentXp: number) => {
    const target = Math.round(Number(xpDraft));
    setEditingXpFor(null);
    // Empty/garbage input is a no-op, not a silent "set XP to zero"
    if (!xpDraft.trim() || !Number.isFinite(target)) return;
    const delta = target - currentXp;
    if (delta === 0) return;
    setBusyStudent(studentId);
    await adjustStudentXp(studentId, delta);
    setBusyStudent(null);
  };

  const bumpXp = async (studentId: string, amount: number) => {
    setBusyStudent(studentId);
    await adjustStudentXp(studentId, amount);
    setBusyStudent(null);
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
      <View className="flex-row gap-2.5 mb-4">
        <Pressable onPress={() => openModal("create")} className="flex-1 py-3 bg-violet-600 active:bg-violet-500 rounded-xl items-center">
          <Text className="text-white text-xs font-bold">{t.createClassCommunity}</Text>
        </Pressable>
        <Pressable onPress={() => openModal("join")} className="flex-1 py-3 bg-indigo-600 active:bg-indigo-500 rounded-xl items-center">
          <Text className="text-white text-xs font-bold">{t.joinCommunity}</Text>
        </Pressable>
      </View>

      {myClasses.length === 0 ? (
        <View className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-5">
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">{t.noClassroomDesc}</Text>
        </View>
      ) : (
        myClasses.map(c => (
          <View key={c.id} className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 mb-2.5">
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.name}</Text>
            {c.description ? (
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.description}</Text>
            ) : null}
            <Pressable
              onPress={() => copyCode(c.code)}
              className="mt-3 self-start flex-row items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-[#1c1836] rounded-xl active:opacity-70"
            >
              <Text className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{c.code}</Text>
              <Text className="text-[10px] font-bold text-indigo-500">
                {copiedCode === c.code ? t.copied : t.copyCode}
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {/* Roster with inline XP editing */}
      {myStudents.length > 0 && (
        <View className="mt-5">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.roster}</Text>
          {myStudents.map(s => (
            <View
              key={s.id}
              className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-3.5 mb-2 flex-row items-center justify-between"
            >
              <View className="flex-1 min-w-0 mr-3">
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>{s.name}</Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">
                  {t.lvl} {s.level} · {s.rank}
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={() => bumpXp(s.id, -10)}
                  disabled={busyStudent === s.id}
                  className="w-8 h-8 items-center justify-center bg-slate-100 dark:bg-[#1c1836] rounded-lg active:opacity-70"
                >
                  <Text className="text-slate-600 dark:text-slate-300 font-bold">-</Text>
                </Pressable>

                {editingXpFor === s.id ? (
                  <TextInput
                    value={xpDraft}
                    onChangeText={setXpDraft}
                    onBlur={() => commitXp(s.id, s.xp)}
                    onSubmitEditing={() => commitXp(s.id, s.xp)}
                    keyboardType="number-pad"
                    autoFocus
                    className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-[#1c1836] border border-indigo-500 rounded-lg text-xs text-center text-slate-800 dark:text-white"
                  />
                ) : (
                  <Pressable
                    onPress={() => { setEditingXpFor(s.id); setXpDraft(String(s.xp)); }}
                    className="w-16 items-center py-1.5"
                  >
                    <Text className="text-xs font-bold text-indigo-500">
                      {busyStudent === s.id ? "..." : `${s.xp} XP`}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => bumpXp(s.id, 10)}
                  disabled={busyStudent === s.id}
                  className="w-8 h-8 items-center justify-center bg-slate-100 dark:bg-[#1c1836] rounded-lg active:opacity-70"
                >
                  <Text className="text-slate-600 dark:text-slate-300 font-bold">+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Create / join modal */}
      <Modal visible={modalMode !== null} transparent animationType="fade" onRequestClose={() => setModalMode(null)}>
        <Pressable className="flex-1 bg-black/70 items-center justify-center p-6" onPress={() => setModalMode(null)}>
          <Pressable
            className="w-full max-w-sm bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {modalMode === "join" ? t.joinCommunity : t.createClassCommunity}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {modalMode === "join" ? t.joinCommunityHint : t.createClassSubtitle}
            </Text>

            {modalMode === "create" && (
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder={t.classGradePlaceholder}
                placeholderTextColor="#64748b"
                className="w-full px-4 py-3 mb-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-xl text-sm text-slate-800 dark:text-white"
              />
            )}

            <TextInput
              value={formCode}
              onChangeText={setFormCode}
              placeholder={t.classCodePlaceholder}
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-xl text-sm text-slate-800 dark:text-white"
            />

            {modalMode === "create" && (
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder={t.shortDescPlaceholder}
                placeholderTextColor="#64748b"
                className="w-full px-4 py-3 mt-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-xl text-sm text-slate-800 dark:text-white"
              />
            )}

            {formError && <Text className="text-xs text-red-500 mt-2">{formError}</Text>}

            <View className="flex-row justify-end gap-2.5 mt-4">
              <Pressable onPress={() => setModalMode(null)} className="px-4 py-2.5">
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitModal}
                disabled={submitting}
                className="px-4 py-2.5 bg-indigo-600 active:bg-indigo-500 rounded-xl disabled:opacity-60"
              >
                <Text className="text-white text-xs font-bold">
                  {submitting ? "..." : modalMode === "join" ? t.joinCommunity : t.createClassroom}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

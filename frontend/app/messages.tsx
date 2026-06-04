import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ScreenShell, TruefeedModal } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

type MessageTab = 'messages' | 'requests';

const gifts = [
  { name: 'Confettis', stock: 3, unlocked: true },
  { name: 'Emoji Geant', stock: 5, unlocked: true },
  { name: 'Applaudissements', stock: 0, unlocked: false },
  { name: 'Meteo Mood', stock: 0, unlocked: false },
  { name: 'Mystique Charme', stock: 0, unlocked: false },
  { name: 'Recap Magique', stock: 0, unlocked: false },
];

const initialConversations = [
  {
    id: 'maya',
    author: 'maya_explores',
    relation: 'Amie',
    body: 'Merci pour ton bon plan, je vais tester ce spot.',
    time: '18 min',
  },
  {
    id: 'nora',
    author: 'nora.nomad',
    relation: 'Suivie',
    body: 'Tu pars quand a Kyoto ?',
    time: '1 h',
  },
  {
    id: 'official',
    author: 'Createur TRUEFEED',
    relation: 'Officiel',
    body: 'Bienvenue sur TRUEFEED.',
    time: 'Maintenant',
  },
];

const messageRequests = [
  {
    id: 'lucas',
    author: 'lucas.trips',
    relation: 'Demande',
    body: 'Souhaite t envoyer un message.',
    time: '2 h',
  },
  {
    id: 'sara',
    author: 'sara.city',
    relation: 'Demande',
    body: 'A reagi a ta story et demande a discuter.',
    time: 'Hier',
  },
];

export default function MessagesScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [tab, setTab] = useState<MessageTab>('messages');
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState(initialConversations[0]);
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const messages = tab === 'messages' ? conversations : messageRequests;

  const threadMessages = useMemo(
    () => [
      { id: '1', mine: false, text: selectedConversation?.body ?? '' },
      ...(editingMessage ? [{ id: '2', mine: true, text: editingMessage }] : []),
    ],
    [editingMessage, selectedConversation?.body],
  );

  function sendMessage() {
    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      return;
    }

    setEditingMessage(cleanMessage);
    setMessageText('');
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <View style={styles.titleGroup}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Messagerie</Text>
          <Text style={[styles.screenMeta, { color: theme.muted }]}>Messages prives et demandes</Text>
        </View>
        <Pressable onPress={() => setShowGifts(true)} style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.badgeText, { color: theme.accentStrong }]}>B5</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Chip
          label="Messages"
          active={tab === 'messages'}
          backgroundColor={tab === 'messages' ? theme.accentStrong : theme.surface}
          textColor={tab === 'messages' ? '#FFFFFF' : theme.muted}
          onPress={() => setTab('messages')}
        />
        <Chip
          label={`Demandes (${messageRequests.length})`}
          active={tab === 'requests'}
          backgroundColor={tab === 'requests' ? theme.accentStrong : theme.surface}
          textColor={tab === 'requests' ? '#FFFFFF' : theme.muted}
          onPress={() => setTab('requests')}
        />
      </View>

      {messages.map((message) => (
        <Pressable
          key={message.id}
          onPress={() => tab === 'messages' && setSelectedConversation(message)}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accentStrong }]}>
              {message.author.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.copy}>
            <View style={styles.messageTitleRow}>
              <Text style={[styles.title, { color: theme.text }]}>{message.author}</Text>
              <Text style={[styles.relation, { color: theme.accentStrong }]}>{message.relation}</Text>
            </View>
            <Text style={[styles.body, { color: theme.muted }]}>{message.body}</Text>
          </View>
          {tab === 'messages' ? (
            <Pressable
              onPress={() => {
                setConversations((current) => current.filter((item) => item.id !== message.id));
                if (selectedConversation?.id === message.id) {
                  setSelectedConversation(conversations.find((item) => item.id !== message.id) ?? initialConversations[0]);
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color={theme.muted} />
            </Pressable>
          ) : (
            <Text style={[styles.time, { color: theme.muted }]}>{message.time}</Text>
          )}
        </Pressable>
      ))}

      {tab === 'messages' && selectedConversation ? (
        <View style={[styles.thread, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.threadTitle, { color: theme.text }]}>{selectedConversation.author}</Text>
          {threadMessages.map((message) => (
            <Pressable
              key={message.id}
              onPress={() => message.mine && setMessageText(message.text)}
              style={[
                styles.bubble,
                {
                  alignSelf: message.mine ? 'flex-end' : 'flex-start',
                  backgroundColor: message.mine ? theme.accentStrong : theme.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.bubbleText, { color: message.mine ? '#FFFFFF' : theme.text }]}>
                {message.text}
              </Text>
            </Pressable>
          ))}
          <View style={[styles.composer, { backgroundColor: theme.surfaceAlt }]}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Message..."
              placeholderTextColor={theme.muted}
              style={[styles.input, { color: theme.text }]}
            />
            <Pressable onPress={() => setMessageText('Message vocal envoye')}>
              <Ionicons name="mic-outline" size={22} color={theme.text} />
            </Pressable>
            <Pressable onPress={sendMessage}>
              <Ionicons name="send" size={22} color={theme.text} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <TruefeedModal
        visible={showGifts}
        theme={theme}
        title="Tes cadeaux"
        message="Les cadeaux gris ne sont pas encore debloques."
        onClose={() => setShowGifts(false)}
      >
        <View style={styles.giftGrid}>
          {gifts.map((gift) => (
            <Pressable
              key={gift.name}
              disabled={!gift.unlocked || gift.stock <= 0}
              style={[
                styles.giftCard,
                {
                  backgroundColor: gift.unlocked ? theme.surfaceAlt : theme.border,
                  opacity: gift.unlocked ? 1 : 0.45,
                },
              ]}
            >
              <Text style={[styles.giftName, { color: theme.text }]}>{gift.name}</Text>
              <Text style={[styles.giftStock, { color: theme.accentStrong }]}>
                {gift.unlocked ? `${gift.stock}x` : 'Bloque'}
              </Text>
            </Pressable>
          ))}
        </View>
      </TruefeedModal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  titleGroup: { flex: 1 },
  screenTitle: { fontFamily: fonts.body, fontSize: 24, fontWeight: '900' },
  screenMeta: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800' },
  badge: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  badgeText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  avatar: { alignItems: 'center', borderRadius: 22, height: 46, justifyContent: 'center', width: 46 },
  avatarText: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  copy: { flex: 1, gap: 4 },
  messageTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  relation: { fontFamily: fonts.body, fontSize: 12, fontWeight: '900' },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  time: { fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  thread: { borderRadius: 24, borderWidth: 1, gap: 10, padding: 16 },
  threadTitle: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  bubble: { borderRadius: 18, maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  composer: { alignItems: 'center', borderRadius: 999, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15 },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  giftCard: { borderRadius: 16, gap: 5, padding: 12, width: '47%' },
  giftName: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  giftStock: { fontFamily: fonts.body, fontSize: 12, fontWeight: '900' },
});

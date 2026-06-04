import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell, TruefeedModal } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

type MessageTab = 'messages' | 'requests';

type Conversation = {
  id: string;
  name: string;
  username: string;
  status: string;
  avatar: string;
  verified?: boolean;
};

const conversations: Conversation[] = [
  { id: 'nicolas', name: 'Nicolas Drossaert', username: 'nicolas.d', status: 'Envoye il y a 2 h', avatar: 'N' },
  { id: 'orlann', name: 'Orlann', username: 'orlann', status: 'Envoye il y a 3 h', avatar: 'O' },
  { id: 'thibaut', name: 'THIBAUT', username: 'thibaut', status: 'En ligne il y a 2 h', avatar: 'T' },
  { id: 'martins', name: 'Martins Julien', username: 'martozzinho', status: 'Vu il y a 9 h', avatar: 'M' },
  { id: 'pierre', name: 'pierre.b', username: 'pierre.b', status: 'Envoye il y a 15 h', avatar: 'P' },
  { id: 'karel', name: 'nde_karel', username: 'nde_karel', status: 'Envoye lundi', avatar: 'K' },
  { id: 'hugues', name: 'Hugues Amouret', username: 'hugues', status: 'En ligne il y a 6 h', avatar: 'H' },
  {
    id: 'thestallion',
    name: 'theestallion',
    username: 'theestallion',
    status: 'Envoye la semaine derniere',
    avatar: 'T',
    verified: true,
  },
];

const requests: Conversation[] = [
  { id: 'lucas', name: 'lucas.trips', username: 'lucas.trips', status: 'Souhaite t envoyer un message', avatar: 'L' },
  { id: 'sara', name: 'sara.city', username: 'sara.city', status: 'A reagi a ta story', avatar: 'S' },
];

const gifts = [
  { name: 'Confettis', stock: 3, unlocked: true },
  { name: 'Emoji Geant', stock: 5, unlocked: true },
  { name: 'Applaudissements', stock: 0, unlocked: false },
  { name: 'Meteo Mood', stock: 0, unlocked: false },
  { name: 'Mystique Charme', stock: 0, unlocked: false },
  { name: 'Recap Magique', stock: 0, unlocked: false },
];

const starterMessages = [
  { id: '1', mine: false, text: 'Oui j attends que mon pote se reveille' },
  { id: '2', mine: true, text: 'Et toi t as assez dormi ?' },
  { id: '3', mine: false, text: 'Oui ca va' },
  { id: '4', mine: false, text: 'Faut attaquer la journee maintenant' },
  { id: '5', mine: true, text: 'Et moi la soiree 😉' },
  { id: '6', mine: false, text: 'Bonne soiree alors 😊' },
  { id: '7', mine: true, text: 'Je ne sors pas je la passe chez moi 😉 je ne sors que quand ma pote est dispo' },
  { id: '8', mine: false, text: 'Ah oui d accord repose toi bien alors' },
  { id: '9', mine: true, text: 'Oui cheri 🙂' },
];

export default function MessagesScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [tab, setTab] = useState<MessageTab>('messages');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState(starterMessages);
  const [showGifts, setShowGifts] = useState(false);
  const visibleConversations = tab === 'messages' ? conversations : requests;

  function sendMessage() {
    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: String(Date.now()), mine: true, text: cleanMessage },
    ]);
    setMessageText('');
  }

  if (selectedConversation) {
    return (
      <ScreenShell theme={theme} contentContainerStyle={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Ionicons name="chevron-back" size={34} color={theme.text} onPress={() => setSelectedConversation(null)} />
          <View style={[styles.smallAvatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.smallAvatarText, { color: theme.accentStrong }]}>
              {selectedConversation.avatar}
            </Text>
          </View>
          <View style={styles.chatTitleGroup}>
            <Text style={[styles.chatName, { color: theme.text }]}>{selectedConversation.name}</Text>
            <Text style={[styles.chatUsername, { color: theme.muted }]}>{selectedConversation.username}</Text>
          </View>
          <Ionicons name="call-outline" size={28} color={theme.text} />
          <Ionicons name="videocam-outline" size={30} color={theme.text} />
        </View>

        <View style={styles.messageStack}>
          {messages.map((message, index) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                { justifyContent: message.mine ? 'flex-end' : 'flex-start' },
              ]}
            >
              {!message.mine && index % 2 === 0 ? (
                <View style={[styles.tinyAvatar, { backgroundColor: theme.accentSoft }]}>
                  <Text style={[styles.tinyAvatarText, { color: theme.accentStrong }]}>
                    {selectedConversation.avatar}
                  </Text>
                </View>
              ) : !message.mine ? (
                <View style={styles.tinyAvatarSpacer} />
              ) : null}
              <Pressable
                onPress={() => message.mine && setMessageText(message.text)}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: message.mine ? '#6C3CFF' : '#EEF1F4',
                    borderBottomRightRadius: message.mine ? 8 : 24,
                    borderBottomLeftRadius: message.mine ? 24 : 8,
                  },
                ]}
              >
                <Text style={[styles.bubbleText, { color: message.mine ? '#FFFFFF' : '#111827' }]}>
                  {message.text}
                </Text>
              </Pressable>
            </View>
          ))}
          <Text style={[styles.seenText, { color: theme.muted }]}>Vu il y a 9 h</Text>
        </View>

        <View style={[styles.chatComposer, { backgroundColor: theme.surfaceAlt }]}>
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </View>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Votre message..."
            placeholderTextColor={theme.muted}
            style={[styles.chatInput, { color: theme.text }]}
          />
          <Ionicons name="mic-outline" size={28} color={theme.text} />
          <Ionicons name="image-outline" size={28} color={theme.text} />
          <Ionicons name="happy-outline" size={28} color={theme.text} />
          <Pressable onPress={messageText.trim() ? sendMessage : () => setShowGifts(true)}>
            <Ionicons name={messageText.trim() ? 'send' : 'add-circle-outline'} size={30} color={theme.text} />
          </Pressable>
        </View>

        <TruefeedModal
          visible={showGifts}
          theme={theme}
          title="Tes cadeaux"
          message="Choisis un cadeau debloque a envoyer dans la conversation."
          onClose={() => setShowGifts(false)}
        >
          <GiftGrid theme={theme} />
        </TruefeedModal>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell theme={theme} contentContainerStyle={styles.listContent}>
      <View style={styles.inboxHeader}>
        <View style={styles.inboxTitleCenter}>
          <Text style={[styles.inboxTitle, { color: theme.text }]}>suphile_</Text>
          <Ionicons name="chevron-down" size={22} color={theme.text} />
        </View>
        <Ionicons name="create-outline" size={28} color={theme.text} />
      </View>

      <View style={styles.inboxTabs}>
        <Pressable onPress={() => setTab('messages')}>
          <Text style={[styles.tabTitle, { color: tab === 'messages' ? theme.text : theme.muted }]}>
            Messages
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab('requests')}>
          <Text style={[styles.tabTitle, { color: tab === 'requests' ? theme.text : theme.muted }]}>
            Demandes
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setShowGifts(true)} style={[styles.badgeStrip, { backgroundColor: theme.surface }]}>
        <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.badgeText, { color: theme.accentStrong }]}>B5</Text>
        </View>
        <Text style={[styles.badgeCopy, { color: theme.text }]}>Suphile NTSIMBA</Text>
        <Text style={[styles.badgeMeta, { color: theme.muted }]}>Voir mes cadeaux</Text>
      </Pressable>

      {visibleConversations.map((conversation) => (
        <Pressable
          key={conversation.id}
          onPress={() => setSelectedConversation(conversation)}
          style={styles.conversationRow}
        >
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accentStrong }]}>{conversation.avatar}</Text>
          </View>
          <View style={styles.conversationCopy}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text }]}>{conversation.name}</Text>
              {conversation.verified ? <Ionicons name="checkmark-circle" size={16} color="#4DA3FF" /> : null}
            </View>
            <Text style={[styles.status, { color: theme.muted }]}>{conversation.status}</Text>
          </View>
          {tab === 'messages' ? (
            <Pressable>
              <Ionicons name="trash-outline" size={21} color={theme.muted} />
            </Pressable>
          ) : null}
        </Pressable>
      ))}

      <TruefeedModal
        visible={showGifts}
        theme={theme}
        title="Tes cadeaux"
        message="Les cadeaux gris ne sont pas encore debloques."
        onClose={() => setShowGifts(false)}
      >
        <GiftGrid theme={theme} />
      </TruefeedModal>
    </ScreenShell>
  );
}

function GiftGrid({ theme }: { theme: (typeof seasonThemes)['summer'] }) {
  return (
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
  );
}

const styles = StyleSheet.create({
  listContent: { gap: 22, paddingTop: 24 },
  chatContent: { gap: 18, paddingTop: 18 },
  inboxHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
  inboxTitleCenter: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingLeft: 28,
  },
  inboxTitle: { fontFamily: fonts.body, fontSize: 34, fontWeight: '900' },
  inboxTabs: { flexDirection: 'row', justifyContent: 'space-between' },
  tabTitle: { fontFamily: fonts.body, fontSize: 24, fontWeight: '900' },
  badgeStrip: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', gap: 10, padding: 12 },
  badge: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  badgeText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  badgeCopy: { flex: 1, fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
  badgeMeta: { fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  conversationRow: { alignItems: 'center', flexDirection: 'row', gap: 16, minHeight: 72 },
  avatar: { alignItems: 'center', borderRadius: 35, height: 70, justifyContent: 'center', width: 70 },
  avatarText: { fontFamily: fonts.body, fontSize: 24, fontWeight: '900' },
  conversationCopy: { flex: 1, gap: 3 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  name: { fontFamily: fonts.body, fontSize: 20, fontWeight: '900' },
  status: { fontFamily: fonts.body, fontSize: 17, fontWeight: '800' },
  chatHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(120,120,120,0.16)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
  },
  smallAvatar: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  smallAvatarText: { fontFamily: fonts.body, fontSize: 17, fontWeight: '900' },
  chatTitleGroup: { flex: 1 },
  chatName: { fontFamily: fonts.body, fontSize: 22, fontWeight: '900' },
  chatUsername: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  messageStack: { gap: 8 },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  tinyAvatar: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  tinyAvatarText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  tinyAvatarSpacer: { width: 36 },
  bubble: { borderRadius: 24, maxWidth: '78%', paddingHorizontal: 18, paddingVertical: 13 },
  bubbleText: { fontFamily: fonts.body, fontSize: 18, fontWeight: '800', lineHeight: 25 },
  seenText: {
    alignSelf: 'flex-end',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
    paddingRight: 12,
  },
  chatComposer: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: '#5B4DFF',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  chatInput: { flex: 1, fontFamily: fonts.body, fontSize: 18, fontWeight: '800' },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  giftCard: { borderRadius: 16, gap: 5, padding: 12, width: '47%' },
  giftName: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  giftStock: { fontFamily: fonts.body, fontSize: 12, fontWeight: '900' },
});

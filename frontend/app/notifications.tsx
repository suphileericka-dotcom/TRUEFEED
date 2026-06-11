// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { usersApi, type FriendRequestNotification } from '@/services/api/users';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type?: 'follow_request' | 'activity';
  request?: FriendRequestNotification;
};

export default function NotificationsScreen() {
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated } = useSession();
  const theme = seasonThemes[selectedSeason];
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setStatus('Connecte-toi pour voir tes notifications.');
      return;
    }

    let isMounted = true;

    usersApi
      .listNotifications()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setStatus('');
        setNotifications(
          response.items.map((request) => ({
            id: request.id,
            title: 'Demande d ami',
            body: `@${request.from.username} veut t ajouter.`,
            type: 'follow_request',
            request,
          })),
        );
      })
      .catch(() => {
        if (isMounted) {
          setStatus('Impossible de charger les notifications.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  async function resolveFollowRequest(notification: NotificationItem, accepted: boolean) {
    if (!notification.request) {
      return;
    }

    try {
      await usersApi.resolveFriendRequest(notification.request.id, accepted);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setStatus(
        accepted
          ? `@${notification.request.from.username} est maintenant dans tes amis.`
          : `Demande de @${notification.request.from.username} refusee.`,
      );
    } catch {
      setStatus('Impossible de traiter cette demande.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label="Notifications" />
      </View>

      {status ? (
        <View style={[styles.statusCard, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.statusText, { color: theme.text }]}>{status}</Text>
        </View>
      ) : null}

      {notifications.length === 0 && !status ? (
        <View style={[styles.statusCard, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.statusText, { color: theme.text }]}>Aucune notification pour le moment.</Text>
        </View>
      ) : null}

      {notifications.map((notification) => (
        <View
          key={notification.id}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.dot, { backgroundColor: theme.accentStrong }]} />
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{notification.title}</Text>
            <Text style={[styles.body, { color: theme.muted }]}>{notification.body}</Text>
          </View>
          {notification.type === 'follow_request' ? (
            <View style={styles.actions}>
              <Pressable
                onPress={() => resolveFollowRequest(notification, true)}
                style={[styles.actionButton, { backgroundColor: theme.accentStrong }]}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => resolveFollowRequest(notification, false)}
                style={[styles.actionButton, { backgroundColor: theme.surfaceAlt }]}
              >
                <Ionicons name="close" size={18} color={theme.muted} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  card: { alignItems: 'center', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  dot: { borderRadius: 999, height: 12, width: 12 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  statusCard: { borderRadius: 18, padding: 14 },
  statusText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', lineHeight: 20 },
});

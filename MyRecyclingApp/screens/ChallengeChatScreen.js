import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

// 👇 Hermes-compatible unique ID generator
const getPendingId = () =>
  Date.now().toString() + Math.random().toString(36).slice(2, 9);

export default function ChallengeChatScreen({ route }) {
  const { colors, darkMode } = useTheme();
  const { challengeId, challengeTitle } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [participantIds, setParticipantIds] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [myUserId, setMyUserId] = useState('');
  const socketRef = useRef();
  const flatListRef = useRef();

  const toUserId = (p) => (typeof p === 'string' ? p : (p && p._id ? p._id : ''));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      // Fetch all chat messages
      const { data: msgData } = await axios.get(`${API_BASE_URL}/api/chat/messages/${challengeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(msgData);

      // Fetch challenge and normalize participants to array of ids
      const { data: challenge } = await axios.get(`${API_BASE_URL}/api/challenges/${challengeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ids = (challenge.participants || []).map(toUserId).filter(Boolean);
      setParticipantIds(ids);

      // Batch fetch all participant names
      let userLookup = {};
      if (ids.length) {
        try {
          const { data: users } = await axios.post(`${API_BASE_URL}/api/user/batch`, { ids }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          users.forEach(u => { userLookup[u._id] = u.name || u._id; });
        } catch (err) {
          ids.forEach(uid => { userLookup[uid] = uid; });
        }
      }
      setUserMap(userLookup);

      // Get current user's id
      const profile = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyUserId(profile?.data?.user?._id ?? '');
    } catch (err) {
      setMessages([]);
      setParticipantIds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchAll();

    // Socket.io setup
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        timeout: 20000,
      });

      socket.on('connect', () => {
        socket.emit('joinRoom', challengeId);
      });

      socket.on('disconnect', () => {
        // Optional: add disconnect logic
      });

      socket.on('connect_error', (error) => {
        setMessages(prev => prev.map(msg =>
          msg.pending ? { ...msg, pending: false, failed: true } : msg
        ));
      });

      socket.on('chatMessage', (msg) => {
        if (String(msg.roomId) !== String(challengeId)) return;

        if (msg.pendingId) {
          setMessages(prev => {
            const filtered = prev.filter(m => m.pendingId !== msg.pendingId);
            const serverMessage = { ...msg, pending: false, failed: false };
            return [...filtered, serverMessage];
          });
        } else {
          setMessages(prev => [...prev, { ...msg, pending: false, failed: false }]);
        }
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      socket.on('chatError', (error) => {
        if (error.pendingId) {
          setMessages(prev => prev.map(msg =>
            msg.pendingId === error.pendingId
              ? { ...msg, pending: false, failed: true, error: error.error }
              : msg
          ));
        }
      });

      // SYSTEM JOIN MESSAGE as chat
      socket.on('userJoined', ({ name }) => {
        setMessages(prev => [
          ...prev,
          {
            _id: getPendingId(),
            message: `${name} joined the chat!`,
            userId: 'system',
            name: 'System',
            roomId: challengeId,
            timestamp: new Date().toISOString(),
            isSystem: true,
          }
        ]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      socketRef.current = socket;
    };
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [challengeId, fetchAll]);

  // --- SYSTEM MESSAGE RENDER ---
  const renderMessage = ({ item }) => {
    if (item.isSystem) {
      return (
        <View style={{ alignSelf: 'center', marginVertical: 7 }}>
          <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
            {item.message}
          </Text>
        </View>
      );
    }
    const senderName = getName(item);
    const isMine =
      (item.userId && item.userId === myUserId) ||
      (item.name && (item.name === userMap[myUserId] || item.name === 'Me'));

    return (
      <View style={[
        styles.bubble,
        isMine ? styles.bubbleRight : styles.bubbleLeft,
        {
          backgroundColor: isMine
            ? (darkMode ? colors.tint + '44' : '#dbeafe')
            : (darkMode ? colors.card : "#fff"),
          borderColor: darkMode ? colors.tint + '33' : '#e5e7eb',
          opacity: item.pending ? 0.7 : 1,
        }
      ]}>
        <Text style={[
          styles.bubbleUsername,
          { color: isMine ? colors.tint : colors.textSecondary }
        ]}>
          {isMine ? "You" : senderName}
        </Text>
        <Text style={[styles.bubbleMessage, { color: colors.text }]}>{item.message}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.bubbleTime, { color: colors.textSecondary }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMine && (
            <Text style={{
              fontSize: 10,
              marginLeft: 8,
              color: item.failed ? '#EF4444' : (item.pending ? colors.textSecondary : '#3B82F6'),
              fontStyle: 'italic',
              fontWeight: 'bold'
            }}>
              {item.failed ? 'Failed' : (item.pending ? 'Sending...' : 'Sent')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const getName = (item) => {
    if (item.userId && userMap[item.userId]) return userMap[item.userId];
    if (item.name) return item.name;
    return 'User';
  };

  const sendMessage = () => {
    if (!socketRef.current || !input.trim()) return;

    if (!socketRef.current.connected) {
      return;
    }

    const pendingId = getPendingId();
    const now = new Date();
    const optimistic = {
      userId: myUserId,
      name: userMap[myUserId] || 'Me',
      message: input.trim(),
      timestamp: now.toISOString(),
      _id: pendingId,
      pendingId,
      roomId: challengeId,
      pending: true,
      failed: false,
    };

    setMessages(prev => [...prev, optimistic]);
    setInput('');
    socketRef.current.emit('chatMessage', {
      message: input.trim(),
      roomId: challengeId,
      pendingId
    });

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.pendingId === pendingId && msg.pending
          ? { ...msg, pending: false, failed: true }
          : msg
      ));
    }, 10000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Chat header */}
        <View style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.separator }
        ]}>
          <Text style={[styles.headerTitle, { color: colors.tint }]}>{challengeTitle} Chat</Text>
          <ScrollView horizontal contentContainerStyle={styles.participantsRow} showsHorizontalScrollIndicator={false}>
            {participantIds.length ? (
              participantIds.map((uid) => (
                <View key={uid} style={styles.participantBubble}>
                  <Text style={[styles.participantLetter, { backgroundColor: colors.tint }]}>
                    {userMap[uid]?.[0]?.toUpperCase() || '?'}
                  </Text>
                  <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
                    {userMap[uid] || 'User'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.participantName, { color: colors.textSecondary }]}>No participants found.</Text>
            )}
          </ScrollView>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.tint} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, idx) => item._id || item.pendingId || idx.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchAll();
                }}
                tintColor={colors.tint}
              />
            }
          />
        )}
        {/* Message input bar */}
        <View style={[
          styles.inputBar,
          { backgroundColor: colors.card, borderTopColor: colors.separator }
        ]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.bg, color: colors.text }
            ]}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.tint,
                opacity: (!socketRef.current?.connected || !input.trim()) ? 0.5 : 1
              }
            ]}
            disabled={!socketRef.current?.connected || !input.trim()}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  participantBubble: {
    alignItems: 'center',
    marginRight: 15,
  },
  participantLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    color: "#fff",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
    lineHeight: 32,
  },
  participantName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 70,
  },
  chatContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 76,
    minHeight: 120,
  },
  bubble: {
    marginVertical: 5,
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  bubbleUsername: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  bubbleMessage: {
    fontSize: 16,
    marginBottom: 2,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  inputBar: {
   
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 44,
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

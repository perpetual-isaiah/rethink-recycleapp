// CommunityChallengesScreen.js - Fixed likes and comments functionality

import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  ActivityIndicator, Alert, Pressable, RefreshControl,
  Animated, Platform, Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

export default function CommunityChallengesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toastY = useRef(new Animated.Value(120)).current;
  const [toast, setToast] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchData = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const uid = await AsyncStorage.getItem('userId');
    setUserId(uid);

    const { data } = await axios.get(`${API_BASE_URL}/api/challenges`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Process challenges to add computed fields
    const processedChallenges = data.map(challenge => ({
      ...challenge,
      likedByMe: challenge.likes && challenge.likes.includes(uid),
      likeCount: challenge.likes ? challenge.likes.length : 0,
      commentCount: challenge.comments ? challenge.comments.length : 0,
      joinedByMe: challenge.participants && challenge.participants.includes(uid)
    }));

    // Filter out joined AND expired challenges
    const now = Date.now();
    const unjoinedAndActive = processedChallenges.filter(c => {
      return (
        !c.joinedByMe &&
        new Date(c.endDate).getTime() >= now
      );
    });
    setList(unjoinedAndActive);

  } catch (err) {
    console.log('fetch err', err?.response?.data || err.message);
    Alert.alert('Error', 'Could not load challenges.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};



  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const showToast = (msg) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastY, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastY, { toValue: 120, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  // Handle like toggle
  const likeToggle = async (challengeId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.post(`${API_BASE_URL}/api/challenges/${challengeId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update the challenge in the list
      setList(prev => prev.map(challenge => 
        challenge._id === challengeId 
          ? {
              ...challenge,
              likedByMe: !challenge.likedByMe,
              likeCount: data.likeCount
            }
          : challenge
      ));
      
      showToast(data.message);
    } catch (err) {
      console.log('like error', err?.response?.data || err.message);
      Alert.alert('Error', 'Could not toggle like.');
    }
  };

  // Handle join challenge
  const handleJoin = async (challengeId, challengeTitle) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.post(`${API_BASE_URL}/api/challenges/${challengeId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Remove from list since user joined
      setList(prev => prev.filter(c => c._id !== challengeId));
      
      let message = data.message;
      if (data.reward) {
        // Use label and stars from the reward object
        const rewardText = data.reward.label || 'Welcome bonus';
        const stars = data.reward.stars || 1;
        const sticker = data.reward.sticker || '⭐';
        message += ` You earned: ${rewardText} - ${stars} star${stars !== 1 ? 's' : ''} ${sticker}`;
      }
      showToast(message);
    } catch (err) {
      console.log('join error', err?.response?.data || err.message);
      Alert.alert('Error', 'Could not join challenge.');
    }
  };

  const openCommentsModal = async (challengeId) => {
    setSelectedChallengeId(challengeId);
    setShowModal(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/challenges/${challengeId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(data);
      
      // Update comment count on modal open for accuracy
      setList(prev =>
        prev.map(c =>
          c._id === challengeId ? { ...c, commentCount: data.length } : c
        )
      );
    } catch (err) {
      console.log('comment fetch error', err.response?.data || err.message);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.post(`${API_BASE_URL}/api/challenges/${selectedChallengeId}/comment`, {
        text: newComment,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setComments(data.comments);
      setList(prev =>
        prev.map(c =>
          c._id === selectedChallengeId
            ? { ...c, commentCount: data.comments.length }
            : c
        )
      );
      setNewComment('');
      showToast('Comment added!');
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment.');
    }
  };

  const handleEdit = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/challenges/${selectedChallengeId}/comments/${commentId}`, {
        text: newComment,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingId(null);
      setNewComment('');
      openCommentsModal(selectedChallengeId);
    } catch {
      Alert.alert('Error', 'Failed to edit comment.');
    }
  };

  const handleDelete = async (commentId) => {
    Alert.alert('Confirm', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/challenges/${selectedChallengeId}/comments/${commentId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            openCommentsModal(selectedChallengeId);
            
            // Update comment count in main list
            setList(prev =>
              prev.map(c =>
                c._id === selectedChallengeId
                  ? { ...c, commentCount: Math.max(0, c.commentCount - 1) }
                  : c
              )
            );
          } catch {
            Alert.alert('Error', 'Failed to delete comment.');
          }
        }
      }
    ]);
  };

  const handleReply = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/challenges/${selectedChallengeId}/comments/${commentId}/replies`, {
        text: newComment,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReplyingTo(null);
      setNewComment('');
      openCommentsModal(selectedChallengeId);
    } catch {
      Alert.alert('Error', 'Failed to post reply.');
    }
  };

  const renderComment = ({ item }) => (
    <View style={s.commentWrapper}>
      <View style={s.commentBubble}>
        <View style={s.commentRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.commentText}>{item.text}</Text>
            <Text style={s.commentMeta}>
              {item.user?.name || 'Anonymous'} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {item.user?._id === userId && (
            <View style={s.commentActions}>
              <Pressable onPress={() => {
                setEditingId(item._id);
                setNewComment(item.text);
              }}>
                <Ionicons name="pencil" size={16} color={colors.tint} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item._id)} style={{ marginLeft: 8 }}>
                <Ionicons name="trash" size={16} color="#e11d48" />
              </Pressable>
            </View>
          )}
        </View>
        
        <Pressable 
          style={s.replyLink}
          onPress={() => setReplyingTo(item._id)}
        >
          <Text style={{ color: colors.tint, fontSize: 12 }}>Reply</Text>
        </Pressable>
        
        {/* Render replies */}
        {item.replies?.map((reply, index) => (
          <View key={reply._id || index} style={s.replyBubble}>
            <Text style={s.replyText}>{reply.text}</Text>
            <Text style={s.commentMeta}>
              {reply.user?.name || 'Anonymous'} • {new Date(reply.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [s.card, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      onPress={() => navigation.navigate('ChallengeDetails', { challengeId: item._id })}
    >
      <View style={s.row}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.tint} />
      </View>

      <Text style={s.desc} numberOfLines={2}>{item.description}</Text>

      <View style={s.metaBar}>
        <View style={s.metaChip}>
          <Ionicons name="calendar-outline" size={14} color={colors.tint} />
          <Text style={s.metaText}>{new Date(item.endDate).toLocaleDateString()}</Text>
        </View>

        <Pressable style={s.metaChip} onPress={() => likeToggle(item._id)}>
          <Ionicons
            name={item.likedByMe ? 'heart' : 'heart-outline'}
            size={14}
            color={item.likedByMe ? '#e11d48' : colors.tint}
          />
          <Text style={s.metaText}>{item.likeCount || 0}</Text>
        </Pressable>

        <Pressable
          style={s.metaChip}
          onPress={() => openCommentsModal(item._id)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.tint} />
          <Text style={s.metaText}>{item.commentCount || 0}</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
        onPress={() => handleJoin(item._id, item.title)}
      >
        <Text style={s.btnText}>Join Challenge</Text>
      </Pressable>
    </Pressable>
  );

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.tint} /></View>;
  }
  
  if (!list.length) {
    return (
      <View style={s.center}>
        <Ionicons name="leaf-outline" size={64} color={colors.tint + '55'} />
        <Text style={s.empty}>No community challenges available to join.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={list}
        keyExtractor={c => c._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { 
              setRefreshing(true); 
              fetchData(); 
            }} 
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[s.toast, { transform: [{ translateY: toastY }] }]} pointerEvents="none">
        <Text style={s.toastTxt}>{toast}</Text>
      </Animated.View>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior="padding" style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Comments</Text>
              <Pressable onPress={() => {
                setShowModal(false);
                setEditingId(null);
                setReplyingTo(null);
                setNewComment('');
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item, index) => item._id || index.toString()}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={renderComment}
            />

            <View style={s.commentInputBar}>
              <TextInput
                placeholder={
                  editingId ? "Edit comment..." : 
                  replyingTo ? "Write a reply..." : 
                  "Add a comment..."
                }
                value={newComment}
                onChangeText={setNewComment}
                style={s.input}
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <Pressable onPress={() => {
                if (editingId) {
                  handleEdit(editingId);
                } else if (replyingTo) {
                  handleReply(replyingTo);
                } else {
                  postComment();
                }
              }}>
                <Ionicons name="send" size={20} color={colors.tint} />
              </Pressable>
            </View>
            
            {(editingId || replyingTo) && (
              <Pressable 
                style={s.cancelBtn}
                onPress={() => {
                  setEditingId(null);
                  setReplyingTo(null);
                  setNewComment('');
                }}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (c) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  list: { padding: 20, paddingBottom: 40 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
  empty: { color: c.textSecondary, fontSize: 16, marginTop: 12, textAlign: 'center' },

  card: {
    backgroundColor: c.card, borderRadius: 24, padding: 20, marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: c.text, flex: 1 },
  desc: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginVertical: 8 },

  metaBar: { flexDirection: 'row', marginBottom: 14 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: c.tint + '15', borderRadius: 12, marginRight: 8,
  },
  metaText: { fontSize: 12, color: c.tint, marginLeft: 4, fontWeight: '600' },

  btn: { 
    alignSelf: 'flex-start', 
    backgroundColor: c.tint, 
    borderRadius: 30, 
    paddingVertical: 12, 
    paddingHorizontal: 28 
  },
  btnPressed: { opacity: 0.85 }, 
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  toast: {
    position: 'absolute', left: 20, right: 20, bottom: 32, padding: 14, borderRadius: 16,
    backgroundColor: c.tint, ...Platform.select({ android: { elevation: 6 } }),
  },
  toastTxt: { color: '#fff', fontWeight: '600', textAlign: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: c.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
  },
  commentWrapper: { marginBottom: 12 },
  commentBubble: {
    backgroundColor: c.tint + '10',
    padding: 12,
    borderRadius: 12,
  },
  commentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  commentText: {
    color: c.text,
    fontSize: 14,
    lineHeight: 18,
  },
  commentMeta: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
  },
  commentActions: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBubble: {
    marginTop: 8,
    marginLeft: 12,
    backgroundColor: c.tint + '08',
    padding: 10,
    borderRadius: 8,
  },
  replyText: { 
    color: c.text, 
    fontSize: 13,
    lineHeight: 16,
  },
  replyLink: { 
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: c.tint + '22',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: c.bg,
    color: c.text,
    marginRight: 10,
    maxHeight: 100,
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: c.tint,
    fontSize: 14,
    fontWeight: '600',
  },

  
});
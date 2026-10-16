import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trash2, Save, Play, Square, Bell, BellOff, Flame, Zap, Check } from 'lucide-react-native';
import { useAudioPlayer } from 'expo-audio';

const PRIORITY_OPTIONS = [
  {
    id: 'all',
    title: 'All Surveys',
    badge: 'All',
    description: 'Receive notifications for every new survey detected',
    color: '#10B981',
    Icon: Bell,
  },
  {
    id: 'medium',
    title: 'Medium & High Priority',
    badge: '≥ 1.5',
    description: 'Reward / Time ratio ≥ 1.5 cents/min',
    color: '#EAB308',
    Icon: Zap,
  },
  {
    id: 'high',
    title: 'High Priority Only',
    badge: '> 2.5',
    description: 'Reward / Time ratio > 2.5 cents/min (Top paying surveys)',
    color: '#EF4444',
    Icon: Flame,
  },
  {
    id: 'none',
    title: 'Muted',
    badge: 'Off',
    description: 'Pause all push notifications',
    color: '#64748B',
    Icon: BellOff,
  },
];

const SOUND_OPTIONS = [
  { id: 'default', name: 'Default Sound' },
  { id: 'chinese_bell_song', name: '🔔 Chinese Bell' },
  { id: 'fahhhhhhhhhhhhhh', name: '😱 Fahhhhhhhhhhhhhh' },
  { id: 'generic_ka_ching', name: '💰 Ka-Ching' },
  { id: 'iphone_notification', name: '📱 iPhone Notification' },
  { id: 'kar98k', name: '🔫 Kar98k' },
  { id: 'meccha_chameleon_whistle', name: '🎵 Chameleon Whistle' },
  { id: 'samsung_notification_sound_earrape', name: '📢 Samsung Earrape' },
  { id: 'snapchat_message', name: '👻 Snapchat Message' },
  { id: 'superchat', name: '⭐ Superchat' },
];

// Map sound IDs to require() sources (must be static)
const SOUND_SOURCES = {
  'chinese_bell_song': require('../../assets/audio/chinese_bell_song.wav'),
  'fahhhhhhhhhhhhhh': require('../../assets/audio/fahhhhhhhhhhhhhh.wav'),
  'generic_ka_ching': require('../../assets/audio/generic_ka_ching.wav'),
  'iphone_notification': require('../../assets/audio/iphone_notification.wav'),
  'kar98k': require('../../assets/audio/kar98k.wav'),
  'meccha_chameleon_whistle': require('../../assets/audio/meccha_chameleon_whistle.wav'),
  'samsung_notification_sound_earrape': require('../../assets/audio/samsung_notification_sound_earrape.wav'),
  'snapchat_message': require('../../assets/audio/snapchat_message.wav'),
  'superchat': require('../../assets/audio/superchat.wav'),
};

// Small component to handle audio preview for a single sound option
const SoundPreviewButton = ({ soundId, isPlaying, onToggle }) => {
  const source = SOUND_SOURCES[soundId] || null;
  const player = useAudioPlayer(source);

  const handlePress = useCallback(() => {
    if (!source) {
      Alert.alert('Default Sound', 'The default sound depends on your phone settings and cannot be previewed.');
      return;
    }
    if (isPlaying) {
      player.pause();
      onToggle(null);
    } else {
      player.seekTo(0);
      player.play();
      onToggle(soundId);
    }
  }, [source, isPlaying, soundId, player, onToggle]);

  // Listen for playback finishing
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && isPlaying) {
        onToggle(null);
      }
    });
    return () => sub?.remove?.();
  }, [player, isPlaying, onToggle]);

  return (
    <TouchableOpacity style={styles.playButton} onPress={handlePress}>
      {isPlaying ? (
        <Square color="#EF4444" size={20} />
      ) : (
        <Play color="#10B981" size={20} />
      )}
    </TouchableOpacity>
  );
};

export const ProfileScreen = () => {
  const { user, updateProfile, logout, deleteAccount } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificationSound, setNotificationSound] = useState(user?.notificationSound || 'default');
  const [minNotificationPriority, setMinNotificationPriority] = useState(user?.minNotificationPriority || 'all');
  const [loading, setLoading] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState(null);

  const handleTogglePlay = useCallback((soundId) => {
    setPlayingSoundId(soundId);
  }, []);

  const handleUpdate = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    
    setLoading(true);
    const result = await updateProfile(name, email, notificationSound, minNotificationPriority);
    setLoading(false);
    
    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your Name"
        placeholderTextColor="#94A3B8"
      />
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Your Email"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Survey Notification Priority</Text>
      <Text style={styles.subLabel}>Choose which surveys trigger push notifications</Text>
      <View style={styles.prioritySelectorContainer}>
        {PRIORITY_OPTIONS.map((opt) => {
          const isSelected = minNotificationPriority === opt.id;
          const OptionIcon = opt.Icon;
          return (
            <TouchableOpacity 
              key={opt.id} 
              style={[styles.priorityOption, isSelected && styles.priorityOptionSelected]} 
              onPress={() => setMinNotificationPriority(opt.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.priorityIconCircle, { backgroundColor: `${opt.color}20` }]}>
                <OptionIcon color={opt.color} size={18} />
              </View>

              <View style={styles.priorityTextContainer}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.priorityTitle, isSelected && styles.priorityTitleSelected]}>
                    {opt.title}
                  </Text>
                  <View style={[styles.priorityBadge, { backgroundColor: `${opt.color}25` }]}>
                    <Text style={[styles.priorityBadgeText, { color: opt.color }]}>
                      {opt.badge}
                    </Text>
                  </View>
                </View>
                <Text style={styles.priorityDesc}>{opt.description}</Text>
              </View>

              <View style={[
                styles.radioCircle,
                isSelected && { borderColor: opt.color, backgroundColor: opt.color }
              ]}>
                {isSelected && <Check color="#FFF" size={12} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Notification Sound</Text>
      <View style={styles.soundSelectorContainer}>
        {SOUND_OPTIONS.map((opt) => (
          <View key={opt.id} style={styles.soundRow}>
            <TouchableOpacity 
              style={[styles.soundOption, notificationSound === opt.id && styles.soundOptionSelected]} 
              onPress={() => setNotificationSound(opt.id)}
            >
              <Text style={[styles.soundOptionText, notificationSound === opt.id && styles.soundOptionTextSelected]}>
                {opt.name}
              </Text>
            </TouchableOpacity>
            
            <SoundPreviewButton 
              soundId={opt.id} 
              isPlaying={playingSoundId === opt.id} 
              onToggle={handleTogglePlay} 
            />
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.updateButton} 
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Save color="#FFF" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut color="#FFF" size={20} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Trash2 color="#EF4444" size={20} style={{ marginRight: 8 }} />
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  subLabel: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 8,
  },
  prioritySelectorContainer: {
    marginBottom: 8,
  },
  priorityOption: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  priorityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priorityTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  priorityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  priorityTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  priorityTitleSelected: {
    color: '#FFF',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  priorityDesc: {
    color: '#64748B',
    fontSize: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#FFF',
    padding: 16,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 32,
  },
  logoutButton: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  soundSelectorContainer: {
    marginTop: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  soundOption: {
    flex: 1,
    padding: 16,
  },
  soundOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  soundOptionText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  soundOptionTextSelected: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  playButton: {
    padding: 16,
  }
});

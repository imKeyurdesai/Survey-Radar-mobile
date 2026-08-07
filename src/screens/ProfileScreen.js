import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trash2, Save, Play, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';

export const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout, deleteAccount } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificationSound, setNotificationSound] = useState(user?.notificationSound || 'default');
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState();
  const [playingSoundId, setPlayingSoundId] = useState(null);

  const SOUND_OPTIONS = [
    { id: 'default', name: 'Default Sound' },
    { id: 'discord_notification_prank.mp3', name: 'Discord Prank' },
    { id: 'fahhhhhhhhhhhhhh.mp3', name: 'Fahhhhhhhhhhhhhh' },
    { id: 'kar98k.mp3', name: 'Kar98k' },
    { id: 'notification_alert.mp3', name: 'Standard Alert' },
    { id: 'samsung_notification_sound_earrape.mp3', name: 'Samsung Ear-rape' }
  ];

  // Helper map to require local assets dynamically
  const getAudioSource = (id) => {
    switch(id) {
      case 'discord_notification_prank.mp3': return require('../../assets/audio/discord_notification_prank.mp3');
      case 'fahhhhhhhhhhhhhh.mp3': return require('../../assets/audio/fahhhhhhhhhhhhhh.mp3');
      case 'kar98k.mp3': return require('../../assets/audio/kar98k.mp3');
      case 'notification_alert.mp3': return require('../../assets/audio/notification_alert.mp3');
      case 'samsung_notification_sound_earrape.mp3': return require('../../assets/audio/samsung_notification_sound_earrape.mp3');
      default: return null;
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playPreview = async (soundId) => {
    if (playingSoundId === soundId) {
      if (sound) await sound.stopAsync();
      setPlayingSoundId(null);
      return;
    }

    if (sound) {
      await sound.unloadAsync();
    }

    if (soundId === 'default') {
      Alert.alert('Default Sound', 'The default sound depends on your phone settings and cannot be previewed.');
      return;
    }

    const source = getAudioSource(soundId);
    if (source) {
      const { sound: newSound } = await Audio.Sound.createAsync(source);
      setSound(newSound);
      setPlayingSoundId(soundId);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingSoundId(null);
        }
      });
    }
  };

  const handleUpdate = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    
    setLoading(true);
    const result = await updateProfile(name, email, notificationSound);
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
            
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={() => playPreview(opt.id)}
            >
              {playingSoundId === opt.id ? (
                <Square color="#EF4444" size={20} />
              ) : (
                <Play color="#10B981" size={20} />
              )}
            </TouchableOpacity>
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

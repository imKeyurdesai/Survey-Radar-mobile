import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import api from '../services/api';
import { Activity, Database, Users, Clock } from 'lucide-react-native';

export const DashboardScreen = ({ route }) => {
  const { projectId } = route.params;
  const [workers, setWorkers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [workersRes, surveysRes] = await Promise.all([
        api.get(`/workers/status/${projectId}`),
        api.get(`/surveys/recent/${projectId}`)
      ]);
      setWorkers(workersRes.data.data);
      setSurveys(surveysRes.data.data);
    } catch (err) {
      console.log('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const onlineWorkers = workers.filter(w => w.status === 'online').length;

  const getRelativeTime = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const getBorderColor = (rewardStr, timeStr) => {
    if (!rewardStr || !timeStr) return 'rgba(255,255,255,0.05)';
    
    let rewardValue = 0;
    const rewardMatch = rewardStr.match(/[\d.]+/);
    if (rewardMatch) rewardValue = parseFloat(rewardMatch[0]);
    
    let cents = 0;
    if (rewardStr.includes('$') || rewardStr.includes('£') || rewardStr.includes('€') || rewardStr.includes('.')) {
      cents = rewardValue * 100;
    } else {
      cents = rewardValue;
    }
    
    const timeMatch = timeStr.match(/\d+/);
    if (!timeMatch) return 'rgba(255,255,255,0.05)';
    const minutes = parseInt(timeMatch[0], 10);
    
    if (minutes === 0) return 'rgba(255,255,255,0.05)';
    
    const ratio = cents / minutes;
    
    if (ratio > 2.5) {
      return '#EF4444'; // Red
    } else if (ratio >= 1.5) {
      return '#EAB308'; // Yellow
    } else {
      return 'rgba(255,255,255,0.05)'; // Default
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
    >
      <View style={styles.statsGrid}>
        <StatCard title="Online" value={onlineWorkers} total={`/ ${workers.length}`} icon={<Activity color="#10B981" size={24} />} />
        <StatCard title="Surveys" value={surveys.length} icon={<Database color="#3B82F6" size={24} />} />
        <StatCard title="Members" value="--" icon={<Users color="#8B5CF6" size={24} />} />
        <StatCard title="Uptime" value="99%" icon={<Clock color="#10B981" size={24} />} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Worker Status</Text>
        {workers.length === 0 ? (
          <Text style={styles.emptyText}>No active workers</Text>
        ) : (
          workers.map(worker => (
            <View key={worker.workerId} style={styles.workerCard}>
              <View>
                <Text style={styles.workerId}>Worker: {worker.workerId.substring(0, 8)}</Text>
                <Text style={styles.workerMeta}>{worker.browser} {worker.version}</Text>
              </View>
              <View style={[styles.statusBadge, worker.status === 'online' ? styles.statusOnline : styles.statusOffline]}>
                <Text style={[styles.statusText, worker.status === 'online' ? styles.textOnline : styles.textOffline]}>
                  {worker.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Surveys</Text>
        {surveys.length === 0 ? (
          <Text style={styles.emptyText}>No surveys detected yet</Text>
        ) : (
          surveys.map(survey => (
            <TouchableOpacity 
              key={survey._id} 
              style={[styles.surveyCard, { borderColor: getBorderColor(survey.reward, survey.estimatedTime) }]}
              onPress={() => Linking.openURL('https://attapoll.app/').catch(() => console.log('Could not open AttaPoll'))}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyMeta}>{survey.provider} • {survey.estimatedTime}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.surveyReward}>{survey.reward}</Text>
                <Text style={styles.surveyTime}>{getRelativeTime(survey.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const StatCard = ({ title, value, total, icon }) => (
  <View style={styles.statCard}>
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>
      {value} <Text style={styles.statTotal}>{total}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '50%',
    padding: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTotal: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'normal',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: 20,
  },
  workerCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerId: {
    color: '#FFF',
    fontWeight: '600',
  },
  workerMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  textOnline: {
    color: '#10B981',
  },
  textOffline: {
    color: '#EF4444',
  },
  surveyCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  surveyTitle: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  surveyMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  surveyReward: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  surveyTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  }
});

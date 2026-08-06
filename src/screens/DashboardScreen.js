import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { Activity, Database, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react-native';

const RainbowName = ({ name, textStyle }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true, // we can use native driver for transform!
      })
    ).start();
  }, [animatedValue]);

  const rotateInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{
      borderRadius: 10,
      overflow: 'hidden',
      padding: 3, // Border size
      alignSelf: 'flex-start',
      marginBottom: 4,
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 5
    }}>
      <Animated.View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        transform: [
          { scale: 5 }, // Scale up to cover corners during rotation
          { rotate: rotateInterpolate }
        ]
      }}>
        <LinearGradient
          colors={['rgb(72, 147, 226)', 'rgb(58, 234, 61)', 'rgb(226, 118, 118)', 'rgb(72, 147, 226)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <View style={{
        backgroundColor: '#4c4c4c',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}>
        <Text style={[textStyle, { color: '#FFFFFF', padding: 5, marginBottom: 0, fontWeight: '900', textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 }]}>{name} 👑</Text>
      </View>
    </View>
  );
};

export const DashboardScreen = ({ route }) => {
  const { projectId } = route.params;
  const [workers, setWorkers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isWorkersExpanded, setIsWorkersExpanded] = useState(false);

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

  const hasMultipleWorkers = workers.length > 1;

  const getDisplayedWorkers = () => {
    if (isWorkersExpanded) {
      return workers;
    }
    const onlineWorkersList = workers.filter(w => w.status === 'online');
    if (onlineWorkersList.length > 0) {
      return [onlineWorkersList[0]];
    }
    return workers.length > 0 ? [workers[0]] : [];
  };

  const renderWorkerName = (worker) => {
    const defaultName = `Worker: ${worker.workerId.substring(0, 8)}`;
    const displayName = worker.name || defaultName;

    if (displayName.startsWith('*') && displayName.endsWith('*') && displayName.length > 2) {
      const cleanName = displayName.substring(1, displayName.length - 1);
      return <RainbowName name={cleanName} textStyle={styles.workerId} />;
    }

    return <Text style={styles.workerId}>{displayName}</Text>;
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
        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() => hasMultipleWorkers && setIsWorkersExpanded(!isWorkersExpanded)}
          disabled={!hasMultipleWorkers}
        >
          <Text style={styles.sectionTitle}>Worker Status</Text>
          {hasMultipleWorkers && (
            <View style={styles.expandIconContainer}>
              {isWorkersExpanded ? <ChevronUp color="#94A3B8" size={20} /> : <ChevronDown color="#94A3B8" size={20} />}
            </View>
          )}
        </TouchableOpacity>

        {workers.length === 0 ? (
          <Text style={styles.emptyText}>No active workers</Text>
        ) : (
          getDisplayedWorkers().map(worker => (
            <View key={worker.workerId} style={styles.workerCard}>
              <View>
                {renderWorkerName(worker)}
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
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  expandIconContainer: {
    padding: 4,
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

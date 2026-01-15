import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { getUserReports, deleteReport, Report } from '../../lib/reports';
import { supabase } from '../../lib/supabase';

interface MyReportsProps {
  onLoadReport: (report: Report) => void;
  onNewReport: () => void;
  currentReportId: string | null;
}

export default function MyReportsTab(props: MyReportsProps) {
  const { onLoadReport, onNewReport, currentReportId } = props;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const { data, error } = await getUserReports();

    if (error) {
      console.error('Failed to load reports:', error);
      Alert.alert('Error', 'Failed to load your reports');
    } else if (data) {
      setReports(data);
    }

    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }

  async function handleDelete(reportId: string) {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteReport(reportId);

            if (error) {
              Alert.alert('Error', 'Failed to delete report');
            } else {
              // Remove from list
              setReports(reports.filter((r) => r.id !== reportId));
              Alert.alert('Success', 'Report deleted');
            }
          },
        },
      ]
    );
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>
          View and manage your saved site assessment reports
        </Text>
      </View>

      <Pressable style={styles.newReportButton} onPress={onNewReport}>
        <Text style={styles.newReportButtonText}>+ Create New Report</Text>
      </Pressable>

      <Pressable style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
        <Text style={styles.refreshButtonText}>
          {refreshing ? 'Refreshing...' : '↻ Refresh List'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.signOutButton}
        onPress={async () => {
          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await supabase.auth.signOut();
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </Pressable>

      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first site assessment report to get started
          </Text>
        </View>
      ) : (
        <View style={styles.reportsList}>
          {reports.map((report) => (
            <View
              key={report.id}
              style={[
                styles.reportCard,
                currentReportId === report.id && styles.currentReportCard,
              ]}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportTitleRow}>
                  <Text style={styles.reportTitle}>
                    {report.site_name || 'Untitled Report'}
                  </Text>
                  {currentReportId === report.id && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <View style={styles.reportMeta}>
                  <Text style={styles.statusBadge}>
                    {report.status === 'draft' ? '📝 Draft' : '✅ Completed'}
                  </Text>
                  <Text style={styles.reportDate}>
                    Updated: {formatDate(report.updated_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.reportActions}>
                <Pressable
                  style={[styles.actionButton, styles.loadButton]}
                  onPress={() => onLoadReport(report)}
                  disabled={currentReportId === report.id}
                >
                  <Text style={styles.loadButtonText}>
                    {currentReportId === report.id ? 'Currently Loaded' : 'Load Report'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(report.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  newReportButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  newReportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  signOutButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  reportsList: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentReportCard: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  reportHeader: {
    marginBottom: 16,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    fontSize: 14,
    color: '#666',
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadButton: {
    backgroundColor: '#4A90E2',
  },
  loadButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  deleteButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
});

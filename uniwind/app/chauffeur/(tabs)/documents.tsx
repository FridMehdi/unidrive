import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { missionApi, chauffeurProfileApi, type Mission } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Constants ─────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_HEADER = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const STATUT_COLOR: Record<string, string> = {
  planifiée: '#6366f1',
  acceptée:  '#3b82f6',
  en_cours:  '#f59e0b',
  terminée:  '#22c55e',
  validée:   '#22c55e',
  facturée:  '#22c55e',
  annulée:   '#ef4444',
};

const STATUT_LABEL: Record<string, string> = {
  planifiée: 'Planifiée',
  acceptée:  'Acceptée',
  en_cours:  'En cours',
  terminée:  'Terminée',
  validée:   'Validée',
  facturée:  'Facturée',
  annulée:   'Annulée',
};

type ViewMode = 'year' | 'month' | 'day' | 'list';

// ── Helpers ───────────────────────────────────────────────────────────────────
function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function buildCalendarGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toYMD(new Date(year, month, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function buildYearGrid(year: number): number[][] {
  return [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11]
  ];
}

// ── Mini Month Calendar Component ────────────────────────────────────────────
interface MiniMonthProps {
  year: number;
  month: number;
  hasEventOnDate?: (date: string) => boolean;
  isCurrentMonth?: boolean;
  onMonthPress?: () => void;
}

const MiniMonthCalendar: React.FC<MiniMonthProps> = ({ 
  year, 
  month, 
  hasEventOnDate,
  isCurrentMonth,
  onMonthPress 
}) => {
  const colors = useThemeColors();
  const rows = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const today = toYMD(new Date());
  
  return (
    <TouchableOpacity 
      onPress={onMonthPress}
      activeOpacity={0.7}
      style={{
        padding: 8,
      }}
    >
      <ThemedText style={{
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: isCurrentMonth ? colors.highlight : colors.text,
      }}>
        {MONTHS_SHORT[month]}
      </ThemedText>
      
      {/* Day headers */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DAYS_HEADER.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText style={{
              fontSize: 8,
              color: colors.subtext,
              opacity: 0.6,
              fontWeight: '600',
            }}>
              {d}
            </ThemedText>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', marginBottom: 3, gap: 2 }}>
          {row.map((cell, ci) => {
            if (!cell) return <View key={ci} style={{ flex: 1 }} />;
            const dayNum = parseYMD(cell).getDate();
            const hasEvent = hasEventOnDate?.(cell);
            const isTod = cell === today;
            
            return (
              <View key={ci} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isTod ? colors.highlight : 'transparent',
                  paddingHorizontal: 2,
                }}>
                  <ThemedText style={{
                    fontSize: 11,
                    fontWeight: isTod ? '700' : '400',
                    color: isTod ? '#fff' : colors.text,
                  }}>
                    {dayNum}
                  </ThemedText>
                </View>
                {hasEvent && !isTod && (
                  <View style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: colors.highlight,
                    position: 'absolute',
                    bottom: 0,
                  }} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Agenda() {
  const colors = useThemeColors();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const today = toYMD(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState(today);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chauffeurId, setChauffeurId] = useState<string | null>(null);

  // Ref pour le scroll de la vue jour
  const dayScrollViewRef = useRef<ScrollView>(null);

  const ensureChauffeur = useCallback(async () => {
    if (chauffeurId || !token) return chauffeurId;
    try {
      const profile = await chauffeurProfileApi.me(token);
      setChauffeurId(profile.id);
      return profile.id;
    } catch { return null; }
  }, [chauffeurId, token]);

  const fetchMissions = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const cid = await ensureChauffeur();
      if (!cid) return;
      
      // Fetch a wider range for different views
      const from = toYMD(new Date(viewYear, 0, 1));
      const to = toYMD(new Date(viewYear, 11, 31));
      const { data } = await missionApi.listByChauffeur(cid, token, { from, to, limit: 500 });
      setMissions(data ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, ensureChauffeur, viewYear]);

  useFocusEffect(useCallback(() => { fetchMissions(); }, [fetchMissions]));

  const missionsByDate = useMemo(() => {
    const map: Record<string, Mission[]> = {};
    for (const m of missions) {
      const d = m.date_depart.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(m);
    }
    return map;
  }, [missions]);

  const dayMissions = useMemo(
    () => (missionsByDate[selected] ?? []).sort(
      (a, b) => new Date(a.date_depart).getTime() - new Date(b.date_depart).getTime(),
    ),
    [missionsByDate, selected],
  );

  const hasEventOnDate = useCallback((date: string) => {
    return !!missionsByDate[date]?.length;
  }, [missionsByDate]);

  // Navigation handlers
  const goToYearView = () => setViewMode('year');
  const goToMonthView = (month?: number) => {
    if (month !== undefined) setViewMonth(month);
    setViewMode('month');
  };
  const goToDayView = (date?: string) => {
    if (date) setSelected(date);
    setViewMode('day');
  };
  const goToListView = () => setViewMode('list');

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const prevYear = () => setViewYear(y => y - 1);
  const nextYear = () => setViewYear(y => y + 1);
  
  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelected(today);
    setViewMode('day');
  };

  const rows = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const yearGrid = useMemo(() => buildYearGrid(viewYear), [viewYear]);

  // Group missions by date for list view
  const groupedMissions = useMemo(() => {
    const groups: { date: string; missions: Mission[] }[] = [];
    const dates = Object.keys(missionsByDate).sort();
    
    for (const date of dates) {
      const dateMissions = missionsByDate[date].sort(
        (a, b) => new Date(a.date_depart).getTime() - new Date(b.date_depart).getTime()
      );
      groups.push({ date, missions: dateMissions });
    }
    return groups;
  }, [missionsByDate]);

  // Auto-scroll to current hour when entering day view
  React.useEffect(() => {
    if (viewMode === 'day' && selected === today) {
      const currentHour = new Date().getHours();
      setTimeout(() => {
        dayScrollViewRef.current?.scrollTo({ y: currentHour * 60, animated: true });
      }, 300);
    }
  }, [viewMode, selected, today]);

  // ── Render: Top Bar ─────────────────────────────────────────────────────────
  const renderTopBar = () => (
    <View style={{
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: insets.top,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        {/* Left: Title or Back */}
        <TouchableOpacity
          onPress={() => {
            if (viewMode === 'day') goToMonthView();
            else if (viewMode === 'month') goToYearView();
            else if (viewMode === 'list') goToMonthView();
          }}
          disabled={viewMode === 'year'}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          {(viewMode === 'day' ||viewMode === 'month' || viewMode === 'list') && (
            <Icon name="ChevronLeft" size={20} color={colors.highlight} />
          )}
          <ThemedText style={{
            fontSize: viewMode === 'year' ? 28 : 22,
            fontWeight: '700',
            color: viewMode === 'year' ? colors.text : colors.highlight,
          }}>
            {viewMode === 'year' && viewYear}
            {viewMode === 'month' && MONTHS_FR[viewMonth]}
            {viewMode === 'day' && parseYMD(selected).getDate()}
            {viewMode === 'list' && MONTHS_FR[viewMonth]}
          </ThemedText>
        </TouchableOpacity>

        {/* Right: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={goToday}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: `${colors.highlight}15`,
            }}
          >
            <ThemedText style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.highlight,
            }}>
              Aujourd'hui
            </ThemedText>
          </TouchableOpacity>

          {/* View mode toggle */}
          <TouchableOpacity
            onPress={() => {
              if (viewMode === 'list') goToMonthView();
              else goToListView();
            }}
            activeOpacity={0.7}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: viewMode === 'list' ? `${colors.highlight}15` : 'transparent',
            }}
          >
            <Icon
              name={viewMode === 'list' ?'Calendar' : 'List'}
              size={20}
              color={colors.highlight}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation arrows for month/year view */}
      {(viewMode === 'month' || viewMode === 'year') && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}>
          <ThemedText style={{ fontSize: 16, color: colors.subtext }}>
            {viewMode === 'month' && viewYear}
            {viewMode === 'year' && ' '}
          </ThemedText>
          
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity
              onPress={viewMode === 'year' ? prevYear : prevMonth}
              style={{ padding: 8 }}
              activeOpacity={0.7}
            >
              <Icon name="ChevronLeft" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={viewMode === 'year' ? nextYear : nextMonth}
              style={{ padding: 8 }}
              activeOpacity={0.7}
            >
              <Icon name="ChevronRight" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // ── Render: Year View ───────────────────────────────────────────────────────
  const renderYearView = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {yearGrid.map((monthRow, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 10, gap: 8 }}>
          {monthRow.map((month) => (
            <View key={month} style={{ flex: 1 }}>
              <MiniMonthCalendar
                year={viewYear}
                month={month}
                hasEventOnDate={hasEventOnDate}
                isCurrentMonth={
                  viewYear === new Date().getFullYear() &&
                  month === new Date().getMonth()
                }
                onMonthPress={() => goToMonthView(month)}
              />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  // ── Render: Month View ──────────────────────────────────────────────────────
  const renderMonthView = () => (
    <View style={{ flex: 1 }}>
      {/* Day headers */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        {DAYS_HEADER.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText style={{
              fontSize: 11,
              fontWeight: '600',
              color: i >= 5 ? colors.subtext + '90' : colors.subtext,
            }}>
              {d}
            </ThemedText>
          </View>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 10, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
            {row.map((cell, ci) => {
              if (!cell) return <View key={ci} style={{ flex: 1 }} />;
              
              const dayNum = parseYMD(cell).getDate();
              const isSel = cell === selected;
              const isTod = cell === today;
              const dayMissionsCount = (missionsByDate[cell] || []).length;
              
              return (
                <TouchableOpacity
                  key={ci}
                  onPress={() => goToDayView(cell)}
                  style={{
                    flex: 1,
                    aspectRatio: 0.8,
                    margin: 2,
                    borderRadius: 10,
                    backgroundColor: isSel ? colors.highlight : colors.secondary,
                    borderWidth: isTod && !isSel ? 2 : 0,
                    borderColor: colors.highlight,
                    padding: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{
                    fontSize: 16,
                    fontWeight: isSel || isTod ? '700' : '500',
                    color: isSel ? '#fff' : isTod ? colors.highlight : colors.text,
                    marginBottom: 4,
                  }}>
                    {dayNum}
                  </ThemedText>
                  
                  {dayMissionsCount > 0 && (
                    <View style={{
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      borderRadius: 6,
                      backgroundColor: isSel ? '#fff' : `${colors.highlight}20`,
                      alignSelf: 'flex-start',
                    }}>
                      <ThemedText style={{
                        fontSize: 9,
                        fontWeight: '700',
                        color: isSel ? colors.highlight : colors.highlight,
                      }}>
                        {dayMissionsCount}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // ── Render: Day View (Timeline) ─────────────────────────────────────────────
  const renderDayView = () => {
    const selectedDate = parseYMD(selected);

    return (
      <View style={{ flex: 1 }}>
        {/* Date info bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.secondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <View>
            <ThemedText style={{
              fontSize: 11,
              color: colors.subtext,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              {DAYS_FULL[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}
            </ThemedText>
            <ThemedText style={{
              fontSize: 17,
              fontWeight: '600',
            }}>
              {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </ThemedText>
          </View>
          
          <ThemedText style={{
            fontSize: 14,
            fontWeight: '600',
            color: dayMissions.length > 0 ? colors.highlight : colors.subtext,
          }}>
            {dayMissions.length} {dayMissions.length > 1 ? 'missions' : 'mission'}
          </ThemedText>
        </View>

        <ScrollView
          ref={dayScrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMissions(true); }}
              tintColor={colors.highlight}
            />
          }
        >
          {HOURS.map((hour, hourIndex) => {
            const currentHour = new Date().getHours();
            const isCurrentHour = selected === today && hourIndex === currentHour;
            const hourMissions = dayMissions.filter(m => {
              const missionHour = new Date(m.date_depart).getHours();
              return missionHour === hourIndex;
            });

            return (
              <View key={hour} style={{ flexDirection: 'row', minHeight: 60 }}>
                {/* Time label */}
                <View style={{
                  width: 60,
                  paddingTop: 4,
                  paddingRight: 12,
                  alignItems: 'flex-end',
                }}>
                  <ThemedText style={{
                    fontSize: 11,
                    color: isCurrentHour ? colors.highlight : colors.subtext,
                    fontWeight: isCurrentHour ? '700' : '400',
                  }}>
                    {hour}
                  </ThemedText>
                </View>

                {/* Timeline and events */}
                <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: colors.border }}>
                  {isCurrentHour && (
                    <View
                      style={{
                        position: 'absolute',
                        top: (new Date().getMinutes() / 60) * 60,
                        left: -4,
                        right: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        zIndex: 10,
                      }}
                    >
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.highlight,
                      }} />
                      <View style={{
                        flex: 1,
                        height: 2,
                        backgroundColor: colors.highlight,
                      }} />
                    </View>
                  )}

                  <View style={{ paddingLeft: 12, paddingRight: 16, paddingVertical: 4 }}>
                    {hourMissions.map((m) => {
                      const couleur = STATUT_COLOR[m.statut] ?? '#6366f1';
                      const prix = m.prix_achat_chauffeur ?? m.montant;
                      
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${m.id}` as any)}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: `${couleur}15`,
                            borderLeftWidth: 3,
                            borderLeftColor: couleur,
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 6,
                          }}
                        >
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}>
                            <ThemedText style={{
                              fontSize: 13,
                              fontWeight: '700',
                              color: couleur,
                            }}>
                              {formatHeure(m.date_depart)}
                              {m.date_arrivee_prevue && ` - ${formatHeure(m.date_arrivee_prevue)}`}
                            </ThemedText>
                            <View style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: `${couleur}25`,
                            }}>
                              <ThemedText style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: couleur,
                              }}>
                                {STATUT_LABEL[m.statut]}
                              </ThemedText>
                            </View>
                          </View>

                          <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                            {m.numero || 'Mission'}
                          </ThemedText>

                          <View style={{ gap: 2 }}>
                            {m.adresse_depart && (
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                                <Icon name="MapPin" size={12} color={colors.subtext} style={{ marginTop: 2 }} />
                                <ThemedText style={{ fontSize: 12, color: colors.subtext, flex: 1 }}>
                                  {m.adresse_depart}
                                </ThemedText>
                              </View>
                            )}
                            {prix != null && (
                              <ThemedText style={{ fontSize: 13, fontWeight: '600', color: colors.highlight }}>
                                {Number(prix).toFixed(2)} €
                              </ThemedText>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ── Render: List View ───────────────────────────────────────────────────────
  const renderListView = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchMissions(true); }}
          tintColor={colors.highlight}
        />
      }
    >
      {loading ? (
        <View style={{ alignItems: 'center', paddingTop: 50 }}>
          <ActivityIndicator color={colors.highlight} size="large" />
        </View>
      ) : groupedMissions.length === 0 ? (
        <View style={{
          alignItems: 'center',
          padding: 40,
          margin: 16,
          backgroundColor: colors.secondary,
          borderRadius: 20,
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${colors.highlight}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Icon name="CalendarOff" size={32} color={colors.subtext} />
          </View>
          <ThemedText style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
            Aucune mission
          </ThemedText>
          <ThemedText style={{ color: colors.subtext, textAlign: 'center' }}>
            Pas de mission planifiée pour cette période
          </ThemedText>
        </View>
      ) : (
        <View>
          {groupedMissions.map(({ date, missions }) => {
            const dateObj = parseYMD(date);
            const isToday = date === today;
            
            return (
              <View key={date} style={{ marginBottom: 20 }}>
                {/* Date header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}>
                  <View>
                    <ThemedText style={{
                      fontSize: 11,
                      color: colors.subtext,
                      textTransform: 'uppercase',
                    }}>
                      {DAYS_FULL[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]}
                    </ThemedText>
                    <ThemedText style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: isToday ? colors.highlight : colors.text,
                    }}>
                      {dateObj.getDate()} {MONTHS_SHORT[dateObj.getMonth()]}
                    </ThemedText>
                  </View>
                  {isToday && (
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor: `${colors.highlight}20`,
                    }}>
                      <ThemedText style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.highlight,
                      }}>
                        AUJOURD'HUI
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Missions for this date */}
                <View style={{ paddingHorizontal: 16, gap: 10 }}>
                  {missions.map((m) => {
                    const couleur = STATUT_COLOR[m.statut] ?? '#6366f1';
                    const prix = m.prix_achat_chauffeur ?? m.montant;
                    
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${m.id}` as any)}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: colors.secondary,
                          borderRadius: 16,
                          padding: 14,
                          flexDirection: 'row',
                          gap: 12,
                          borderLeftWidth: 3,
                          borderLeftColor: couleur,
                          shadowColor: '#000',
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}
                      >
                        {/* Time */}
                        <View style={{ width: 46, alignItems: 'center', gap: 2, paddingTop: 2 }}>
                          <ThemedText style={{ fontSize: 13, fontWeight: '700', color: couleur }}>
                            {formatHeure(m.date_depart)}
                          </ThemedText>
                          {m.date_arrivee_prevue && (
                            <ThemedText style={{ fontSize: 11, color: colors.subtext }}>
                              {formatHeure(m.date_arrivee_prevue)}
                            </ThemedText>
                          )}
                        </View>

                        {/* Separator */}
                        <View style={{
                          width: 1,
                          backgroundColor: `${couleur}30`,
                          marginVertical: 2,
                        }} />

                        {/* Content */}
                        <View style={{ flex: 1, gap: 6 }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <ThemedText style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: couleur,
                            }}>
                              {m.numero}
                            </ThemedText>
                            <View style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 10,
                              backgroundColor: `${couleur}20`,
                            }}>
                              <ThemedText style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: couleur,
                              }}>
                                {STATUT_LABEL[m.statut]}
                              </ThemedText>
                            </View>
                          </View>

                          {m.adresse_depart && (
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                              <Icon name="MapPin" size={13} color={colors.subtext} style={{ marginTop: 2 }} />
                              <ThemedText
                                style={{ fontSize: 13, color: colors.subtext, flex: 1 }}
                                numberOfLines={2}
                              >
                                {m.adresse_depart}
                              </ThemedText>
                            </View>
                          )}

                          {prix != null && (
                            <ThemedText style={{
                              fontSize: 14,
                              fontWeight: '700',
                              color: colors.highlight,
                            }}>
                              {Number(prix).toFixed(2)} €
                            </ThemedText>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  // ── Main Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {renderTopBar()}
      
      {viewMode === 'year' && renderYearView()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'list' && renderListView()}
    </View>
  );
}

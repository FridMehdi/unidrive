import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Animated, Dimensions,
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
        padding: 10,
        borderRadius: 12,
        backgroundColor: isCurrentMonth ? `${colors.highlight}10` : 'transparent',
      }}
    >
      <ThemedText style={{
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        color: isCurrentMonth ? colors.highlight : colors.text,
      }}>
        {MONTHS_SHORT[month]}
      </ThemedText>
      
      {/* Day headers */}
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        {DAYS_HEADER.map((d, i) => (
          <View key={i} style={{ width: 18, alignItems: 'center' }}>
            <ThemedText style={{
              fontSize: 8,
              color: colors.subtext,
              opacity: 0.5,
            }}>
              {d}
            </ThemedText>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row' }}>
          {row.map((cell, ci) => {
            if (!cell) return <View key={ci} style={{ width: 18 }} />;
            const dayNum = parseYMD(cell).getDate();
            const hasEvent = hasEventOnDate?.(cell);
            const isTod = cell === today;
            
            return (
              <View key={ci} style={{ width: 18, alignItems: 'center', paddingVertical: 1 }}>
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isTod ? colors.highlight : 'transparent',
                }}>
                  <ThemedText style={{
                    fontSize: 9,
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
                    borderRadius: 2,
                    backgroundColor: colors.highlight,
                    marginTop: -2,
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

  const scrollY = useRef(new Animated.Value(0)).current;

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>

      {/* ── Mini calendar ────────────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: colors.secondary,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        paddingBottom: 10,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      }}>

        {/* Month nav */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <ThemedText style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
              {MONTHS_FR[viewMonth]}
            </ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: '300', color: colors.subtext }}>
              {viewYear}
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <TouchableOpacity
              onPress={goToday}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
                borderWidth: 1, borderColor: colors.border, marginRight: 6,
              }}
            >
              <ThemedText style={{ fontSize: 12, fontWeight: '600', color: colors.highlight }}>
                Aujourd'hui
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={prevMonth} style={{ padding: 7, borderRadius: 18 }} activeOpacity={0.7}>
              <Icon name="ChevronLeft" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 7, borderRadius: 18 }} activeOpacity={0.7}>
              <Icon name="ChevronRight" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day headers */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 2 }}>
          {DAYS_HEADER.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText style={{
                fontSize: 11, fontWeight: '600', letterSpacing: 0.8,
                color: i >= 5 ? colors.subtext + '90' : colors.subtext,
              }}>
                {d}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Grid */}
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
            {row.map((cell, ci) => {
              if (!cell) return <View key={ci} style={{ flex: 1 }} />;
              const dayNum  = parseYMD(cell).getDate();
              const isSel   = cell === selected;
              const isTod   = cell === today;
              const dot     = !!missionsByDate[cell]?.length;
              return (
                <TouchableOpacity
                  key={ci}
                  onPress={() => setSelected(cell)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 1 }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 34, height: 34, borderRadius: 17,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSel ? colors.highlight : 'transparent',
                    borderWidth: isTod && !isSel ? 1.5 : 0,
                    borderColor: colors.highlight,
                  }}>
                    <ThemedText style={{
                      fontSize: 15,
                      fontWeight: isSel || isTod ? '700' : '400',
                      color: isSel ? '#fff' : isTod ? colors.highlight : colors.text,
                    }}>
                      {dayNum}
                    </ThemedText>
                  </View>
                  <View style={{ height: 6, alignItems: 'center', justifyContent: 'center' }}>
                    {dot && (
                      <View style={{
                        width: 5, height: 5, borderRadius: 3,
                        backgroundColor: isSel ? '#fff' : colors.highlight,
                        opacity: isSel ? 0.85 : 0.75,
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Day missions list ─────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchMissions(true); }}
            tintColor={colors.highlight}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Selected date label */}
        <ThemedText style={{
          fontSize: 13, fontWeight: '600', color: colors.subtext,
          marginBottom: 14, textTransform: 'capitalize',
        }}>
          {parseYMD(selected).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </ThemedText>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 50 }}>
            <ActivityIndicator color={colors.highlight} size="large" />
          </View>
        ) : dayMissions.length === 0 ? (
          <View style={{
            alignItems: 'center', padding: 36,
            backgroundColor: colors.secondary,
            borderRadius: 20,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28, marginBottom: 14,
              backgroundColor: `${colors.highlight}15`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="CalendarOff" size={26} color={colors.subtext} />
            </View>
            <ThemedText style={{ fontWeight: '600', fontSize: 15, marginBottom: 6 }}>
              Aucune mission
            </ThemedText>
            <ThemedText style={{ color: colors.subtext, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Pas de mission planifiée{'\n'}pour ce jour.
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {dayMissions.map((m) => {
              const couleur = STATUT_COLOR[m.statut] ?? '#6366f1';
              const prix = m.prix_achat_chauffeur ?? m.montant;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${m.id}` as any)}
                  activeOpacity={0.82}
                  style={{
                    backgroundColor: colors.secondary,
                    borderRadius: 18, padding: 14,
                    flexDirection: 'row', gap: 12,
                    borderLeftWidth: 3, borderLeftColor: couleur,
                    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 }, elevation: 3,
                  }}
                >
                  {/* Time */}
                  <View style={{ width: 46, alignItems: 'center', gap: 3, paddingTop: 2 }}>
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
                    width: 1, backgroundColor: `${couleur}30`, marginVertical: 3,
                    borderRadius: 1,
                  }} />

                  {/* Content */}
                  <View style={{ flex: 1, gap: 7 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 12, fontWeight: '700', color: couleur, letterSpacing: 0.4 }}>
                        {m.numero}
                      </ThemedText>
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 10,
                        backgroundColor: `${couleur}20`,
                      }}>
                        <ThemedText style={{ fontSize: 11, fontWeight: '600', color: couleur }}>
                          {STATUT_LABEL[m.statut] ?? m.statut}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Route */}
                    <View style={{ gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                        <ThemedText style={{ fontSize: 13, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                          {m.adresse_depart}
                        </ThemedText>
                      </View>
                      <View style={{ marginLeft: 3.5, width: 1.5, height: 10, backgroundColor: colors.border, borderRadius: 1 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#22c55e' }} />
                        <ThemedText style={{ fontSize: 13, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                          {m.adresse_arrivee}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Meta */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      {m.duree_minutes != null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Icon name="Timer" size={12} color={colors.subtext} />
                          <ThemedText style={{ fontSize: 11, color: colors.subtext }}>
                            {m.duree_minutes >= 60
                              ? `${Math.floor(m.duree_minutes / 60)}h${m.duree_minutes % 60 > 0 ? String(m.duree_minutes % 60).padStart(2, '0') : ''}`
                              : `${m.duree_minutes}min`}
                          </ThemedText>
                        </View>
                      )}
                      {m.distance_km != null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Icon name="Route" size={12} color={colors.subtext} />
                          <ThemedText style={{ fontSize: 11, color: colors.subtext }}>
                            {parseFloat(String(m.distance_km)).toFixed(1)} km
                          </ThemedText>
                        </View>
                      )}
                      {m.nombre_passagers != null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Icon name="Users" size={12} color={colors.subtext} />
                          <ThemedText style={{ fontSize: 11, color: colors.subtext }}>{m.nombre_passagers}</ThemedText>
                        </View>
                      )}
                      {prix != null && (
                        <ThemedText style={{
                          fontSize: 13, fontWeight: '700', color: '#f59e0b', marginLeft: 'auto',
                        }}>
                          {Number(prix).toFixed(2)} €
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  <Icon name="ChevronRight" size={16} color={colors.subtext} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

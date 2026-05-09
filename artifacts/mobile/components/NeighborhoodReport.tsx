import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMapContext, NeighborhoodReport as ReportType } from "@/context/MapContext";

const SHEET_HEIGHT = 420;

function ScoreCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[scoreStyles.card, { backgroundColor: bg, borderColor: color + "40" }]}>
      <Ionicons name={icon} size={18} color={color} style={{ marginBottom: 6 }} />
      <Text style={[scoreStyles.value, { color }]}>{value}</Text>
      <Text style={[scoreStyles.sub, { color }]}>{sub}</Text>
      <Text style={scoreStyles.label}>{label}</Text>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
    opacity: 0.85,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#8B9DC3",
    marginTop: 2,
  },
});

interface Props {
  report: ReportType | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function NeighborhoodReport({ report, isLoading, onRefresh }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isReportOpen, setIsReportOpen, setSelectedIncident } = useMapContext();

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT + 100)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT + 100,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setIsReportOpen(false));
  };

  useEffect(() => {
    if (isReportOpen) {
      setSelectedIncident(null);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT + 100);
    }
  }, [isReportOpen]);

  if (!isReportOpen) return null;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 4;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingBottom: bottomPad + 8,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Drag handle */}
      <View {...panResponder.panHandlers} style={styles.handleArea}>
        <View style={[styles.handle, { backgroundColor: colors.mutedForeground + "50" }]} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="location" size={16} color={colors.primary as string} />
            <Text style={[styles.neighborhood, { color: colors.foreground }]}>
              {report?.neighborhood ?? "Locating…"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={onRefresh}
              style={[styles.refreshBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary as string} />
              ) : (
                <>
                  <Ionicons name="refresh" size={13} color={colors.primary as string} />
                  <Text style={[styles.refreshText, { color: colors.primary as string }]}>
                    Update
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.mutedForeground as string} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoading && !report ? (
        <View style={styles.loadingBody}>
          <ActivityIndicator color={colors.primary as string} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground as string }]}>
            Analyzing your area…
          </Text>
        </View>
      ) : report ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          {/* Advisory banner */}
          {report.waterAdvisory && (
            <View style={[styles.advisoryBanner, { backgroundColor: "#FF453A20", borderColor: "#FF453A40" }]}>
              <Ionicons name="warning" size={14} color="#FF453A" />
              <Text style={[styles.advisoryText, { color: "#FF453A" }]}>
                {report.waterAdvisory} in effect for this area
              </Text>
            </View>
          )}

          {/* Score cards */}
          <View style={styles.cards}>
            <ScoreCard
              icon="shield"
              label="Crime"
              value={String(report.crimeCount)}
              sub={report.crimeLabel}
              color={report.crimeColor}
              bg={report.crimeColor + "18"}
            />
            <ScoreCard
              icon="water"
              label="Water"
              value={report.waterGrade}
              sub={report.waterLabel}
              color={report.waterColor}
              bg={report.waterColor + "18"}
            />
            <ScoreCard
              icon="chatbubble"
              label="311 Open"
              value={String(report.requests311Count)}
              sub={report.requests311Count === 1 ? "Request" : "Requests"}
              color={colors.requests311 as string}
              bg={(colors.requests311 as string) + "18"}
            />
          </View>

          {/* Top crime types */}
          {report.topCrimeTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground as string }]}>
                TOP CRIME TYPES THIS MONTH
              </Text>
              {report.topCrimeTypes.map((item, i) => (
                <View key={i} style={styles.crimeRow}>
                  <View style={[styles.crimeRank, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.crimeRankText, { color: colors.mutedForeground as string }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.crimeType, { color: colors.foreground }]}>
                    {item.title}
                  </Text>
                  <View style={[styles.crimeCount, { backgroundColor: (colors.crime as string) + "20" }]}>
                    <Text style={[styles.crimeCountText, { color: colors.crime as string }]}>
                      ×{item.count}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Permits */}
          {report.permitsCount > 0 && (
            <View style={[styles.infoRow, { borderColor: colors.border }]}>
              <Ionicons name="construct-outline" size={14} color={colors.permits as string} />
              <Text style={[styles.infoText, { color: colors.mutedForeground as string }]}>
                <Text style={{ color: colors.permits as string, fontFamily: "Inter_700Bold" }}>
                  {report.permitsCount}
                </Text>{" "}
                active building permits in your neighborhood
              </Text>
            </View>
          )}

          <Text style={[styles.lastUpdated, { color: colors.mutedForeground as string }]}>
            Data is pulled on demand · No storage used
          </Text>
        </ScrollView>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 18,
    maxHeight: "75%",
  },
  handleArea: {
    paddingTop: 10,
    marginBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  neighborhood: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    flex: 1,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: {
    padding: 4,
  },
  loadingBody: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  body: {
    flex: 1,
  },
  advisoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  advisoryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  cards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  crimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  crimeRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  crimeRankText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  crimeType: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  crimeCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  crimeCountText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  lastUpdated: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.6,
  },
});

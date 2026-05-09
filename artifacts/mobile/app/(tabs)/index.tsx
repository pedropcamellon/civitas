import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { useMapContext, CivicIncident } from "@/context/MapContext";
import {
  use311Data,
  useCrimeData,
  usePermitData,
  useWaterData,
  useNeighborhoodReport,
} from "@/hooks/useCivicData";
import { useUserLocation } from "@/hooks/useUserLocation";
import { TimelineBar } from "@/components/TimelineBar";
import { IncidentSheet } from "@/components/IncidentSheet";
import { LayerSheet } from "@/components/LayerSheet";
import { NeighborhoodReport } from "@/components/NeighborhoodReport";
import { CivicMapView } from "@/components/CivicMapView";
import { THEME_META } from "@/constants/colors";

const NEIGHBORHOODS = [
  { name: "Downtown Miami",    lat: 25.7685, lon: -80.1937 },
  { name: "Brickell",          lat: 25.7617, lon: -80.1918 },
  { name: "Coconut Grove",     lat: 25.7550, lon: -80.2100 },
  { name: "Wynwood",           lat: 25.7959, lon: -80.1997 },
  { name: "Edgewater",         lat: 25.8050, lon: -80.1913 },
  { name: "Midtown",           lat: 25.7882, lon: -80.1840 },
  { name: "Little Havana",     lat: 25.7653, lon: -80.2278 },
  { name: "Coral Gables",      lat: 25.7215, lon: -80.2684 },
  { name: "South Beach",       lat: 25.7725, lon: -80.1330 },
  { name: "Miami Beach",       lat: 25.7907, lon: -80.1300 },
  { name: "North Beach",       lat: 25.8150, lon: -80.1220 },
  { name: "Design District",   lat: 25.8140, lon: -80.1978 },
  { name: "Liberty City",      lat: 25.8320, lon: -80.2100 },
  { name: "Overtown",          lat: 25.7888, lon: -80.2098 },
  { name: "Allapattah",        lat: 25.8012, lon: -80.2338 },
  { name: "Doral",             lat: 25.8196, lon: -80.3568 },
  { name: "Fontainebleau",     lat: 25.7738, lon: -80.3412 },
  { name: "Hialeah",           lat: 25.8576, lon: -80.2781 },
  { name: "Kendall",           lat: 25.6847, lon: -80.4178 },
  { name: "South Miami",       lat: 25.7063, lon: -80.2892 },
  { name: "Homestead",         lat: 25.4750, lon: -80.4773 },
  { name: "North Miami",       lat: 25.8893, lon: -80.1867 },
  { name: "North Miami Beach", lat: 25.9215, lon: -80.1578 },
];

export default function MapScreen() {
  const colors = useColors();
  const { themeName, cycleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const {
    layers,
    timeFilter,
    selectedIncident,
    setSelectedIncident,
    setUserLocation,
    neighborhoodReport,
    setNeighborhoodReport,
    isReportOpen,
    setIsReportOpen,
    isLayerSheetOpen,
    setIsLayerSheetOpen,
  } = useMapContext();

  const { location, loading: locLoading, requestLocation } = useUserLocation();

  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLon, setReportLon] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: data311 = [],    isLoading: l311,     isError: e311     } = use311Data(timeFilter);
  const { data: crimeData = [],  isLoading: lCrime,   isError: eCrime   } = useCrimeData(timeFilter);
  const { data: permitData = [], isLoading: lPermits, isError: ePermits } = usePermitData(timeFilter);
  const { data: waterData = [],  isLoading: lWater,   isError: eWater   } = useWaterData(timeFilter);

  const {
    data: reportData,
    isLoading: reportLoading,
    refetch: refetchReport,
  } = useNeighborhoodReport(reportLat, reportLon, isReportOpen);

  useEffect(() => {
    if (reportData) setNeighborhoodReport(reportData);
  }, [reportData]);

  const isLoading = l311 || lCrime || lPermits || lWater;
  const hasError = e311 || eCrime || ePermits || eWater;

  const visibleIncidents: CivicIncident[] = [
    ...(layers.requests311 ? data311    : []),
    ...(layers.crime        ? crimeData  : []),
    ...(layers.permits      ? permitData : []),
    ...(layers.water        ? waterData  : []),
  ];

  const handleMarkerPress = useCallback(
    (incident: CivicIncident) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsReportOpen(false);
      setIsLayerSheetOpen(false);
      setSelectedIncident(incident);
    },
    [setSelectedIncident, setIsReportOpen, setIsLayerSheetOpen]
  );

  const handleMapPress = useCallback(() => {
    if (selectedIncident) setSelectedIncident(null);
    if (searchFocused) { setSearchFocused(false); setSearchQuery(""); Keyboard.dismiss(); }
  }, [selectedIncident, setSelectedIncident, searchFocused]);

  const handleNearMe = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const loc = await requestLocation();
    if (loc) {
      setUserLocation(loc);
      setReportLat(loc.latitude);
      setReportLon(loc.longitude);
      setIsReportOpen(true);
      setIsLayerSheetOpen(false);
      setSelectedIncident(null);
      if (mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(
          { latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.04, longitudeDelta: 0.03 },
          800
        );
      }
    }
  }, [requestLocation, setUserLocation, setIsReportOpen, setIsLayerSheetOpen, setSelectedIncident]);

  const handleNeighborhoodSelect = useCallback(
    (nb: (typeof NEIGHBORHOODS)[number]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSearchQuery(nb.name);
      setSearchFocused(false);
      Keyboard.dismiss();
      setReportLat(nb.lat);
      setReportLon(nb.lon);
      setIsReportOpen(true);
      setIsLayerSheetOpen(false);
      setSelectedIncident(null);
      if (mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(
          { latitude: nb.lat, longitude: nb.lon, latitudeDelta: 0.06, longitudeDelta: 0.05 },
          800
        );
      }
    },
    [setIsReportOpen, setIsLayerSheetOpen, setSelectedIncident]
  );

  const handleRefreshReport = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["neighborhood-report"] });
    refetchReport();
  }, [queryClient, refetchReport]);

  const handleOpenLayers = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLayerSheetOpen(true);
    setIsReportOpen(false);
    setSelectedIncident(null);
  }, [setIsLayerSheetOpen, setIsReportOpen, setSelectedIncident]);

  const filteredNeighborhoods = searchQuery.length > 0
    ? NEIGHBORHOODS.filter((nb) => nb.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : NEIGHBORHOODS;

  const activeLayerCount = Object.values(layers).filter(Boolean).length;
  const themeIcon = THEME_META[themeName].icon as keyof typeof Ionicons.glyphMap;
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <CivicMapView
        mapRef={mapRef}
        incidents={visibleIncidents}
        userHasLocation={!!location}
        showCargoRoute={layers.cargo}
        onMarkerPress={handleMarkerPress}
        onMapPress={handleMapPress}
      />

      {/* ── Top overlay ── */}
      <View style={[styles.topOverlay, { paddingTop: topPad + 10 }]}>
        {/* Header card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card + "F2", borderColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.appDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Civic Flow</Text>
            <Text style={[styles.headerCity, { color: colors.mutedForeground as string }]}>Miami</Text>
          </View>

          <View style={styles.headerRight}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary as string} />
            ) : hasError ? (
              <View style={[styles.errorChip, { backgroundColor: (colors.destructive as string) + "20" }]}>
                <Ionicons name="warning-outline" size={12} color={colors.destructive as string} />
                <Text style={[styles.errorText, { color: colors.destructive as string }]}>Limited data</Text>
              </View>
            ) : null}

            <Text style={[styles.countText, { color: colors.mutedForeground as string }]}>
              {visibleIncidents.length} events
            </Text>

            {/* Theme toggle */}
            <TouchableOpacity
              onPress={cycleTheme}
              style={[styles.themeBtn, { backgroundColor: colors.muted }]}
              activeOpacity={0.7}
            >
              <Ionicons name={themeIcon} size={14} color={colors.primary as string} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchCard, { backgroundColor: colors.card + "F5", borderColor: searchFocused ? (colors.primary as string) : colors.border }]}>
          <Ionicons name="search" size={15} color={searchFocused ? (colors.primary as string) : (colors.mutedForeground as string)} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search neighborhood…"
            placeholderTextColor={colors.mutedForeground as string}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchFocused(false); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground as string} />
            </TouchableOpacity>
          )}
        </View>

        {/* Neighborhood dropdown */}
        {searchFocused && (
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FlatList
              data={filteredNeighborhoods}
              keyExtractor={(nb) => nb.name}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 220 }}
              renderItem={({ item: nb }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleNeighborhoodSelect(nb)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={14} color={colors.mutedForeground as string} />
                  <Text style={[styles.dropdownText, { color: colors.foreground }]}>{nb.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <TimelineBar />
      </View>

      {/* ── Near Me FAB (right) ── */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: isReportOpen ? colors.secondary : (colors.primary as string),
            borderColor: isReportOpen ? (colors.primary as string) : "transparent",
            right: 20,
            bottom: Platform.OS === "web" ? bottomPad + 78 + 20 : insets.bottom + 78 + 16,
          },
        ]}
        onPress={handleNearMe}
        activeOpacity={0.85}
      >
        {locLoading ? (
          <ActivityIndicator size="small" color={colors.primaryForeground as string} />
        ) : (
          <Ionicons
            name={location ? "locate" : "location-outline"}
            size={20}
            color={isReportOpen ? (colors.primary as string) : (colors.primaryForeground as string)}
          />
        )}
      </TouchableOpacity>

      {/* ── Layers FAB (left) ── */}
      <TouchableOpacity
        style={[
          styles.layersFab,
          {
            backgroundColor: isLayerSheetOpen ? colors.primary : (colors.card as string),
            borderColor: isLayerSheetOpen ? (colors.primary as string) : colors.border,
            left: 20,
            bottom: Platform.OS === "web" ? bottomPad + 78 + 20 : insets.bottom + 78 + 16,
          },
        ]}
        onPress={handleOpenLayers}
        activeOpacity={0.85}
      >
        <Ionicons
          name="layers-outline"
          size={18}
          color={isLayerSheetOpen ? (colors.primaryForeground as string) : (colors.foreground as string)}
        />
        <View style={[styles.layersBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.layersBadgeText, { color: colors.primaryForeground as string }]}>
            {activeLayerCount}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── Bottom spacer / safe area ── */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad, backgroundColor: colors.card + "E8", borderTopColor: colors.border }]}>
        <Text style={[styles.bottomLabel, { color: colors.mutedForeground as string }]}>
          {activeLayerCount} layer{activeLayerCount !== 1 ? "s" : ""} active · Tap
          <Text style={{ color: colors.primary as string }}> Layers </Text>
          to configure
        </Text>
      </View>

      {/* ── Sheets ── */}
      <IncidentSheet />
      <NeighborhoodReport
        report={neighborhoodReport}
        isLoading={reportLoading}
        onRefresh={handleRefreshReport}
      />
      <LayerSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  appDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerCity: { fontSize: 14, fontFamily: "Inter_400Regular" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  errorText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  countText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  themeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  dropdown: {
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  fab: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B4D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  layersFab: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  layersBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  layersBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  bottomLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

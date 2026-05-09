import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useMapContext, CivicIncident } from "@/context/MapContext";
import { use311Data, useCrimeData, usePermitData } from "@/hooks/useCivicData";
import { useUserLocation } from "@/hooks/useUserLocation";
import { LayerControls } from "@/components/LayerControls";
import { TimelineBar } from "@/components/TimelineBar";
import { IncidentSheet } from "@/components/IncidentSheet";
import { CivicMapView } from "@/components/CivicMapView";

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  const {
    layers,
    timeFilter,
    selectedIncident,
    setSelectedIncident,
    setUserLocation,
  } = useMapContext();

  const { location, loading: locLoading, requestLocation } = useUserLocation();

  const { data: data311 = [], isLoading: l311, isError: e311 } = use311Data(timeFilter);
  const { data: crimeData = [], isLoading: lCrime, isError: eCrime } = useCrimeData(timeFilter);
  const { data: permitData = [], isLoading: lPermits, isError: ePermits } = usePermitData(timeFilter);

  const isLoading = l311 || lCrime || lPermits;
  const hasError = e311 || eCrime || ePermits;

  const visibleIncidents = [
    ...(layers.requests311 ? data311 : []),
    ...(layers.crime ? crimeData : []),
    ...(layers.permits ? permitData : []),
  ];

  const handleMarkerPress = useCallback(
    (incident: CivicIncident) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIncident(incident);
    },
    [setSelectedIncident]
  );

  const handleMapPress = useCallback(() => {
    if (selectedIncident) setSelectedIncident(null);
  }, [selectedIncident, setSelectedIncident]);

  const handleNearMe = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const loc = await requestLocation();
    if (loc && mapRef.current?.animateToRegion) {
      setUserLocation(loc);
      mapRef.current.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.03,
        },
        800
      );
    }
  }, [requestLocation, setUserLocation]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.root}>
      {/* Platform-specific map */}
      <CivicMapView
        mapRef={mapRef}
        incidents={visibleIncidents}
        userHasLocation={!!location}
        onMarkerPress={handleMarkerPress}
        onMapPress={handleMapPress}
      />

      {/* ── Top overlay ── */}
      <View style={[styles.topOverlay, { paddingTop: topPad + 10 }]}>
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.card + "F0",
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Civic Flow
            </Text>
            <Text style={[styles.headerCity, { color: colors.mutedForeground }]}>
              Miami
            </Text>
          </View>

          <View style={styles.headerRight}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary as string} />
            ) : hasError ? (
              <View
                style={[
                  styles.errorChip,
                  { backgroundColor: colors.destructive + "20" },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={12}
                  color={colors.destructive as string}
                />
                <Text
                  style={[styles.errorText, { color: colors.destructive as string }]}
                >
                  Limited data
                </Text>
              </View>
            ) : null}
            <Text style={[styles.countText, { color: colors.mutedForeground as string }]}>
              {visibleIncidents.length.toLocaleString()} events
            </Text>
          </View>
        </View>

        <TimelineBar />
      </View>

      {/* ── Near Me FAB ── */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary as string,
            bottom:
              Platform.OS === "web"
                ? bottomPad + 78 + 20
                : insets.bottom + 78 + 16,
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
            color={colors.primaryForeground as string}
          />
        )}
      </TouchableOpacity>

      {/* ── Bottom layer controls ── */}
      <View style={[styles.bottomOverlay, { paddingBottom: bottomPad }]}>
        <LayerControls />
      </View>

      {/* ── Incident detail sheet ── */}
      <IncidentSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerCity: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B4D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

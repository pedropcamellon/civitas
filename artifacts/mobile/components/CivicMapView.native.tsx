import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { useColors } from "@/hooks/useColors";
import { CivicIncident } from "@/context/MapContext";

export const MIAMI_REGION: Region = {
  latitude: 25.7617,
  longitude: -80.1918,
  latitudeDelta: 0.15,
  longitudeDelta: 0.1,
};

interface Props {
  mapRef: React.RefObject<MapView>;
  incidents: CivicIncident[];
  userHasLocation: boolean;
  onMarkerPress: (incident: CivicIncident) => void;
  onMapPress: () => void;
}

function IncidentMarker({
  incident,
  onPress,
}: {
  incident: CivicIncident;
  onPress: () => void;
}) {
  const colors = useColors();
  const colorMap: Record<string, string> = {
    crime: colors.crime as string,
    requests311: colors.requests311 as string,
    permits: colors.permits as string,
  };
  const color = colorMap[incident.type] ?? (colors.primary as string);

  return (
    <Marker
      coordinate={{ latitude: incident.lat, longitude: incident.lon }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[styles.ring, { borderColor: color + "70" }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
    </Marker>
  );
}

export function CivicMapView({
  mapRef,
  incidents,
  userHasLocation,
  onMarkerPress,
  onMapPress,
}: Props) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={MIAMI_REGION}
      onPress={onMapPress}
      showsUserLocation={userHasLocation}
      showsMyLocationButton={false}
      mapType="standard"
    >
      {incidents.map((incident) => (
        <IncidentMarker
          key={incident.id}
          incident={incident}
          onPress={() => onMarkerPress(incident)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

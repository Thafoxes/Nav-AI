import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}

// Declare these outside the component to avoid re-declarations
let MapView: any;
let Marker: any;

// Only import native map components if we're on a native platform
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  const NativeMaps = require('react-native-maps');
  MapView = NativeMaps.default;
  Marker = NativeMaps.Marker;
}

function MapComponent({ center, zoom }: MapProps) {
  // For web platform, use Google Maps JavaScript API directly
  if (Platform.OS === 'web') {
    const mapHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html, #map {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
            }
          </style>
          <script src="https://maps.googleapis.com/maps/api/js?key=${
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
          }"></script>
          <script>
            function initMap() {
              const map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: ${center.lat}, lng: ${center.lng} },
                zoom: ${zoom},
                styles: ${JSON.stringify([
                  {
                    featureType: 'all',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#7c93a3' }, { lightness: '-10' }],
                  },
                  {
                    featureType: 'administrative.country',
                    elementType: 'geometry',
                    stylers: [{ visibility: 'on' }],
                  },
                  {
                    featureType: 'administrative.country',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#a0a4a5' }],
                  },
                  {
                    featureType: 'administrative.province',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#62838e' }],
                  },
                  {
                    featureType: 'landscape',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#dde3e3' }],
                  },
                  {
                    featureType: 'landscape.man_made',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#3f4a51' }, { weight: '0.30' }],
                  },
                  {
                    featureType: 'poi',
                    elementType: 'all',
                    stylers: [{ visibility: 'simplified' }],
                  },
                  {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#ffb366' }],
                  },
                  {
                    featureType: 'road.highway',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#ffb366' }],
                  },
                  {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#a6cbe3' }],
                  },
                ])}
              });

              new google.maps.Marker({
                position: { lat: ${center.lat}, lng: ${center.lng} },
                map: map
              });
            }
          </script>
        </head>
        <body onload="initMap()">
          <div id="map"></div>
        </body>
      </html>
    `;

    return (
      <View style={styles.container}>
        <WebView
          style={styles.map}
          source={{ html: mapHTML }}
          scrollEnabled={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
        />
      </View>
    );
  }

  // For native platforms, use the previously imported MapView
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.0922 * Math.pow(2, 15 - zoom),
            longitudeDelta: 0.0421 * Math.pow(2, 15 - zoom),
          }}
          customMapStyle={[
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#7c93a3' }, { lightness: -10 }],
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry',
              stylers: [{ visibility: 'on' }],
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#a0a4a5' }],
            },
            {
              featureType: 'administrative.province',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#62838e' }],
            },
            {
              featureType: 'landscape',
              elementType: 'geometry.fill',
              stylers: [{ color: '#dde3e3' }],
            },
            {
              featureType: 'landscape.man_made',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#3f4a51' }, { weight: 0.30 }],
            },
            {
              featureType: 'poi',
              elementType: 'all',
              stylers: [{ visibility: 'simplified' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.fill',
              stylers: [{ color: '#ffb366' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#ffb366' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry.fill',
              stylers: [{ color: '#a6cbe3' }],
            },
          ]}>
          <Marker
            coordinate={{
              latitude: center.lat,
              longitude: center.lng,
            }}
          />
        </MapView>
      </View>
    );
  }

  // Fallback for unsupported platforms
  return (
    <View style={styles.container}>
      <View style={styles.map} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default MapComponent;
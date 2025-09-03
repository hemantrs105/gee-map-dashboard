// frontend/src/components/MapLayers.jsx (Fixed Version)
import React, { useRef, useState, useEffect } from 'react';
import { TileLayer, LayersControl, FeatureGroup, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';

const MapLayers = ({ geeTileUrl, onMapClick, onAoiDraw, userAoi }) => {
  console.log("--- MapLayers Component is Rendering ---");
  const featureGroupRef = useRef();
  const [isDrawing, setIsDrawing] = useState(false);

  // Add map click handler using useMapEvents
  useMapEvents({
    click(e) {
      if (!isDrawing) {
        onMapClick(e.latlng);
      }
    },
  });

  useEffect(() => {
    if (userAoi === null) {
      const group = featureGroupRef.current;
      if (group) {
        group.clearLayers();
      }
    }
  }, [userAoi]);

  const handleCreated = (e) => {
    const group = featureGroupRef.current;
    group.clearLayers();
    group.addLayer(e.layer);
    onAoiDraw(e.layer.toGeoJSON());
  };

  const handleDeleted = () => {
    const group = featureGroupRef.current;
    if (group) group.clearLayers();
    onAoiDraw(null);
  };

  return (
    <>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap'/>
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri'/>
        </LayersControl.BaseLayer>

        {geeTileUrl && (
          <LayersControl.Overlay checked name="NDVI Layer">
            <TileLayer url={geeTileUrl} attribution="Google Earth Engine" opacity={0.7} key={geeTileUrl} />
          </LayersControl.Overlay>
        )}
      </LayersControl>
      
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topleft"
          onCreated={handleCreated}
          onDeleted={handleDeleted}
          onDrawStart={() => setIsDrawing(true)}
          onDrawStop={() => setIsDrawing(false)}
          onDrawDeleteStop={() => setIsDrawing(false)}
          draw={{ rectangle: true, polygon: true, circle: false, circlemarker: false, marker: false, polyline: false }}
          edit={{ edit: false, remove: true }}
        />
      </FeatureGroup>
    </>
  );
};

export default MapLayers;
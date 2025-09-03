/////MapWrapper.jsx
import React from 'react';
import { MapContainer } from 'react-leaflet';
import MapLayers from './MapLayers';

const MapWrapper = ({ geeTileUrl, onMapClick, onAoiDraw, userAoi }) => {
  const nycPosition = [40.7128, -74.0060];

  return (
    <MapContainer center={nycPosition} zoom={10} style={{ height: '100%', width: '100%' }}>
      <MapLayers
        geeTileUrl={geeTileUrl}
        onMapClick={onMapClick}
        onAoiDraw={onAoiDraw}
        userAoi={userAoi}
      />
    </MapContainer>
  );
};

export default MapWrapper;
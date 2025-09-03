// // frontend/src/App.jsx
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import { GeoJSON } from 'react-leaflet';
// import MapComponent from './components/MapComponent';
// import TimeSeriesChart from './components/TimeSeriesChart';
// import { MapTrifold, DownloadSimple } from '@phosphor-icons/react';
// import './App.css';

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// function App() {
//   const [currentDate, setCurrentDate] = useState(() => {
//     const d = new Date();
//     d.setMonth(d.getMonth() - 1);
//     const year = d.getFullYear();
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     return `${year}-${month}`;
//   });

//   const [geeTileUrl, setGeeTileUrl] = useState('');
//   const [userAoi, setUserAoi] = useState(null);
//   const [clickedPoint, setClickedPoint] = useState(null);
//   const [timeSeriesData, setTimeSeriesData] = useState([]);
//   const [loading, setLoading] = useState({ map: false, chart: false });
//   const [error, setError] = useState('');

//   const { year, month } = useMemo(() => {
//     const [y, m] = currentDate.split('-').map(Number);
//     return { year: y, month: m };
//   }, [currentDate]);

//   useEffect(() => {
//     if (!year || !month) return;
//     setLoading(prev => ({ ...prev, map: true }));
//     setError('');
//     setGeeTileUrl('');

//     axios.post(`${API_URL}/api/mapid`, { year, month, aoi: userAoi })
//       .then(response => setGeeTileUrl(response.data.tileUrl))
//       .catch(err => {
//         console.error("Error fetching GEE map ID:", err);
//         setError('Failed to load map data. The AOI might be too large or there is no data for the selected period.');
//       })
//       .finally(() => setLoading(prev => ({ ...prev, map: false })));
//   }, [year, month, userAoi]);

//   const fetchTimeSeries = useCallback((latlng) => {
//     setClickedPoint(latlng);
//     setTimeSeriesData([]);
//     setLoading(prev => ({ ...prev, chart: true }));
//     setError(null);

//     axios.post(`${API_URL}/api/timeseries`, {
//       lat: latlng.lat,
//       lon: latlng.lng,
//       end_year: year,
//       end_month: month,
//       aoi: userAoi,
//     })
//     .then(response => setTimeSeriesData(response.data.timeSeries))
//     .catch(err => {
//         console.error("Error fetching time series:", err);
//         setError('Could not fetch time series data for this point.');
//     })
//     .finally(() => setLoading(prev => ({ ...prev, chart: false })));
//   }, [year, month, userAoi]);

//   const handleAoiDraw = useCallback((geojson) => {
//     setUserAoi(geojson);
//   }, []);

//   const handleExportCsv = () => {
//     if (!clickedPoint) return;
//     axios.post(`${API_URL}/api/export_csv`, {
//         lat: clickedPoint.lat,
//         lon: clickedPoint.lng,
//         end_year: year,
//         end_month: month,
//         aoi: userAoi
//     }, { responseType: 'blob' })
//     .then(response => {
//         const url = window.URL.createObjectURL(new Blob([response.data]));
//         const link = document.createElement('a');
//         link.href = url;
//         const contentDisposition = response.headers['content-disposition'];
//         let fileName = 'ndvi_timeseries.csv';
//         if (contentDisposition) {
//             const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
//             if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
//         }
//         link.setAttribute('download', fileName);
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//     })
//     .catch(err => console.error("Error exporting CSV:", err));
//   };

//   const aoiLayer = useMemo(() => {
//     if (!userAoi) return null;
//     return <GeoJSON key={JSON.stringify(userAoi)} data={userAoi} style={{ color: 'blue', weight: 2, fillOpacity: 0.1 }} />;
//   }, [userAoi]);

//   const maxDateString = useMemo(() => {
//     const maxDate = new Date();
//     maxDate.setMonth(maxDate.getMonth() - 1);
//     return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;
//   }, []);

//   const currentMonthData = timeSeriesData.find(d => d.date === currentDate);

//   return (
//     <div className="dashboard-container">
//       <div className="sidebar">
//         <div className="sidebar-header">
//           <MapTrifold size={32} color="var(--accent-color)" />
//           <h2>NDVI Dashboard</h2>
//         </div>
//         <div className="control-group">
//           <h3>Controls</h3>
//           <label htmlFor="date-picker">Select Month:</label>
//           <input type="month" id="date-picker" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} max={maxDateString} />
//           {userAoi && (
//             <button className="secondary" onClick={() => setUserAoi(null)} style={{marginTop: '10px'}}>
//               Reset to Default AOI (NYC)
//             </button>
//           )}
//         </div>
//         <div className="control-group">
//           <h3>Legend</h3>
//           <div className='legend'>
//             <div className="legend-gradient"></div>
//             <div className="legend-labels">
//               <span>Low (-0.2)</span>
//               <span>High (0.8)</span>
//             </div>
//           </div>
//         </div>
//         <div className="control-group">
//           <h3>Analysis</h3>
//           <div className="info-box">
//             {loading.map && <p>Loading map layer...</p>}
//             {error && <p style={{ color: 'red' }}>{error}</p>}
//             {!clickedPoint && !loading.chart && <p>Draw an AOI (or use default) and click on the map to analyze a point.</p>}
//             {loading.chart && <p>Loading time series chart...</p>}
            
//             {clickedPoint && !loading.chart && (
//               <>
//                 <p><strong>Clicked Point:</strong><br/>Lat: {clickedPoint.lat.toFixed(4)}, Lon: {clickedPoint.lng.toFixed(4)}</p>
//                 <p><strong>NDVI for {currentDate}: </strong>{currentMonthData && currentMonthData.ndvi !== null ? currentMonthData.ndvi : 'No data'}</p>
//               </>
//             )}
//           </div>
//           {timeSeriesData.length > 0 && (
//             <>
//               <div className="chart-header">
//                 <h4>Last 12 Months NDVI</h4>
//                 <button onClick={handleExportCsv}><DownloadSimple size={14}/> CSV</button>
//               </div>
//               <TimeSeriesChart data={timeSeriesData} />
//             </>
//           )}
//         </div>
//       </div>
//       <div className="map-container">
//         <MapComponent geeTileUrl={geeTileUrl} onMapClick={fetchTimeSeries} onAoiDraw={handleAoiDraw} aoiLayer={aoiLayer}/>
//       </div>
//     </div>
//   );
// }

// export default App;



// frontend/src/App.jsx (Final Architecture)

// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import MapWrapper from './components/MapWrapper'; // <-- Import our new MapWrapper
// import TimeSeriesChart from './components/TimeSeriesChart';
// import { MapTrifold, DownloadSimple } from '@phosphor-icons/react';
// import './App.css';

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// function App() {
//   const [currentDate, setCurrentDate] = useState(() => {
//     const d = new Date();
//     d.setMonth(d.getMonth() - 1);
//     const year = d.getFullYear();
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     return `${year}-${month}`;
//   });

//   const [geeTileUrl, setGeeTileUrl] = useState('');
//   const [userAoi, setUserAoi] = useState(null);
//   const [clickedPoint, setClickedPoint] = useState(null);
//   const [timeSeriesData, setTimeSeriesData] = useState([]);
//   const [loading, setLoading] = useState({ map: false, chart: false });
//   const [error, setError] = useState('');

//   const { year, month } = useMemo(() => {
//     const [y, m] = currentDate.split('-').map(Number);
//     return { year: y, month: m };
//   }, [currentDate]);

//   useEffect(() => {
//     if (!year || !month) return;
//     setLoading(prev => ({ ...prev, map: true }));
//     setError('');
//     setGeeTileUrl('');

//     axios.post(`${API_URL}/api/mapid`, { year, month, aoi: userAoi })
//       .then(response => setGeeTileUrl(response.data.tileUrl))
//       .catch(err => {
//         console.error("Error fetching GEE map ID:", err);
//         setError('Failed to load map data. The AOI might be too large or there is no data for the selected period.');
//       })
//       .finally(() => setLoading(prev => ({ ...prev, map: false })));
//   }, [year, month, userAoi]);

//   const fetchTimeSeries = useCallback((latlng) => {
//     setClickedPoint(latlng);
//     setTimeSeriesData([]);
//     setLoading(prev => ({ ...prev, chart: true }));
//     setError(null);

//     axios.post(`${API_URL}/api/timeseries`, {
//       lat: latlng.lat,
//       lon: latlng.lng,
//       end_year: year,
//       end_month: month,
//       aoi: userAoi,
//     })
//     .then(response => setTimeSeriesData(response.data.timeSeries))
//     .catch(err => {
//         console.error("Error fetching time series:", err);
//         setError('Could not fetch time series data for this point.');
//     })
//     .finally(() => setLoading(prev => ({ ...prev, chart: false })));
//   }, [year, month, userAoi]);

//   const handleAoiDraw = useCallback((geojson) => {
//     setUserAoi(geojson);
//   }, []);
  
//   const handleResetAoi = () => {
//       setUserAoi(null);

//   }

//   const handleExportCsv = () => {
//     if (!clickedPoint) return;
//     axios.post(`${API_URL}/api/export_csv`, {
//         lat: clickedPoint.lat,
//         lon: clickedPoint.lng,
//         end_year: year,
//         end_month: month,
//         aoi: userAoi
//     }, { responseType: 'blob' })
//     .then(response => {
//         const url = window.URL.createObjectURL(new Blob([response.data]));
//         const link = document.createElement('a');
//         link.href = url;
//         const contentDisposition = response.headers['content-disposition'];
//         let fileName = 'ndvi_timeseries.csv';
//         if (contentDisposition) {
//             const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
//             if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
//         }
//         link.setAttribute('download', fileName);
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//     })
//     .catch(err => console.error("Error exporting CSV:", err));
//   };

//   const maxDateString = useMemo(() => {
//     const maxDate = new Date();
//     maxDate.setMonth(maxDate.getMonth() - 1);
//     return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;
//   }, []);

//   const currentMonthData = timeSeriesData.find(d => d.date === currentDate);

//   return (
//     <div className="dashboard-container">
//       <div className="sidebar">
//         <div className="sidebar-header">
//           <MapTrifold size={32} color="var(--accent-color)" />
//           <h2>NDVI Dashboard</h2>
//         </div>
//         <div className="control-group">
//           <h3>Controls</h3>
//           <label htmlFor="date-picker">Select Month:</label>
//           <input type="month" id="date-picker" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} max={maxDateString} />
//           {userAoi && (
//             <button className="secondary" onClick={handleResetAoi} style={{marginTop: '10px'}}>
//               Reset to Default AOI (NYC)
//             </button>
//           )}
//         </div>
//         <div className="control-group">
//           <h3>Legend</h3>
//           <div className='legend'>
//             <div className="legend-gradient"></div>
//             <div className="legend-labels">
//               <span>Low (-0.2)</span>
//               <span>High (0.8)</span>
//             </div>
//           </div>
//         </div>
//         <div className="control-group">
//           <h3>Analysis</h3>
//           <div className="info-box">
//             {loading.map && <p>Loading map layer...</p>}
//             {error && <p style={{ color: 'red' }}>{error}</p>}
//             {!clickedPoint && !loading.chart && <p>Draw an AOI (or use default) and click on the map to analyze a point.</p>}
//             {loading.chart && <p>Loading time series chart...</p>}
            
//             {clickedPoint && !loading.chart && (
//               <>
//                 <p><strong>Clicked Point:</strong><br/>Lat: {clickedPoint.lat.toFixed(4)}, Lon: {clickedPoint.lng.toFixed(4)}</p>
//                 <p><strong>NDVI for {currentDate}: </strong>{currentMonthData && currentMonthData.ndvi !== null ? currentMonthData.ndvi : 'No data'}</p>
//               </>
//             )}
//           </div>
//           {timeSeriesData.length > 0 && (
//             <>
//               <div className="chart-header">
//                 <h4>Last 12 Months NDVI</h4>
//                 <button onClick={handleExportCsv}><DownloadSimple size={14}/> CSV</button>
//               </div>
//               <TimeSeriesChart data={timeSeriesData} />
//             </>
//           )}
//         </div>
//       </div>
//       <div className="map-container">
//         <MapWrapper
//           geeTileUrl={geeTileUrl}
//           onMapClick={fetchTimeSeries}
//           onAoiDraw={handleAoiDraw}
//           userAoi={userAoi}
//         />
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import MapWrapper from './components/MapWrapper';
import TimeSeriesChart from './components/TimeSeriesChart';
import { MapTrifold, DownloadSimple } from '@phosphor-icons/react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  console.log("--- App Component is Rendering ---");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [geeTileUrl, setGeeTileUrl] = useState('');
  const [userAoi, setUserAoi] = useState(null);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loading, setLoading] = useState({ map: false, chart: false });
  const [error, setError] = useState('');

  const { year, month } = useMemo(() => {
    const [y, m] = currentDate.split('-').map(Number);
    return { year: y, month: m };
  }, [currentDate]);

  useEffect(() => {
    if (!year || !month) return;
    setLoading(prev => ({ ...prev, map: true }));
    setError('');
    setGeeTileUrl('');

    axios.post(`${API_URL}/api/mapid`, { year, month, aoi: userAoi })
      .then(response => setGeeTileUrl(response.data.tileUrl))
      .catch(err => {
        console.error("Error fetching GEE map ID:", err);
        setError('Failed to load map data. The AOI might be too large or there is no data for the selected period.');
      })
      .finally(() => setLoading(prev => ({ ...prev, map: false })));
  }, [year, month, userAoi]);

  const fetchTimeSeries = useCallback((latlng) => {
    setClickedPoint(latlng);
    setTimeSeriesData([]);
    setLoading(prev => ({ ...prev, chart: true }));
    setError(null);

    axios.post(`${API_URL}/api/timeseries`, {
      lat: latlng.lat,
      lon: latlng.lng,
      end_year: year,
      end_month: month,
      aoi: userAoi,
    })
    .then(response => setTimeSeriesData(response.data.timeSeries))
    .catch(err => {
        console.error("Error fetching time series:", err);
        setError('Could not fetch time series data for this point.');
    })
    .finally(() => setLoading(prev => ({ ...prev, chart: false })));
  }, [year, month, userAoi]);

  const handleAoiDraw = useCallback((geojson) => {
    setUserAoi(geojson);
  }, []);
  
  const handleResetAoi = () => {
      setUserAoi(null);
  }

  const handleExportCsv = () => {
    if (!clickedPoint) return;
    axios.post(`${API_URL}/api/export_csv`, {
        lat: clickedPoint.lat,
        lon: clickedPoint.lng,
        end_year: year,
        end_month: month,
        aoi: userAoi
    }, { responseType: 'blob' })
    .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'ndvi_timeseries.csv';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
        }
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    })
    .catch(err => console.error("Error exporting CSV:", err));
  };

  const maxDateString = useMemo(() => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() - 1);
    return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthData = timeSeriesData.find(d => d.date === currentDate);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <MapTrifold size={32} color="var(--accent-color)" />
          <h2>NDVI Dashboard</h2>
        </div>
        <div className="control-group">
          <h3>Controls</h3>
          <label htmlFor="date-picker">Select Month:</label>
          <input type="month" id="date-picker" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} max={maxDateString} />
          {userAoi && (
            <button className="secondary" onClick={handleResetAoi} style={{marginTop: '10px'}}>
              Reset to Default AOI (NYC)
            </button>
          )}
        </div>
        <div className="control-group">
          <h3>Legend</h3>
          <div className='legend'>
            <div className="legend-gradient"></div>
            <div className="legend-labels">
              <span>Low (-0.2)</span>
              <span>High (0.8)</span>
            </div>
          </div>
        </div>
        <div className="control-group">
          <h3>Analysis</h3>
          <div className="info-box">
            {loading.map && <p>Loading map layer...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!clickedPoint && !loading.chart && <p>Draw an AOI (or use default) and click on the map to analyze a point.</p>}
            {loading.chart && <p>Loading time series chart...</p>}
            
            {clickedPoint && !loading.chart && (
              <>
                <p><strong>Clicked Point:</strong><br/>Lat: {clickedPoint.lat.toFixed(4)}, Lon: {clickedPoint.lng.toFixed(4)}</p>
                <p><strong>NDVI for {currentDate}: </strong>{currentMonthData && currentMonthData.ndvi !== null ? currentMonthData.ndvi : 'No data'}</p>
              </>
            )}
          </div>
          {timeSeriesData.length > 0 && (
            <>
              <div className="chart-header">
                <h4>Last 12 Months NDVI</h4>
                <button onClick={handleExportCsv}><DownloadSimple size={14}/> CSV</button>
              </div>
              <TimeSeriesChart data={timeSeriesData} />
            </>
          )}
        </div>
      </div>
      <div className="map-container">
        <MapWrapper
          geeTileUrl={geeTileUrl}
          onMapClick={fetchTimeSeries}
          onAoiDraw={handleAoiDraw}
          userAoi={userAoi}
        />
      </div>
    </div>
  );
}

export default App;
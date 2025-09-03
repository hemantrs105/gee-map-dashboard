// frontend/src/components/TimeSeriesChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TimeSeriesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#6c757d' }}>No time series data available.</div>;
  }
  const chartData = data.filter(d => d.ndvi !== null);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={10} />
          <YAxis domain={[-0.2, 1]} fontSize={10}/>
          <Tooltip />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Line type="monotone" dataKey="ndvi" name="Monthly Avg NDVI" stroke="#1a9850" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesChart;
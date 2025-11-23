import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plane, Activity, Map as MapIcon, Video, Battery, Wifi } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Connect to the backend
// FOR LOCAL DEMO: Use 'http://localhost:5000'
// FOR REAL 4G DRONE: Change this to Cloud Server IP (e.g., 'http://15.206.xx.xx:5000')
const socket = io('http://localhost:5000');

function App() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    lat: 0,
    lon: 0,
    alt: 0,
    heading: 0,
    speed: 0,
    battery: 0,
    mode: 'DISCONNECTED'
  });
  
  // Store history for graphs
  const [history, setHistory] = useState([]);
  // Store path for map line
  const [path, setPath] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Backend');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Backend');
      setConnected(false);
    });

    socket.on('telemetry_data', (data) => {
      setTelemetry(prev => ({
        ...prev,
        ...data,
        mode: 'FLYING'
      }));

      // Update Path for map
      if (data.lat && data.lon) {
        setPath(prev => [...prev, [data.lat, data.lon]]);
      }

      // Update History for graphs 
      setHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          alt: data.alt || 0,
          speed: data.speed || 0 // Assuming speed comes in telemetry
        };
        const newHistory = [...prev, newPoint];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry_data');
    };
  }, []);

  // Default position (Bangalore)
  const defaultPosition = [12.9716, 77.5946];
  const currentPosition = (telemetry.lat && telemetry.lon) ? [telemetry.lat, telemetry.lon] : defaultPosition;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          {/* Using a Plane icon */}
          <Plane size={24} color="#2196F3" /> 
          <span style={{ letterSpacing: '1px' }}>VYOMGARUD</span>
        </div>
        <div className="nav-item active"><Activity size={20} /> Mission Control</div>
        <div className="nav-item"><MapIcon size={20} /> Waypoint Planning</div>
        <div className="nav-item"><Video size={20} /> Secure Live Feed</div>
        <div className="nav-item"><Battery size={20} /> Drone Fleet</div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        
        {/* Header / Status Bar */}
        <div className="header">
          <h2>VyomGarud: Sentinel-X1 Telemetry</h2>
          <div className="status-bar">
            <div className={`status-badge ${connected ? 'online' : 'offline'}`}>
              {connected ? 'LINK ESTABLISHED' : 'SEARCHING FOR LINK'}
            </div>
            <div className="status-badge">
              <Wifi size={14} style={{marginRight:5}}/> Hybrid 4G/LoRa
            </div>
            <div className="status-badge">
              Battery: {telemetry.battery}%
            </div>
          </div>
        </div>

        {/* Top Grid: Map & Camera */}
        <div className="top-grid">
          <div className="card">
            <h3>Live Tracking</h3>
            <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* DEFAULT MARKER (Blue Pin) */}
              <Marker position={currentPosition}>
                <Popup>
                  Drone ID: Sentinel-X1 <br /> Altitude: {telemetry.alt.toFixed(2)}m
                </Popup>
              </Marker>
              <Polyline positions={path} color="#2196F3" weight={3} />
            </MapContainer>
          </div>

          <div className="card">
             <h3>Live Video (4G)</h3>
             {/* Placeholder for video stream */}
             <div style={{flex:1, background:'#000', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px'}}>
                <span style={{color:'#555'}}>Waiting for Video Stream...</span>
             </div>
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="telemetry-grid">
           <div className="telemetry-card">
              <div className="telemetry-label">Altitude</div>
              <div className="telemetry-value">{telemetry.alt.toFixed(1)} m</div>
           </div>
           <div className="telemetry-card">
              <div className="telemetry-label">Ground Speed</div>
              <div className="telemetry-value">{(telemetry.speed || 0).toFixed(1)} m/s</div>
           </div>
           <div className="telemetry-card">
              <div className="telemetry-label">Distance from Home</div>
              <div className="telemetry-value">0 m</div>
           </div>
           <div className="telemetry-card">
              <div className="telemetry-label">Flight Mode</div>
              <div className="telemetry-value" style={{fontSize:'1.2rem', color:'#2196F3'}}>{telemetry.mode}</div>
           </div>
        </div>

        {/* Graphs */}
        <div className="card" style={{height: '250px'}}>
          <h3>Altitude Profile</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{backgroundColor: '#333', border: 'none'}} />
              <Line 
                type="monotone" 
                dataKey="alt" 
                stroke="#2196F3" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default App;
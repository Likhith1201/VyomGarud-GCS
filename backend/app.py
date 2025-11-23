import time
from flask import Flask
from flask_socketio import SocketIO
from pymavlink import mavutil
import threading

# Initialize Flask and SocketIO
# async_mode='threading' ensures compatibility without eventlet
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global variable to hold the drone connection
master = None
connection_string = 'udpin:127.0.0.1:14551'

def connect_drone():
    """
    Continually tries to connect to the simulated drone.
    """
    global master
    print(f"Waiting for MAVLink heartbeat on {connection_string}...")
    
    # Try to connect to the MAVLink stream
    master = mavutil.mavlink_connection(connection_string, source_system=255)
    
    # Wait for the first heartbeat to confirm connection
    master.wait_heartbeat()
    print(f"Heartbeat received! Connected to system {master.target_system}, component {master.target_component}")

def telemetry_loop():
    """
    Reads MAVLink messages and broadcasts them to the frontend via WebSockets.
    """
    global master
    while True:
        if master is not None:
            try:
                msg = master.recv_match(blocking=True, timeout=0.1)
                if not msg:
                    continue

                telemetry_data = {}

                # Extract Attitude
                if msg.get_type() == 'ATTITUDE':
                    telemetry_data['roll'] = msg.roll
                    telemetry_data['pitch'] = msg.pitch
                    telemetry_data['yaw'] = msg.yaw

                # Extract Global Position
                if msg.get_type() == 'GLOBAL_POSITION_INT':
                    telemetry_data['lat'] = msg.lat / 1e7
                    telemetry_data['lon'] = msg.lon / 1e7
                    telemetry_data['alt'] = msg.relative_alt / 1000.0
                    telemetry_data['heading'] = msg.hdg / 100.0
                    # Create a speed estimate if we have velocity
                    telemetry_data['speed'] = ((msg.vx**2 + msg.vy**2)**0.5) / 100.0

                # Extract Battery
                if msg.get_type() == 'SYS_STATUS':
                    telemetry_data['voltage'] = msg.voltage_battery / 1000.0
                    telemetry_data['current'] = msg.current_battery / 100.0
                    telemetry_data['battery'] = msg.battery_remaining # Correct key for frontend

                if telemetry_data:
                    # print(telemetry_data) 
                    socketio.emit('telemetry_data', telemetry_data)
                    
                # Important: Let the socket breathe
                socketio.sleep(0)

            except Exception as e:
                print(f"Error: {e}")
        
        # Small sleep to prevent CPU hogging
        socketio.sleep(0.01)

# Start the connection thread (Standard thread is fine for this)
connection_thread = threading.Thread(target=connect_drone)
connection_thread.daemon = True
connection_thread.start()

# Start telemetry loop as a SocketIO Background Task
if __name__ == '__main__':
    socketio.start_background_task(telemetry_loop)
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, use_reloader=False)
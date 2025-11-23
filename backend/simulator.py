import time
import math
from pymavlink import mavutil

# Connect to the GCS (Ground Control Station)
# Using port 14551 
master = mavutil.mavlink_connection('udpout:127.0.0.1:14551', source_system=1)

print("Drone Simulator Started...")
print("Sending MAVLink data to udp:127.0.0.1:14551")

start_time = time.time()

# Initial Position (Bangalore)
lat = 12.9716 * 1e7
lon = 77.5946 * 1e7
heading = 0 

# Flight parameters
radius = 0.002 * 1e7 
angle = 0

while True:
    current_time_ms = int((time.time() - start_time) * 1000)

    # 1. Send HEARTBEAT
    master.mav.heartbeat_send(
        mavutil.mavlink.MAV_TYPE_QUADROTOR,
        mavutil.mavlink.MAV_AUTOPILOT_ARDUPILOTMEGA,
        mavutil.mavlink.MAV_MODE_GUIDED_ARMED,
        0, 0
    )

    # 2. Simulate Movement (Circle)
    angle += 0.05
    offset_lat = math.sin(angle) * radius
    offset_lon = math.cos(angle) * radius
    
    current_lat = int(lat + offset_lat)
    current_lon = int(lon + offset_lon)
    
    # 3. Simulate WAVY Altitude (Between 40m and 60m)
    base_alt = 50
    wavy_alt = base_alt + (math.sin(angle) * 10) 

    # 4. Send GLOBAL_POSITION_INT
    master.mav.global_position_int_send(
        current_time_ms,
        current_lat,
        current_lon,
        int(wavy_alt * 1000),    # Altitude (mm)
        int(wavy_alt * 1000),    # Relative Altitude (mm)
        0, 0, 0,
        int(heading * 100)
    )

    # 5. Send ATTITUDE
    roll = math.sin(angle) * 0.1
    master.mav.attitude_send(
        current_time_ms,
        roll, 0, angle, 0, 0, 0
    )
    
    # 6. Send BATTERY
    battery_level = 100 - (int(time.time()) % 1000) / 10.0
    master.mav.sys_status_send(
        0, 0, 0, 0, 12000, 1000, int(battery_level), 0, 0, 0, 0, 0, 0
    )

    time.sleep(0.1)
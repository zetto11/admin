export interface Camera {
  id: number;
  name: string;
  zone: string;
  ip_simulated: string;
  status: 'online' | 'offline' | 'maintenance';
  is_blocked: boolean;
  last_seen: string;
  lat?: number;
  lng?: number;
}

export interface AccessPoint {
  id: number;
  name: string;
  status: 'online' | 'offline';
  lat: number;
  lng: number;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface Alert {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  explanation?: string;
  affected_entity?: string;
  is_acknowledged: boolean;
  timestamp: string;
}

export interface AccessLog {
  id: number;
  user_id: number;
  username?: string;
  camera_id: number;
  camera_name?: string;
  action: string;
  timestamp: string;
}

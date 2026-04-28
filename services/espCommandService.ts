/**
 * ESP Command Service
 * 
 * Handles direct WiFi communication with ESP32 device
 * Supports:
 * - Auto-discovery via mDNS (vista-iot.local)
 * - Direct IP fallback
 * - Command execution with instant response
 * - Device state tracking
 * - Firebase history logging (async)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeviceState {
  fan1_speed: number;
  fan2_speed: number;
  servo_angle: number;
  bulb1: boolean;
  bulb2: boolean;
  tv: boolean;
  timestamp: number;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  device_states: DeviceState;
}

class ESPCommandService {
  private deviceUrl: string | null = null;
  private discoveredIP: string | null = null;
  private requestTimeout: number = 5000; // 5 second timeout
  private lastResponse: DeviceState | null = null;
  
  constructor() {
    this.loadStoredIP();
  }

  /**
   * Load previously discovered device IP from storage
   */
  private async loadStoredIP() {
    try {
      const stored = await AsyncStorage.getItem('esp_device_ip');
      if (stored) {
        this.discoveredIP = stored;
        this.deviceUrl = `http://${stored}:8080`;
        console.log('[ESP Service] Loaded stored IP:', stored);
      }
    } catch (error) {
      console.error('[ESP Service] Error loading stored IP:', error);
    }
  }

  /**
   * Discover device using mDNS (vista-iot.local)
   * This is the primary discovery method
   */
  async discoverDevice(): Promise<string> {
    console.log('[ESP Service] Attempting discovery...');

    // Try mDNS hostname first
    const mdnsUrl = 'http://vista-iot.local:8080';
    
    try {
      const response = await this.fetchWithTimeout(mdnsUrl, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.device === 'Vista-IoT') {
          this.deviceUrl = mdnsUrl;
          console.log('[ESP Service] Device discovered via mDNS: vista-iot.local');
          return mdnsUrl;
        }
      }
    } catch (error) {
      console.warn('[ESP Service] mDNS discovery failed, trying stored IP...');
    }

    // Fallback to stored IP
    if (this.discoveredIP) {
      try {
        const ipUrl = `http://${this.discoveredIP}:8080`;
        const response = await this.fetchWithTimeout(ipUrl, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.device === 'Vista-IoT') {
            this.deviceUrl = ipUrl;
            console.log('[ESP Service] Device found at stored IP:', this.discoveredIP);
            return ipUrl;
          }
        }
      } catch (error) {
        console.warn('[ESP Service] Stored IP not responding');
        await AsyncStorage.removeItem('esp_device_ip');
        this.discoveredIP = null;
      }
    }

    throw new Error('Device not found. Ensure ESP32 is connected to WiFi and on the same network.');
  }

  /**
   * Send command to device
   * Returns instantly with device state
   */
  async sendCommand(action: string): Promise<CommandResponse> {
    if (!this.deviceUrl) {
      // Try to discover device first
      try {
        await this.discoverDevice();
      } catch (error) {
        console.error('[ESP Service] Device not available:', error);
        throw new Error('Device not connected');
      }
    }

    try {
      const commandUrl = `${this.deviceUrl}/cmd`;
      
      console.log(`[ESP Service] Sending command: ${action}`);

      const response = await this.fetchWithTimeout(commandUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: CommandResponse = await response.json();

      // Cache the device state
      if (data.device_states) {
        this.lastResponse = data.device_states;
      }

      console.log('[ESP Service] Command successful:', data.message);
      return data;
    } catch (error) {
      console.error('[ESP Service] Command failed:', error);
      
      // On failure, try to rediscover device
      this.deviceUrl = null;
      
      throw new Error(
        error instanceof Error
          ? `Command failed: ${error.message}`
          : 'Command failed: Unknown error'
      );
    }
  }

  /**
   * Get device status without sending a command
   */
  async getDeviceStatus(): Promise<DeviceState> {
    if (!this.deviceUrl) {
      try {
        await this.discoverDevice();
      } catch (error) {
        throw new Error('Device not connected');
      }
    }

    try {
      const statusUrl = `${this.deviceUrl}/status`;

      const response = await this.fetchWithTimeout(statusUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: DeviceState = await response.json();
      this.lastResponse = data;

      console.log('[ESP Service] Status fetched successfully');
      return data;
    } catch (error) {
      console.error('[ESP Service] Status fetch failed:', error);
      this.deviceUrl = null;

      // Return cached state if available
      if (this.lastResponse) {
        console.log('[ESP Service] Returning cached state');
        return this.lastResponse;
      }

      throw new Error('Failed to get device status');
    }
  }

  /**
   * Check if device is reachable
   */
  async isDeviceConnected(): Promise<boolean> {
    try {
      if (!this.deviceUrl) {
        // Try discovery without throwing
        try {
          await this.discoverDevice();
        } catch {
          return false;
        }
      }

      const response = await this.fetchWithTimeout(`${this.deviceUrl}`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      this.deviceUrl = null;
      return false;
    }
  }

  /**
   * Store device IP for faster reconnection
   */
  async storeDeviceIP(ip: string) {
    try {
      this.discoveredIP = ip;
      this.deviceUrl = `http://${ip}:8080`;
      await AsyncStorage.setItem('esp_device_ip', ip);
      console.log('[ESP Service] Stored device IP:', ip);
    } catch (error) {
      console.error('[ESP Service] Error storing device IP:', error);
    }
  }

  /**
   * Get current device URL
   */
  getDeviceUrl(): string | null {
    return this.deviceUrl;
  }

  /**
   * Get last cached device state
   */
  getLastState(): DeviceState | null {
    return this.lastResponse;
  }

  /**
   * Clear cached device info
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem('esp_device_ip');
      this.deviceUrl = null;
      this.discoveredIP = null;
      this.lastResponse = null;
      console.log('[ESP Service] Cache cleared');
    } catch (error) {
      console.error('[ESP Service] Error clearing cache:', error);
    }
  }

  /**
   * Helper: Fetch with timeout
   */
  private fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = this.requestTimeout
  ): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }
}

// Export singleton instance
export const espCommandService = new ESPCommandService();
export default espCommandService;

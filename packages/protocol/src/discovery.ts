import { Bonjour, Service, RemoteService } from 'bonjour-service';
import {
  Device,
  DeviceType,
  Platform,
  DeviceStatus,
  DeviceCapabilities,
  Portal FusionEvents,
} from '@portal-fusion/shared';
import {
  generateDeviceId,
  generateKeyPair,
  getPlatform,
  TypedEventEmitter,
  isLocalIP,
  normalizeIP,
} from '@portal-fusion/shared';
import {
  MDNS_SERVICE_TYPE,
  SERVICE_NAME,
  DEFAULT_PORT,
  DISCOVERY_PORT,
} from '@portal-fusion/shared';
import * as os from 'os';
import * as crypto from 'crypto';

export interface DiscoveryOptions {
  name?: string;
  port?: number;
  autoStart?: boolean;
  enableIPv6?: boolean;
  interfaceFilter?: (iface: os.NetworkInterfaceInfo) => boolean;
}

export interface DiscoveredDevice extends Device {
  service: RemoteService;
  lastHeartbeat: Date;
}

/**
 * Device Discovery Service using mDNS/Bonjour
 * Handles automatic device detection and advertisement on local network
 */
export class DeviceDiscoveryService extends TypedEventEmitter<Portal FusionEvents> {
  private bonjour: Bonjour;
  private advertisement?: Service;
  private browser?: any;
  private localDevice: Device;
  private discoveredDevices: Map<string, DiscoveredDevice>;
  private heartbeatInterval?: NodeJS.Timeout;
  private options: Required<DiscoveryOptions>;
  
  constructor(options: DiscoveryOptions = {}) {
    super();
    
    this.options = {
      name: options.name || os.hostname(),
      port: options.port || DEFAULT_PORT,
      autoStart: options.autoStart !== false,
      enableIPv6: options.enableIPv6 !== false,
      interfaceFilter: options.interfaceFilter || (() => true),
    };
    
    this.bonjour = new Bonjour();
    this.discoveredDevices = new Map();
    this.localDevice = this.createLocalDevice();
    
    if (this.options.autoStart) {
      this.start();
    }
  }
  
  /**
   * Create local device information
   */
  private createLocalDevice(): Device {
    const { publicKey, privateKey } = generateKeyPair();
    const networkInterfaces = this.getNetworkInterfaces();
    const primaryInterface = networkInterfaces[0];
    
    // Store private key securely (in production, use keychain/credential store)
    process.env.PORTAL_FUSION_PRIVATE_KEY = privateKey;
    
    return {
      id: generateDeviceId(),
      name: this.options.name,
      platform: getPlatform(),
      type: this.getDeviceType(),
      hostname: os.hostname(),
      ip: primaryInterface?.address || '127.0.0.1',
      port: this.options.port,
      publicKey,
      capabilities: this.getDeviceCapabilities(),
      status: DeviceStatus.ONLINE,
      lastSeen: new Date(),
      paired: false,
      trusted: false,
      metadata: {
        os: os.type(),
        version: os.release(),
        arch: os.arch(),
        model: this.getDeviceModel(),
      },
    };
  }
  
  /**
   * Get device type based on system information
   */
  private getDeviceType(): DeviceType {
    const platform = getPlatform();
    const batteryInfo = this.hasBattery();
    
    if (platform === Platform.WINDOWS && batteryInfo) {
      // Windows tablet or laptop
      return this.hasTouch() ? DeviceType.TABLET : DeviceType.LAPTOP;
    } else if (platform === Platform.MACOS) {
      // MacBook or Mac desktop
      return batteryInfo ? DeviceType.LAPTOP : DeviceType.DESKTOP;
    } else {
      // Default based on battery presence
      return batteryInfo ? DeviceType.LAPTOP : DeviceType.DESKTOP;
    }
  }
  
  /**
   * Check if device has battery (laptop/tablet indicator)
   */
  private hasBattery(): boolean {
    try {
      // This is a simplified check - in production, use native modules
      // for accurate battery detection
      const platform = getPlatform();
      if (platform === Platform.MACOS) {
        // Check for MacBook model
        return os.hostname().toLowerCase().includes('macbook');
      }
      return false;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if device has touch support
   */
  private hasTouch(): boolean {
    // In production, use native modules to detect touch support
    return false;
  }
  
  /**
   * Get device model information
   */
  private getDeviceModel(): string {
    const platform = getPlatform();
    if (platform === Platform.MACOS) {
      // In production, use system_profiler to get exact model
      return 'MacBook Air';
    } else if (platform === Platform.WINDOWS) {
      // In production, use WMI to get model information
      return 'Windows Device';
    }
    return 'Unknown';
  }
  
  /**
   * Get device capabilities
   */
  private getDeviceCapabilities(): DeviceCapabilities {
    return {
      clipboard: true,
      fileTransfer: true,
      notifications: true,
      keyboard: true,
      mouse: true,
      screen: true,
      audio: true,
      camera: this.hasCamera(),
      touch: this.hasTouch(),
      stylus: false, // Detect stylus support in production
      biometric: this.hasBiometric(),
      storage: this.getStorageInfo(),
    };
  }
  
  /**
   * Check if device has camera
   */
  private hasCamera(): boolean {
    // In production, enumerate media devices
    return true; // Most modern devices have cameras
  }
  
  /**
   * Check if device has biometric authentication
   */
  private hasBiometric(): boolean {
    const platform = getPlatform();
    if (platform === Platform.MACOS) {
      // Check for Touch ID support
      return true; // Most modern Macs have Touch ID
    } else if (platform === Platform.WINDOWS) {
      // Check for Windows Hello
      return false; // Requires native module to detect
    }
    return false;
  }
  
  /**
   * Get storage information
   */
  private getStorageInfo(): { available: number; total: number } {
    try {
      // In production, use proper disk space detection
      return {
        available: 100 * 1024 * 1024 * 1024, // 100GB placeholder
        total: 500 * 1024 * 1024 * 1024, // 500GB placeholder
      };
    } catch {
      return { available: 0, total: 0 };
    }
  }
  
  /**
   * Get network interfaces
   */
  private getNetworkInterfaces(): Array<{ name: string; address: string }> {
    const interfaces: Array<{ name: string; address: string }> = [];
    const nets = os.networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      const netInterfaces = nets[name];
      if (!netInterfaces) continue;
      
      for (const net of netInterfaces) {
        // Skip internal and non-IPv4 addresses
        if (net.internal || net.family !== 'IPv4') continue;
        
        // Apply custom filter
        if (!this.options.interfaceFilter(net)) continue;
        
        interfaces.push({
          name,
          address: normalizeIP(net.address),
        });
      }
    }
    
    // Sort to prioritize non-local addresses
    return interfaces.sort((a, b) => {
      const aLocal = isLocalIP(a.address);
      const bLocal = isLocalIP(b.address);
      if (aLocal === bLocal) return 0;
      return aLocal ? 1 : -1;
    });
  }
  
  /**
   * Start discovery service
   */
  async start(): Promise<void> {
    try {
      // Start advertising local device
      this.startAdvertising();
      
      // Start browsing for other devices
      this.startBrowsing();
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      console.log(`🔍 Discovery service started on ${this.localDevice.ip}:${this.localDevice.port}`);
    } catch (error) {
      console.error('Failed to start discovery service:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }
  
  /**
   * Start advertising local device via mDNS
   */
  private startAdvertising(): void {
    const txtRecord = {
      id: this.localDevice.id,
      name: this.localDevice.name,
      platform: this.localDevice.platform,
      type: this.localDevice.type,
      publicKey: this.localDevice.publicKey,
      capabilities: JSON.stringify(this.localDevice.capabilities),
      version: '1.0.0',
    };
    
    this.advertisement = this.bonjour.publish({
      name: `${SERVICE_NAME}-${this.localDevice.id}`,
      type: MDNS_SERVICE_TYPE,
      port: this.options.port,
      txt: txtRecord,
    });
    
    this.advertisement.on('error', (error) => {
      console.error('Advertisement error:', error);
      this.emit('error', error);
    });
  }
  
  /**
   * Start browsing for other devices
   */
  private startBrowsing(): void {
    this.browser = this.bonjour.find({ type: MDNS_SERVICE_TYPE });
    
    this.browser.on('up', (service: RemoteService) => {
      this.handleDeviceFound(service);
    });
    
    this.browser.on('down', (service: RemoteService) => {
      this.handleDeviceLost(service);
    });
  }
  
  /**
   * Handle discovered device
   */
  private handleDeviceFound(service: RemoteService): void {
    try {
      // Parse device information from service
      const txt = service.txt as any;
      
      // Skip self-discovery
      if (txt.id === this.localDevice.id) return;
      
      // Parse capabilities
      let capabilities: DeviceCapabilities;
      try {
        capabilities = JSON.parse(txt.capabilities || '{}');
      } catch {
        capabilities = this.getDefaultCapabilities();
      }
      
      // Create discovered device
      const device: DiscoveredDevice = {
        id: txt.id,
        name: txt.name || service.name,
        platform: txt.platform as Platform,
        type: txt.type as DeviceType,
        hostname: service.host,
        ip: normalizeIP(service.addresses?.[0] || service.host),
        port: service.port,
        publicKey: txt.publicKey,
        capabilities,
        status: DeviceStatus.ONLINE,
        lastSeen: new Date(),
        paired: false,
        trusted: false,
        metadata: {
          os: txt.os || 'Unknown',
          version: txt.version || 'Unknown',
          arch: txt.arch || 'Unknown',
          model: txt.model,
        },
        service,
        lastHeartbeat: new Date(),
      };
      
      // Check if device already exists
      const existingDevice = this.discoveredDevices.get(device.id);
      if (existingDevice) {
        // Update existing device
        Object.assign(existingDevice, device);
        existingDevice.lastHeartbeat = new Date();
      } else {
        // Add new device
        this.discoveredDevices.set(device.id, device);
        this.emit('device:discovered', device);
        console.log(`✨ Discovered device: ${device.name} (${device.platform})`);
      }
    } catch (error) {
      console.error('Error handling discovered device:', error);
    }
  }
  
  /**
   * Handle lost device
   */
  private handleDeviceLost(service: RemoteService): void {
    try {
      const txt = service.txt as any;
      const deviceId = txt.id;
      
      if (!deviceId) return;
      
      const device = this.discoveredDevices.get(deviceId);
      if (device) {
        device.status = DeviceStatus.OFFLINE;
        this.emit('device:disconnected', device);
        this.discoveredDevices.delete(deviceId);
        console.log(`👋 Lost device: ${device.name}`);
      }
    } catch (error) {
      console.error('Error handling lost device:', error);
    }
  }
  
  /**
   * Get default capabilities for fallback
   */
  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      clipboard: true,
      fileTransfer: true,
      notifications: false,
      keyboard: false,
      mouse: false,
      screen: false,
      audio: false,
      camera: false,
      touch: false,
      stylus: false,
      biometric: false,
      storage: { available: 0, total: 0 },
    };
  }
  
  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds
      
      // Check for stale devices
      for (const [id, device] of this.discoveredDevices) {
        const timeSinceHeartbeat = now.getTime() - device.lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat > timeout && device.status === DeviceStatus.ONLINE) {
          device.status = DeviceStatus.OFFLINE;
          this.emit('device:disconnected', device);
          console.log(`💔 Device timeout: ${device.name}`);
        }
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Stop discovery service
   */
  async stop(): Promise<void> {
    // Stop advertising
    if (this.advertisement) {
      this.advertisement.stop();
      this.advertisement = undefined;
    }
    
    // Stop browsing
    if (this.browser) {
      this.browser.stop();
      this.browser = undefined;
    }
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    
    // Destroy Bonjour instance
    this.bonjour.destroy();
    
    // Clear discovered devices
    this.discoveredDevices.clear();
    
    console.log('🛑 Discovery service stopped');
  }
  
  /**
   * Get local device information
   */
  getLocalDevice(): Device {
    return { ...this.localDevice };
  }
  
  /**
   * Get all discovered devices
   */
  getDiscoveredDevices(): Device[] {
    return Array.from(this.discoveredDevices.values()).map(device => ({
      ...device,
      service: undefined, // Don't expose internal service object
    })) as Device[];
  }
  
  /**
   * Get device by ID
   */
  getDevice(id: string): Device | undefined {
    const device = this.discoveredDevices.get(id);
    if (!device) return undefined;
    
    return {
      ...device,
      service: undefined,
    } as Device;
  }
  
  /**
   * Update local device information
   */
  updateLocalDevice(updates: Partial<Device>): void {
    Object.assign(this.localDevice, updates);
    
    // Restart advertising with new information
    if (this.advertisement) {
      this.advertisement.stop();
      this.startAdvertising();
    }
  }
  
  /**
   * Refresh discovery (force re-scan)
   */
  refresh(): void {
    if (this.browser) {
      this.browser.update();
    }
  }
}

// Export singleton instance for convenience
export const discoveryService = new DeviceDiscoveryService();

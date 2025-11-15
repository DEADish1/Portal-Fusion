import { Service } from 'bonjour-service';
import { Device, PortalFusionEvents } from '@portal-fusion/shared';
import { TypedEventEmitter } from '@portal-fusion/shared';
import * as os from 'os';
export interface DiscoveryOptions {
    name?: string;
    port?: number;
    autoStart?: boolean;
    enableIPv6?: boolean;
    interfaceFilter?: (iface: os.NetworkInterfaceInfo) => boolean;
}
export interface DiscoveredDevice extends Device {
    service: Service;
    lastHeartbeat: Date;
}
/**
 * Device Discovery Service using mDNS/Bonjour
 * Handles automatic device detection and advertisement on local network
 */
export declare class DeviceDiscoveryService extends TypedEventEmitter<PortalFusionEvents> {
    private bonjour;
    private advertisement?;
    private browser?;
    private localDevice;
    private discoveredDevices;
    private heartbeatInterval?;
    private options;
    constructor(options?: DiscoveryOptions);
    /**
     * Create local device information
     */
    private createLocalDevice;
    /**
     * Get device type based on system information
     */
    private getDeviceType;
    /**
     * Check if device has battery (laptop/tablet indicator)
     */
    private hasBattery;
    /**
     * Check if device has touch support
     */
    private hasTouch;
    /**
     * Get device model information
     */
    private getDeviceModel;
    /**
     * Get device capabilities
     */
    private getDeviceCapabilities;
    /**
     * Check if device has camera
     */
    private hasCamera;
    /**
     * Check if device has biometric authentication
     */
    private hasBiometric;
    /**
     * Get storage information
     */
    private getStorageInfo;
    /**
     * Get network interfaces
     */
    private getNetworkInterfaces;
    /**
     * Start discovery service
     */
    start(): Promise<void>;
    /**
     * Start advertising local device via mDNS
     */
    private startAdvertising;
    /**
     * Start browsing for other devices
     */
    private startBrowsing;
    /**
     * Handle discovered device
     */
    private handleDeviceFound;
    /**
     * Handle lost device
     */
    private handleDeviceLost;
    /**
     * Get default capabilities for fallback
     */
    private getDefaultCapabilities;
    /**
     * Start heartbeat monitoring
     */
    private startHeartbeat;
    /**
     * Stop discovery service
     */
    stop(): Promise<void>;
    /**
     * Get local device information
     */
    getLocalDevice(): Device;
    /**
     * Get all discovered devices
     */
    getDiscoveredDevices(): Device[];
    /**
     * Get device by ID
     */
    getDevice(id: string): Device | undefined;
    /**
     * Update local device information
     */
    updateLocalDevice(updates: Partial<Device>): void;
    /**
     * Refresh discovery (force re-scan)
     */
    refresh(): void;
}
export declare const discoveryService: DeviceDiscoveryService;
//# sourceMappingURL=discovery.d.ts.map
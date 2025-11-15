"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoveryService = exports.DeviceDiscoveryService = void 0;
const bonjour_service_1 = require("bonjour-service");
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const os = __importStar(require("os"));
/**
 * Device Discovery Service using mDNS/Bonjour
 * Handles automatic device detection and advertisement on local network
 */
class DeviceDiscoveryService extends shared_2.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            name: options.name || os.hostname(),
            port: options.port || shared_3.DEFAULT_PORT,
            autoStart: options.autoStart !== false,
            enableIPv6: options.enableIPv6 !== false,
            interfaceFilter: options.interfaceFilter || (() => true),
        };
        this.bonjour = new bonjour_service_1.Bonjour();
        this.discoveredDevices = new Map();
        this.localDevice = this.createLocalDevice();
        if (this.options.autoStart) {
            this.start();
        }
    }
    /**
     * Create local device information
     */
    createLocalDevice() {
        const { publicKey, privateKey } = (0, shared_2.generateKeyPair)();
        const networkInterfaces = this.getNetworkInterfaces();
        const primaryInterface = networkInterfaces[0];
        // Store private key securely (in production, use keychain/credential store)
        process.env.PORTAL_FUSION_PRIVATE_KEY = privateKey;
        return {
            id: (0, shared_2.generateDeviceId)(),
            name: this.options.name,
            platform: (0, shared_2.getPlatform)(),
            type: this.getDeviceType(),
            hostname: os.hostname(),
            ip: primaryInterface?.address || '127.0.0.1',
            port: this.options.port,
            publicKey,
            capabilities: this.getDeviceCapabilities(),
            status: shared_1.DeviceStatus.ONLINE,
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
    getDeviceType() {
        const platform = (0, shared_2.getPlatform)();
        const batteryInfo = this.hasBattery();
        if (platform === shared_1.Platform.WINDOWS && batteryInfo) {
            // Windows tablet or laptop
            return this.hasTouch() ? shared_1.DeviceType.TABLET : shared_1.DeviceType.LAPTOP;
        }
        else if (platform === shared_1.Platform.MACOS) {
            // MacBook or Mac desktop
            return batteryInfo ? shared_1.DeviceType.LAPTOP : shared_1.DeviceType.DESKTOP;
        }
        else {
            // Default based on battery presence
            return batteryInfo ? shared_1.DeviceType.LAPTOP : shared_1.DeviceType.DESKTOP;
        }
    }
    /**
     * Check if device has battery (laptop/tablet indicator)
     */
    hasBattery() {
        try {
            // This is a simplified check - in production, use native modules
            // for accurate battery detection
            const platform = (0, shared_2.getPlatform)();
            if (platform === shared_1.Platform.MACOS) {
                // Check for MacBook model
                return os.hostname().toLowerCase().includes('macbook');
            }
            return false;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if device has touch support
     */
    hasTouch() {
        // In production, use native modules to detect touch support
        return false;
    }
    /**
     * Get device model information
     */
    getDeviceModel() {
        const platform = (0, shared_2.getPlatform)();
        if (platform === shared_1.Platform.MACOS) {
            // In production, use system_profiler to get exact model
            return 'MacBook Air';
        }
        else if (platform === shared_1.Platform.WINDOWS) {
            // In production, use WMI to get model information
            return 'Windows Device';
        }
        return 'Unknown';
    }
    /**
     * Get device capabilities
     */
    getDeviceCapabilities() {
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
    hasCamera() {
        // In production, enumerate media devices
        return true; // Most modern devices have cameras
    }
    /**
     * Check if device has biometric authentication
     */
    hasBiometric() {
        const platform = (0, shared_2.getPlatform)();
        if (platform === shared_1.Platform.MACOS) {
            // Check for Touch ID support
            return true; // Most modern Macs have Touch ID
        }
        else if (platform === shared_1.Platform.WINDOWS) {
            // Check for Windows Hello
            return false; // Requires native module to detect
        }
        return false;
    }
    /**
     * Get storage information
     */
    getStorageInfo() {
        try {
            // In production, use proper disk space detection
            return {
                available: 100 * 1024 * 1024 * 1024, // 100GB placeholder
                total: 500 * 1024 * 1024 * 1024, // 500GB placeholder
            };
        }
        catch {
            return { available: 0, total: 0 };
        }
    }
    /**
     * Get network interfaces
     */
    getNetworkInterfaces() {
        const interfaces = [];
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            const netInterfaces = nets[name];
            if (!netInterfaces)
                continue;
            for (const net of netInterfaces) {
                // Skip internal and non-IPv4 addresses
                if (net.internal || net.family !== 'IPv4')
                    continue;
                // Apply custom filter
                if (!this.options.interfaceFilter(net))
                    continue;
                interfaces.push({
                    name,
                    address: (0, shared_2.normalizeIP)(net.address),
                });
            }
        }
        // Sort to prioritize non-local addresses
        return interfaces.sort((a, b) => {
            const aLocal = (0, shared_2.isLocalIP)(a.address);
            const bLocal = (0, shared_2.isLocalIP)(b.address);
            if (aLocal === bLocal)
                return 0;
            return aLocal ? 1 : -1;
        });
    }
    /**
     * Start discovery service
     */
    async start() {
        try {
            // Start advertising local device
            this.startAdvertising();
            // Start browsing for other devices
            this.startBrowsing();
            // Start heartbeat monitoring
            this.startHeartbeat();
            console.log(`🔍 Discovery service started on ${this.localDevice.ip}:${this.localDevice.port}`);
        }
        catch (error) {
            console.error('Failed to start discovery service:', error);
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Start advertising local device via mDNS
     */
    startAdvertising() {
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
            name: `${shared_3.SERVICE_NAME}-${this.localDevice.id}`,
            type: shared_3.MDNS_SERVICE_TYPE,
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
    startBrowsing() {
        this.browser = this.bonjour.find({ type: shared_3.MDNS_SERVICE_TYPE });
        this.browser.on('up', (service) => {
            this.handleDeviceFound(service);
        });
        this.browser.on('down', (service) => {
            this.handleDeviceLost(service);
        });
    }
    /**
     * Handle discovered device
     */
    handleDeviceFound(service) {
        try {
            // Parse device information from service
            const txt = service.txt;
            // Skip self-discovery
            if (txt.id === this.localDevice.id)
                return;
            // Parse capabilities
            let capabilities;
            try {
                capabilities = JSON.parse(txt.capabilities || '{}');
            }
            catch {
                capabilities = this.getDefaultCapabilities();
            }
            // Create discovered device
            const device = {
                id: txt.id,
                name: txt.name || service.name,
                platform: txt.platform,
                type: txt.type,
                hostname: service.host,
                ip: (0, shared_2.normalizeIP)(service.addresses?.[0] || service.host),
                port: service.port,
                publicKey: txt.publicKey,
                capabilities,
                status: shared_1.DeviceStatus.ONLINE,
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
            }
            else {
                // Add new device
                this.discoveredDevices.set(device.id, device);
                this.emit('device:discovered', device);
                console.log(`✨ Discovered device: ${device.name} (${device.platform})`);
            }
        }
        catch (error) {
            console.error('Error handling discovered device:', error);
        }
    }
    /**
     * Handle lost device
     */
    handleDeviceLost(service) {
        try {
            const txt = service.txt;
            const deviceId = txt.id;
            if (!deviceId)
                return;
            const device = this.discoveredDevices.get(deviceId);
            if (device) {
                device.status = shared_1.DeviceStatus.OFFLINE;
                this.emit('device:disconnected', device);
                this.discoveredDevices.delete(deviceId);
                console.log(`👋 Lost device: ${device.name}`);
            }
        }
        catch (error) {
            console.error('Error handling lost device:', error);
        }
    }
    /**
     * Get default capabilities for fallback
     */
    getDefaultCapabilities() {
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
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const timeout = 30000; // 30 seconds
            // Check for stale devices
            for (const [id, device] of this.discoveredDevices) {
                const timeSinceHeartbeat = now.getTime() - device.lastHeartbeat.getTime();
                if (timeSinceHeartbeat > timeout && device.status === shared_1.DeviceStatus.ONLINE) {
                    device.status = shared_1.DeviceStatus.OFFLINE;
                    this.emit('device:disconnected', device);
                    console.log(`💔 Device timeout: ${device.name}`);
                }
            }
        }, 5000); // Check every 5 seconds
    }
    /**
     * Stop discovery service
     */
    async stop() {
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
    getLocalDevice() {
        return { ...this.localDevice };
    }
    /**
     * Get all discovered devices
     */
    getDiscoveredDevices() {
        return Array.from(this.discoveredDevices.values()).map(device => ({
            ...device,
            service: undefined, // Don't expose internal service object
        }));
    }
    /**
     * Get device by ID
     */
    getDevice(id) {
        const device = this.discoveredDevices.get(id);
        if (!device)
            return undefined;
        return {
            ...device,
            service: undefined,
        };
    }
    /**
     * Update local device information
     */
    updateLocalDevice(updates) {
        Object.assign(this.localDevice, updates);
        // Restart advertising with new information
        if (this.advertisement) {
            this.advertisement.stop();
            this.advertisement = undefined;
            this.startAdvertising();
        }
    }
    /**
     * Refresh discovery (force re-scan)
     */
    refresh() {
        if (this.browser) {
            this.browser.update();
        }
    }
}
exports.DeviceDiscoveryService = DeviceDiscoveryService;
// Export singleton instance for convenience
exports.discoveryService = new DeviceDiscoveryService();
//# sourceMappingURL=discovery.js.map
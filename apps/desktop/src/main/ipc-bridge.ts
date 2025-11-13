import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { NativeBridge } from './native-bridge';
import { NotificationManager } from './notifications';
import { PermissionManager } from './permissions';

// Import protocol services
import {
  discoveryService,
  pairingService,
  connectionManager,
  eventBus,
} from '@portal-fusion/protocol';

/**
 * IPC Bridge
 * Handles communication between main and renderer processes
 * Integrates Portal Fusion protocol services with Electron
 */
export class IPCBridge {
  private window: BrowserWindow;
  private nativeBridge: NativeBridge;
  private notificationManager: NotificationManager;
  private permissionManager: PermissionManager;

  constructor(
    window: BrowserWindow,
    nativeBridge: NativeBridge,
    notificationManager: NotificationManager,
    permissionManager: PermissionManager
  ) {
    this.window = window;
    this.nativeBridge = nativeBridge;
    this.notificationManager = notificationManager;
    this.permissionManager = permissionManager;

    this.setupHandlers();
    this.setupEventForwarding();
  }

  private setupHandlers(): void {
    // Native Bridge
    ipcMain.handle('native:getClipboard', () => {
      return this.nativeBridge.getClipboard();
    });

    ipcMain.handle('native:setClipboard', (event, content) => {
      this.nativeBridge.setClipboard(content);
    });

    ipcMain.handle('native:getSystemInfo', () => {
      return this.nativeBridge.getSystemInfo();
    });

    ipcMain.handle('native:getDisplays', () => {
      return this.nativeBridge.getDisplays();
    });

    ipcMain.handle('native:getSources', async () => {
      return await this.nativeBridge.getSources();
    });

    ipcMain.handle('native:lockSystem', async () => {
      await this.nativeBridge.lockSystem();
    });

    ipcMain.handle('native:sleepSystem', async () => {
      await this.nativeBridge.sleepSystem();
    });

    ipcMain.handle('native:getBatteryInfo', async () => {
      return await this.nativeBridge.getBatteryInfo();
    });

    ipcMain.handle('native:getNetworkInterfaces', () => {
      return this.nativeBridge.getNetworkInterfaces();
    });

    // Notifications
    ipcMain.handle('notification:show', (event, options) => {
      return this.notificationManager.show(options);
    });

    ipcMain.handle('notification:close', (event, id) => {
      this.notificationManager.close(id);
    });

    // Permissions
    ipcMain.handle('permission:requestCamera', async () => {
      return await this.permissionManager.requestCameraPermission();
    });

    ipcMain.handle('permission:requestMicrophone', async () => {
      return await this.permissionManager.requestMicrophonePermission();
    });

    ipcMain.handle('permission:requestScreen', async () => {
      return await this.permissionManager.requestScreenPermission();
    });

    ipcMain.handle('permission:requestAccessibility', async () => {
      return await this.permissionManager.requestAccessibilityPermission();
    });

    ipcMain.handle('permission:getAll', () => {
      return this.permissionManager.getAllPermissions();
    });

    // Discovery Service
    ipcMain.handle('discovery:start', async () => {
      await discoveryService.start();
    });

    ipcMain.handle('discovery:stop', async () => {
      await discoveryService.stop();
    });

    ipcMain.handle('discovery:getLocalDevice', () => {
      return discoveryService.getLocalDevice();
    });

    ipcMain.handle('discovery:getDevices', () => {
      return discoveryService.getDiscoveredDevices();
    });

    ipcMain.handle('discovery:refresh', () => {
      discoveryService.refresh();
    });

    // Pairing Service
    ipcMain.handle('pairing:initiate', async (event, device) => {
      return await pairingService.initiatePairing(device);
    });

    ipcMain.handle('pairing:join', async (event, qrData, localDevice) => {
      const pairingData = await pairingService.scanQRCode(qrData);
      return await pairingService.joinPairing(pairingData, localDevice);
    });

    ipcMain.handle('pairing:verifyPin', async (event, sessionId, pin) => {
      return await pairingService.verifyPin(sessionId, pin);
    });

    ipcMain.handle('pairing:complete', async (event, sessionId) => {
      return await pairingService.completePairing(sessionId);
    });

    ipcMain.handle('pairing:cancel', (event, sessionId) => {
      pairingService.cancelPairing(sessionId);
    });

    ipcMain.handle('pairing:getPairedDevices', () => {
      return pairingService.getPairedDevices();
    });

    ipcMain.handle('pairing:unpair', (event, deviceId) => {
      pairingService.unpairDevice(deviceId);
    });

    // Connection Manager
    ipcMain.handle('connection:connect', async (event, device) => {
      const localDevice = discoveryService.getLocalDevice();
      connectionManager.setLocalDevice(localDevice);
      return await connectionManager.connect(device);
    });

    ipcMain.handle('connection:disconnect', (event, deviceId) => {
      connectionManager.disconnect(deviceId);
    });

    ipcMain.handle('connection:getConnections', () => {
      return connectionManager.getConnections();
    });

    ipcMain.handle('connection:sendMessage', async (event, deviceId, message) => {
      await connectionManager.sendMessage(deviceId, message);
    });

    // Event Bus
    ipcMain.handle('eventbus:getActivityLog', (event, limit) => {
      return eventBus.getActivityLog(limit);
    });

    ipcMain.handle('eventbus:clearActivityLog', () => {
      eventBus.clearActivityLog();
    });
  }

  /**
   * Forward events from protocol services to renderer
   */
  private setupEventForwarding(): void {
    // Discovery events
    eventBus.on('device:discovered', (device) => {
      this.window.webContents.send('device:discovered', device);
      log.info('Device discovered:', device.name);
    });

    eventBus.on('device:connected', (device) => {
      this.window.webContents.send('device:connected', device);
      this.notificationManager.showDeviceConnected(device.name);
      log.info('Device connected:', device.name);
    });

    eventBus.on('device:disconnected', (device) => {
      this.window.webContents.send('device:disconnected', device);
      this.notificationManager.showDeviceDisconnected(device.name);
      log.info('Device disconnected:', device.name);
    });

    eventBus.on('device:paired', (device) => {
      this.window.webContents.send('device:paired', device);
      log.info('Device paired:', device.name);
    });

    // Message events
    eventBus.on('message:received', (message) => {
      this.window.webContents.send('message:received', message);
    });

    eventBus.on('message:sent', (message) => {
      this.window.webContents.send('message:sent', message);
    });

    // File transfer events
    eventBus.on('file:transfer:start', (transfer) => {
      this.window.webContents.send('file:transfer:start', transfer);
      log.info('File transfer started:', transfer.fileName);
    });

    eventBus.on('file:transfer:progress', (transfer) => {
      this.window.webContents.send('file:transfer:progress', transfer);
    });

    eventBus.on('file:transfer:complete', (transfer) => {
      this.window.webContents.send('file:transfer:complete', transfer);
      this.notificationManager.showFileTransferComplete(transfer.fileName);
      log.info('File transfer complete:', transfer.fileName);
    });

    // Clipboard events
    eventBus.on('clipboard:changed', (data) => {
      this.window.webContents.send('clipboard:changed', data);
    });

    // Screen share events
    eventBus.on('screen:share:start', (share) => {
      this.window.webContents.send('screen:share:start', share);
      log.info('Screen share started');
    });

    eventBus.on('screen:share:stop', (share) => {
      this.window.webContents.send('screen:share:stop', share);
      log.info('Screen share stopped');
    });

    // Error events
    eventBus.on('error', (error) => {
      this.window.webContents.send('error', error);
      log.error('Error:', error);
    });

    eventBus.on('warning', (warning) => {
      this.window.webContents.send('warning', warning);
      log.warn('Warning:', warning);
    });

    // Activity events
    eventBus.on('activity', (activity) => {
      this.window.webContents.send('activity', activity);
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove all IPC handlers
    ipcMain.removeHandler('native:getClipboard');
    ipcMain.removeHandler('native:setClipboard');
    ipcMain.removeHandler('native:getSystemInfo');
    ipcMain.removeHandler('native:getDisplays');
    ipcMain.removeHandler('native:getSources');
    ipcMain.removeHandler('native:lockSystem');
    ipcMain.removeHandler('native:sleepSystem');
    ipcMain.removeHandler('native:getBatteryInfo');
    ipcMain.removeHandler('native:getNetworkInterfaces');
    ipcMain.removeHandler('notification:show');
    ipcMain.removeHandler('notification:close');
    ipcMain.removeHandler('permission:requestCamera');
    ipcMain.removeHandler('permission:requestMicrophone');
    ipcMain.removeHandler('permission:requestScreen');
    ipcMain.removeHandler('permission:requestAccessibility');
    ipcMain.removeHandler('permission:getAll');
    ipcMain.removeHandler('discovery:start');
    ipcMain.removeHandler('discovery:stop');
    ipcMain.removeHandler('discovery:getLocalDevice');
    ipcMain.removeHandler('discovery:getDevices');
    ipcMain.removeHandler('discovery:refresh');
    ipcMain.removeHandler('pairing:initiate');
    ipcMain.removeHandler('pairing:join');
    ipcMain.removeHandler('pairing:verifyPin');
    ipcMain.removeHandler('pairing:complete');
    ipcMain.removeHandler('pairing:cancel');
    ipcMain.removeHandler('pairing:getPairedDevices');
    ipcMain.removeHandler('pairing:unpair');
    ipcMain.removeHandler('connection:connect');
    ipcMain.removeHandler('connection:disconnect');
    ipcMain.removeHandler('connection:getConnections');
    ipcMain.removeHandler('connection:sendMessage');
    ipcMain.removeHandler('eventbus:getActivityLog');
    ipcMain.removeHandler('eventbus:clearActivityLog');
  }
}

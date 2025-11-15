import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import log from 'electron-log';
import { SystemTrayManager } from './tray';
import { AutoLaunchManager } from './autolaunch';
import { NotificationManager } from './notifications';
import { PermissionManager } from './permissions';
import { IPCBridge } from './ipc-bridge';
import { NativeBridge } from './native-bridge';
import { FeaturesManager } from './features-manager';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Initialize store
const store = new Store({
  name: 'portal-fusion-config',
  defaults: {
    settings: {
      autoLaunch: false,
      minimizeToTray: true,
      startMinimized: false,
      notifications: true,
      theme: 'system',
    },
    window: {
      width: 1200,
      height: 800,
      x: undefined,
      y: undefined,
    },
  },
});

class PortalFusionApp {
  private mainWindow: BrowserWindow | null = null;
  private trayManager: SystemTrayManager | null = null;
  private autoLaunchManager: AutoLaunchManager | null = null;
  private notificationManager: NotificationManager | null = null;
  private permissionManager: PermissionManager | null = null;
  private ipcBridge: IPCBridge | null = null;
  private nativeBridge: NativeBridge | null = null;
  private featuresManager: FeaturesManager | null = null;
  private isQuitting = false;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    // Make app single instance
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.portalfusion.app');
    }

    // Handle app events
    app.on('ready', () => this.onReady());
    app.on('activate', () => this.onActivate());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    // Handle IPC events
    this.setupIPC();
  }

  private async onReady(): Promise<void> {
    log.info('App ready, initializing...');

    try {
      // Initialize managers
      this.autoLaunchManager = new AutoLaunchManager();
      this.notificationManager = new NotificationManager();
      this.permissionManager = new PermissionManager();
      this.nativeBridge = new NativeBridge();

      // Apply auto-launch setting
      const autoLaunch = store.get('settings.autoLaunch') as boolean;
      if (autoLaunch) {
        await this.autoLaunchManager.enable();
      }

      // Create window
      await this.createMainWindow();

      // Create system tray
      this.trayManager = new SystemTrayManager(
        this.mainWindow!,
        () => this.quit()
      );

      // Initialize IPC bridge
      this.ipcBridge = new IPCBridge(
        this.mainWindow!,
        this.nativeBridge,
        this.notificationManager,
        this.permissionManager
      );

      // Initialize features manager
      this.featuresManager = new FeaturesManager(
        this.mainWindow!,
        this.nativeBridge
      );
      await this.featuresManager.initialize();

      // Check for updates
      this.setupAutoUpdater();

      log.info('App initialized successfully');
    } catch (error) {
      log.error('Failed to initialize app:', error);
      dialog.showErrorBox('Initialization Error', `Failed to start Portal Fusion: ${error}`);
      app.quit();
    }
  }

  private async createMainWindow(): Promise<void> {
    const windowState = store.get('window') as any;
    const startMinimized = store.get('settings.startMinimized') as boolean;

    this.mainWindow = new BrowserWindow({
      width: windowState.width || 1200,
      height: windowState.height || 800,
      x: windowState.x,
      y: windowState.y,
      minWidth: 800,
      minHeight: 600,
      show: !startMinimized,
      frame: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      backgroundColor: '#FFFFFF',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
      icon: this.getAppIcon(),
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Window event handlers
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && store.get('settings.minimizeToTray')) {
        event.preventDefault();
        this.mainWindow?.hide();

        // Show notification on first minimize
        if (!store.get('tray.notificationShown')) {
          this.notificationManager?.show({
            title: 'Portal Fusion',
            body: 'Portal Fusion is still running in the background',
          });
          store.set('tray.notificationShown', true);
        }
      } else {
        this.saveWindowState();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('move', () => this.saveWindowState());

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private getAppIcon(): string | Electron.NativeImage {
    if (process.platform === 'darwin') {
      return path.join(__dirname, '../../assets/icons/icon.icns');
    } else if (process.platform === 'win32') {
      return path.join(__dirname, '../../assets/icons/icon.ico');
    } else {
      return path.join(__dirname, '../../assets/icons/512x512.png');
    }
  }

  private saveWindowState(): void {
    if (!this.mainWindow) return;

    const bounds = this.mainWindow.getBounds();
    store.set('window', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
  }

  private onActivate(): void {
    // On macOS, re-create window when dock icon is clicked
    if (this.mainWindow === null && process.platform === 'darwin') {
      this.createMainWindow();
    } else if (this.mainWindow) {
      this.mainWindow.show();
    }
  }

  private onWindowAllClosed(): void {
    // On macOS, apps stay active until explicitly quit
    if (process.platform !== 'darwin') {
      this.quit();
    }
  }

  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);

      const result = dialog.showMessageBoxSync(this.mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available. Would you like to download it?`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
      });
      if (result === 0) {
        autoUpdater.downloadUpdate();
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);

      const result = dialog.showMessageBoxSync(this.mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The application will restart to apply the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
      });
      if (result === 0) {
        this.isQuitting = true;
        autoUpdater.quitAndInstall();
      }
    });

    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
    });

    // Check for updates on startup (after 5 seconds)
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 5000);

    // Check for updates every 4 hours
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 4 * 60 * 60 * 1000);
  }

  private setupIPC(): void {
    // App control
    ipcMain.handle('app:get-version', () => app.getVersion());
    ipcMain.handle('app:get-platform', () => process.platform);
    ipcMain.handle('app:get-arch', () => process.arch);
    ipcMain.handle('app:quit', () => this.quit());
    ipcMain.handle('app:relaunch', () => {
      app.relaunch();
      this.quit();
    });

    // Window control
    ipcMain.handle('window:minimize', () => this.mainWindow?.minimize());
    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });
    ipcMain.handle('window:close', () => this.mainWindow?.close());
    ipcMain.handle('window:show', () => this.mainWindow?.show());
    ipcMain.handle('window:hide', () => this.mainWindow?.hide());

    // Settings
    ipcMain.handle('settings:get', (event, key: string) => store.get(key));
    ipcMain.handle('settings:set', (event, key: string, value: any) => {
      store.set(key, value);

      // Handle auto-launch setting
      if (key === 'settings.autoLaunch') {
        if (value) {
          this.autoLaunchManager?.enable();
        } else {
          this.autoLaunchManager?.disable();
        }
      }
    });
    ipcMain.handle('settings:getAll', () => store.store);

    // Update control
    ipcMain.handle('update:check', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
        return result?.updateInfo || null;
      } catch (error) {
        log.error('Failed to check for updates:', error);
        return null;
      }
    });
    ipcMain.handle('update:download', () => autoUpdater.downloadUpdate());
    ipcMain.handle('update:install', () => {
      this.isQuitting = true;
      autoUpdater.quitAndInstall();
    });

    // Dialog
    ipcMain.handle('dialog:open', async (event, options) => {
      return dialog.showOpenDialog(this.mainWindow!, options);
    });
    ipcMain.handle('dialog:save', async (event, options) => {
      return dialog.showSaveDialog(this.mainWindow!, options);
    });

    // Shell
    ipcMain.handle('shell:openExternal', async (event, url: string) => {
      return shell.openExternal(url);
    });
    ipcMain.handle('shell:showItemInFolder', async (event, path: string) => {
      return shell.showItemInFolder(path);
    });
  }

  private quit(): void {
    this.isQuitting = true;

    // Cleanup
    this.trayManager?.destroy();
    this.ipcBridge?.destroy();
    this.nativeBridge?.destroy();
    this.featuresManager?.destroy();

    app.quit();
  }
}

// Create app instance
new PortalFusionApp();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});

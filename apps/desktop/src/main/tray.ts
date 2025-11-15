import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';

export class SystemTrayManager {
  private tray: Tray | null = null;
  private window: BrowserWindow;
  private quitCallback: () => void;

  constructor(window: BrowserWindow, quitCallback: () => void) {
    this.window = window;
    this.quitCallback = quitCallback;
    this.createTray();
  }

  private createTray(): void {
    const iconPath = this.getTrayIcon();
    const icon = nativeImage.createFromPath(iconPath);

    // Resize for tray (platform specific)
    let resizedIcon = icon;
    if (process.platform === 'darwin') {
      resizedIcon = icon.resize({ width: 16, height: 16 });
    } else if (process.platform === 'win32') {
      resizedIcon = icon.resize({ width: 16, height: 16 });
    }

    this.tray = new Tray(resizedIcon);
    this.tray.setToolTip('Portal Fusion');

    this.updateContextMenu();

    // Click to show/hide window
    this.tray.on('click', () => {
      if (this.window.isVisible()) {
        this.window.hide();
      } else {
        this.window.show();
        this.window.focus();
      }
    });

    // Double click to show window (Windows/Linux)
    this.tray.on('double-click', () => {
      this.window.show();
      this.window.focus();
    });
  }

  private getTrayIcon(): string {
    if (process.platform === 'darwin') {
      return path.join(__dirname, '../../assets/icons/trayTemplate.png');
    } else if (process.platform === 'win32') {
      return path.join(__dirname, '../../assets/icons/tray.ico');
    } else {
      return path.join(__dirname, '../../assets/icons/tray.png');
    }
  }

  updateContextMenu(connectedDevices: number = 0): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Portal Fusion',
        enabled: false,
        icon: this.getSmallIcon(),
      },
      { type: 'separator' },
      {
        label: `Connected Devices: ${connectedDevices}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Show Window',
        click: () => {
          this.window.show();
          this.window.focus();
        },
      },
      {
        label: 'Hide Window',
        click: () => {
          this.window.hide();
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          this.window.show();
          this.window.focus();
          this.window.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Portal Fusion',
        click: () => {
          this.quitCallback();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private getSmallIcon(): Electron.NativeImage | undefined {
    try {
      const iconPath = this.getTrayIcon();
      const icon = nativeImage.createFromPath(iconPath);
      return icon.resize({ width: 16, height: 16 });
    } catch {
      return undefined;
    }
  }

  showNotification(title: string, body: string): void {
    if (this.tray) {
      this.tray.displayBalloon({
        title,
        content: body,
        icon: this.getSmallIcon(),
      });
    }
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

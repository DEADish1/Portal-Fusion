import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import log from 'electron-log';

export class AutoLaunchManager {
  private appName = 'Portal Fusion';
  private appPath: string;

  constructor() {
    this.appPath = app.getPath('exe');
  }

  /**
   * Enable auto-launch on system startup
   */
  async enable(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await this.enableMacOS();
      } else if (process.platform === 'win32') {
        await this.enableWindows();
      } else if (process.platform === 'linux') {
        await this.enableLinux();
      }

      log.info('Auto-launch enabled');
    } catch (error) {
      log.error('Failed to enable auto-launch:', error);
      throw error;
    }
  }

  /**
   * Disable auto-launch
   */
  async disable(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await this.disableMacOS();
      } else if (process.platform === 'win32') {
        await this.disableWindows();
      } else if (process.platform === 'linux') {
        await this.disableLinux();
      }

      log.info('Auto-launch disabled');
    } catch (error) {
      log.error('Failed to disable auto-launch:', error);
      throw error;
    }
  }

  /**
   * Check if auto-launch is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      if (process.platform === 'darwin') {
        return await this.isEnabledMacOS();
      } else if (process.platform === 'win32') {
        return await this.isEnabledWindows();
      } else if (process.platform === 'linux') {
        return await this.isEnabledLinux();
      }
      return false;
    } catch (error) {
      log.error('Failed to check auto-launch status:', error);
      return false;
    }
  }

  // macOS implementation
  private async enableMacOS(): Promise<void> {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
      name: this.appName,
    });
  }

  private async disableMacOS(): Promise<void> {
    app.setLoginItemSettings({
      openAtLogin: false,
      name: this.appName,
    });
  }

  private async isEnabledMacOS(): Promise<boolean> {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }

  // Windows implementation
  private async enableWindows(): Promise<void> {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
      path: this.appPath,
      args: ['--hidden'],
    });
  }

  private async disableWindows(): Promise<void> {
    app.setLoginItemSettings({
      openAtLogin: false,
      path: this.appPath,
    });
  }

  private async isEnabledWindows(): Promise<boolean> {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }

  // Linux implementation (using .desktop file)
  private async enableLinux(): Promise<void> {
    const autostartDir = path.join(os.homedir(), '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'portal-fusion.desktop');

    // Create autostart directory if it doesn't exist
    await fs.mkdir(autostartDir, { recursive: true });

    // Create .desktop file
    const content = `[Desktop Entry]
Type=Application
Name=${this.appName}
Comment=Seamless computing, unified
Exec="${this.appPath}" --hidden
Icon=portal-fusion
Terminal=false
Categories=Utility;Network;
StartupNotify=false
X-GNOME-Autostart-enabled=true
`;

    await fs.writeFile(desktopFile, content, { mode: 0o755 });
  }

  private async disableLinux(): Promise<void> {
    const autostartDir = path.join(os.homedir(), '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'portal-fusion.desktop');

    try {
      await fs.unlink(desktopFile);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async isEnabledLinux(): Promise<boolean> {
    const autostartDir = path.join(os.homedir(), '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'portal-fusion.desktop');

    try {
      await fs.access(desktopFile);
      return true;
    } catch {
      return false;
    }
  }
}

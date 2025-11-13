import { clipboard, nativeImage, NativeImage, desktopCapturer, screen } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import log from 'electron-log';

const execAsync = promisify(exec);

export interface ClipboardContent {
  type: 'text' | 'image' | 'html' | 'rtf';
  data: string | Buffer;
  formats: string[];
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  osVersion: string;
  totalMemory: number;
  freeMemory: number;
  cpuModel: string;
  cpuCores: number;
  uptime: number;
}

export interface DisplayInfo {
  id: number;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  size: { width: number; height: number };
  scaleFactor: number;
  rotation: number;
  internal: boolean;
  primary: boolean;
}

/**
 * Native Bridge for OS-specific operations
 * Provides unified API for native functionality across platforms
 */
export class NativeBridge {
  /**
   * Get clipboard content
   */
  getClipboard(): ClipboardContent {
    const formats = clipboard.availableFormats();

    // Check for image first
    if (formats.includes('image/png') || formats.includes('image/jpeg')) {
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        return {
          type: 'image',
          data: image.toPNG(),
          formats,
        };
      }
    }

    // Check for HTML
    const html = clipboard.readHTML();
    if (html) {
      return {
        type: 'html',
        data: html,
        formats,
      };
    }

    // Check for RTF (macOS/Windows)
    const rtf = clipboard.readRTF();
    if (rtf) {
      return {
        type: 'rtf',
        data: rtf,
        formats,
      };
    }

    // Default to text
    return {
      type: 'text',
      data: clipboard.readText(),
      formats,
    };
  }

  /**
   * Set clipboard content
   */
  setClipboard(content: ClipboardContent): void {
    switch (content.type) {
      case 'text':
        clipboard.writeText(content.data as string);
        break;
      case 'image':
        const image = nativeImage.createFromBuffer(content.data as Buffer);
        clipboard.writeImage(image);
        break;
      case 'html':
        clipboard.writeHTML(content.data as string);
        break;
      case 'rtf':
        clipboard.writeRTF(content.data as string);
        break;
    }
  }

  /**
   * Clear clipboard
   */
  clearClipboard(): void {
    clipboard.clear();
  }

  /**
   * Get system information
   */
  getSystemInfo(): SystemInfo {
    const cpus = os.cpus();

    return {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      osVersion: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuModel: cpus[0]?.model || 'Unknown',
      cpuCores: cpus.length,
      uptime: os.uptime(),
    };
  }

  /**
   * Get display information
   */
  getDisplays(): DisplayInfo[] {
    const displays = screen.getAllDisplays();

    return displays.map((display) => ({
      id: display.id,
      name: display.label || `Display ${display.id}`,
      bounds: display.bounds,
      size: display.size,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      primary: display.id === screen.getPrimaryDisplay().id,
    }));
  }

  /**
   * Get primary display
   */
  getPrimaryDisplay(): DisplayInfo {
    const display = screen.getPrimaryDisplay();

    return {
      id: display.id,
      name: display.label || `Display ${display.id}`,
      bounds: display.bounds,
      size: display.size,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      primary: true,
    };
  }

  /**
   * Get available audio/video sources for screen capture
   */
  async getSources(): Promise<Array<{
    id: string;
    name: string;
    thumbnail: string;
    display_id?: string;
    appIcon?: string;
  }>> {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 150, height: 150 },
    });

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
      appIcon: source.appIcon?.toDataURL(),
    }));
  }

  /**
   * Lock the system (require password to unlock)
   */
  async lockSystem(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await execAsync('/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend');
      } else if (process.platform === 'win32') {
        await execAsync('rundll32.exe user32.dll,LockWorkStation');
      } else if (process.platform === 'linux') {
        // Try different lock commands based on desktop environment
        try {
          await execAsync('gnome-screensaver-command -l');
        } catch {
          try {
            await execAsync('xdg-screensaver lock');
          } catch {
            await execAsync('loginctl lock-session');
          }
        }
      }
    } catch (error) {
      log.error('Failed to lock system:', error);
      throw error;
    }
  }

  /**
   * Sleep/suspend the system
   */
  async sleepSystem(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await execAsync('pmset sleepnow');
      } else if (process.platform === 'win32') {
        await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
      } else if (process.platform === 'linux') {
        await execAsync('systemctl suspend');
      }
    } catch (error) {
      log.error('Failed to sleep system:', error);
      throw error;
    }
  }

  /**
   * Shutdown the system
   */
  async shutdownSystem(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await execAsync('shutdown -h now');
      } else if (process.platform === 'win32') {
        await execAsync('shutdown /s /t 0');
      } else if (process.platform === 'linux') {
        await execAsync('shutdown -h now');
      }
    } catch (error) {
      log.error('Failed to shutdown system:', error);
      throw error;
    }
  }

  /**
   * Restart the system
   */
  async restartSystem(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await execAsync('shutdown -r now');
      } else if (process.platform === 'win32') {
        await execAsync('shutdown /r /t 0');
      } else if (process.platform === 'linux') {
        await execAsync('shutdown -r now');
      }
    } catch (error) {
      log.error('Failed to restart system:', error);
      throw error;
    }
  }

  /**
   * Get battery information
   */
  async getBatteryInfo(): Promise<{
    hasBattery: boolean;
    charging: boolean;
    level: number;
    timeToEmpty?: number;
    timeToFull?: number;
  } | null> {
    try {
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('pmset -g batt');
        const match = stdout.match(/(\d+)%.*?(?:(\d+):(\d+))?/);

        if (match) {
          return {
            hasBattery: true,
            charging: stdout.includes('AC Power'),
            level: parseInt(match[1]),
            timeToEmpty: match[2] && match[3] ? parseInt(match[2]) * 60 + parseInt(match[3]) : undefined,
          };
        }
      } else if (process.platform === 'linux') {
        try {
          const capacity = await fs.readFile('/sys/class/power_supply/BAT0/capacity', 'utf8');
          const status = await fs.readFile('/sys/class/power_supply/BAT0/status', 'utf8');

          return {
            hasBattery: true,
            charging: status.trim() === 'Charging',
            level: parseInt(capacity),
          };
        } catch {
          return null;
        }
      }
      // Windows battery info would require PowerShell or WMI

      return null;
    } catch (error) {
      log.error('Failed to get battery info:', error);
      return null;
    }
  }

  /**
   * Get network interfaces
   */
  getNetworkInterfaces(): Array<{
    name: string;
    address: string;
    mac: string;
    internal: boolean;
    family: string;
  }> {
    const interfaces = os.networkInterfaces();
    const result: Array<any> = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      if (!addresses) continue;

      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          result.push({
            name,
            address: addr.address,
            mac: addr.mac,
            internal: addr.internal,
            family: addr.family,
          });
        }
      }
    }

    return result;
  }

  /**
   * Beep/play system sound
   */
  beep(): void {
    // This would require platform-specific implementation
    // For now, just log
    log.info('Beep requested');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Cleanup if needed
  }
}

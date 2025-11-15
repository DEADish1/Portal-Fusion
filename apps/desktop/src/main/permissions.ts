import { systemPreferences, dialog } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';

const execAsync = promisify(exec);

export enum PermissionType {
  CAMERA = 'camera',
  MICROPHONE = 'microphone',
  SCREEN = 'screen',
  ACCESSIBILITY = 'accessibility',
  FULL_DISK_ACCESS = 'full-disk-access',
}

export class PermissionManager {
  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('camera');

      if (status === 'not-determined') {
        return await systemPreferences.askForMediaAccess('camera');
      }

      return status === 'granted';
    }

    // On Windows/Linux, assume granted (handled by OS)
    return true;
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('microphone');

      if (status === 'not-determined') {
        return await systemPreferences.askForMediaAccess('microphone');
      }

      return status === 'granted';
    }

    // On Windows/Linux, assume granted (handled by OS)
    return true;
  }

  /**
   * Request screen recording permission (macOS)
   */
  async requestScreenPermission(): Promise<boolean> {
    if (process.platform === 'darwin') {
      try {
        const status = systemPreferences.getMediaAccessStatus('screen');

        if (status === 'granted') {
          return true;
        }

        // On macOS, we can't programmatically request screen recording permission
        // We need to guide the user to System Preferences
        const result = await dialog.showMessageBox({
          type: 'info',
          title: 'Screen Recording Permission Required',
          message: 'Portal Fusion needs permission to record your screen for screen sharing features.',
          detail: 'Click "Open System Preferences" to grant screen recording permission. You may need to restart Portal Fusion after granting permission.',
          buttons: ['Open System Preferences', 'Later'],
          defaultId: 0,
        });

        if (result === 0) {
          // Open System Preferences to Screen Recording
          await execAsync('open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"');
        }

        return false;
      } catch (error) {
        log.error('Failed to request screen permission:', error);
        return false;
      }
    }

    // On Windows/Linux, assume granted
    return true;
  }

  /**
   * Request accessibility permission (macOS)
   */
  async requestAccessibilityPermission(): Promise<boolean> {
    if (process.platform === 'darwin') {
      try {
        const trusted = systemPreferences.isTrustedAccessibilityClient(false);

        if (trusted) {
          return true;
        }

        const result = await dialog.showMessageBox({
          type: 'info',
          title: 'Accessibility Permission Required',
          message: 'Portal Fusion needs accessibility permissions for remote control features.',
          detail: 'Click "Open System Preferences" to grant accessibility permission. You may need to restart Portal Fusion after granting permission.',
          buttons: ['Open System Preferences', 'Later'],
          defaultId: 0,
        });

        if (result === 0) {
          // Open System Preferences to Accessibility
          await execAsync('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"');
        }

        return false;
      } catch (error) {
        log.error('Failed to request accessibility permission:', error);
        return false;
      }
    }

    // On Windows/Linux, assume granted
    return true;
  }

  /**
   * Check camera permission status
   */
  checkCameraPermission(): boolean {
    if (process.platform === 'darwin') {
      return systemPreferences.getMediaAccessStatus('camera') === 'granted';
    }
    return true;
  }

  /**
   * Check microphone permission status
   */
  checkMicrophonePermission(): boolean {
    if (process.platform === 'darwin') {
      return systemPreferences.getMediaAccessStatus('microphone') === 'granted';
    }
    return true;
  }

  /**
   * Check screen recording permission status
   */
  checkScreenPermission(): boolean {
    if (process.platform === 'darwin') {
      return systemPreferences.getMediaAccessStatus('screen') === 'granted';
    }
    return true;
  }

  /**
   * Check accessibility permission status
   */
  checkAccessibilityPermission(): boolean {
    if (process.platform === 'darwin') {
      return systemPreferences.isTrustedAccessibilityClient(false);
    }
    return true;
  }

  /**
   * Get all permissions status
   */
  getAllPermissions(): Record<string, boolean> {
    return {
      camera: this.checkCameraPermission(),
      microphone: this.checkMicrophonePermission(),
      screen: this.checkScreenPermission(),
      accessibility: this.checkAccessibilityPermission(),
    };
  }

  /**
   * Request elevated privileges for specific operations
   */
  async requestElevatedPrivileges(command: string): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      if (process.platform === 'darwin') {
        // Use osascript with administrator privileges
        const script = `do shell script "${command}" with administrator privileges`;
        const { stdout } = await execAsync(`osascript -e '${script}'`);
        return { success: true, output: stdout };
      } else if (process.platform === 'win32') {
        // Use PowerShell with elevated privileges
        const { stdout } = await execAsync(`powershell -Command "Start-Process -Verb RunAs -FilePath 'cmd' -ArgumentList '/c ${command}' -Wait"`);
        return { success: true, output: stdout };
      } else {
        // Use pkexec on Linux
        const { stdout } = await execAsync(`pkexec ${command}`);
        return { success: true, output: stdout };
      }
    } catch (error: any) {
      log.error('Failed to execute elevated command:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if running with administrator privileges
   */
  async isAdmin(): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('net session 2>&1');
        return !stdout.includes('Access is denied');
      } else if (process.platform === 'darwin' || process.platform === 'linux') {
        const { stdout } = await execAsync('id -u');
        return stdout.trim() === '0';
      }
      return false;
    } catch {
      return false;
    }
  }
}

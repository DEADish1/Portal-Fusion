; Custom NSIS installer script for Portal Fusion
; This script customizes the Windows installer behavior

!macro preInit
  ; Check Windows version (Windows 10 or later required)
  ${If} ${AtLeastWin10}
    ; Windows 10 or later detected
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "Portal Fusion requires Windows 10 or later.$\n$\nPlease upgrade your operating system."
    Quit
  ${EndIf}
!macroend

!macro customInit
  ; Add custom initialization code here
  ; This runs before the installer UI is shown
!macroend

!macro customInstall
  ; Add custom installation steps here

  ; Create firewall rules for Portal Fusion
  DetailPrint "Configuring Windows Firewall..."
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Portal Fusion" dir=in action=allow program="$INSTDIR\${PRODUCT_FILENAME}" enable=yes profile=any'

  ; Add to Windows startup (optional, can be configured later)
  ; WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Portal Fusion" "$INSTDIR\${PRODUCT_FILENAME}"
!macroend

!macro customUnInstall
  ; Remove firewall rules
  DetailPrint "Removing Windows Firewall rules..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Portal Fusion"'

  ; Remove from startup
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Portal Fusion"
!macroend

!macro customInstallMode
  ; Allow both per-user and per-machine installation
!macroend

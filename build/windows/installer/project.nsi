Unicode true

####
## Please note: Template replacements don't work in this file. They are provided with default defines like
## mentioned underneath.
## If the keyword is not defined, "wails_tools.nsh" will populate them with the values from ProjectInfo.
## If they are defined here, "wails_tools.nsh" will not touch them. This allows to use this project.nsi manually
## from outside of Wails for debugging and development of the installer.
##
## For development first make a wails nsis build to populate the "wails_tools.nsh":
## > wails build --target windows/amd64 --nsis
## Then you can call makensis on this file with specifying the path to your binary:
## For a AMD64 only installer:
## > makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app.exe
## For a ARM64 only installer:
## > makensis -DARG_WAILS_ARM64_BINARY=..\..\bin\app.exe
## For a installer with both architectures:
## > makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app-amd64.exe -DARG_WAILS_ARM64_BINARY=..\..\bin\app-arm64.exe
####
## The following information is taken from the ProjectInfo file, but they can be overwritten here.
####
## !define INFO_PROJECTNAME    "MyProject" # Default "{{.Name}}"
## !define INFO_COMPANYNAME    "MyCompany" # Default "{{.Info.CompanyName}}"
## !define INFO_PRODUCTNAME    "MyProduct" # Default "{{.Info.ProductName}}"
## !define INFO_PRODUCTVERSION "1.0.0"     # Default "{{.Info.ProductVersion}}"
## !define INFO_COPYRIGHT      "Copyright" # Default "{{.Info.Copyright}}"
###
## !define PRODUCT_EXECUTABLE  "Application.exe"      # Default "${INFO_PROJECTNAME}.exe"
## !define UNINST_KEY_NAME     "UninstKeyInRegistry"  # Default "${INFO_COMPANYNAME}${INFO_PRODUCTNAME}"
####
## !define REQUEST_EXECUTION_LEVEL "admin"            # Default "admin"  see also https://nsis.sourceforge.io/Docs/Chapter4.html
####
## Include the wails tools
####
!include "wails_tools.nsh"

# The version information for this two must consist of 4 parts
VIProductVersion "${INFO_PRODUCTVERSION}.0"
VIFileVersion    "${INFO_PRODUCTVERSION}.0"

VIAddVersionKey "CompanyName"     "${INFO_COMPANYNAME}"
VIAddVersionKey "FileDescription" "${INFO_PRODUCTNAME} Installer"
VIAddVersionKey "ProductVersion"  "${INFO_PRODUCTVERSION}"
VIAddVersionKey "FileVersion"     "${INFO_PRODUCTVERSION}"
VIAddVersionKey "LegalCopyright"  "${INFO_COPYRIGHT}"
VIAddVersionKey "ProductName"     "${INFO_PRODUCTNAME}"

# Enable HiDPI support. https://nsis.sourceforge.io/Reference/ManifestDPIAware
ManifestDPIAware true

!include "MUI.nsh"

!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
# !define MUI_WELCOMEFINISHPAGE_BITMAP "resources\leftimage.bmp" #Include this to add a bitmap on the left side of the Welcome Page. Must be a size of 164x314
!define MUI_FINISHPAGE_NOAUTOCLOSE # Wait on the INSTFILES page so the user can take a look into the details of the installation steps
!define MUI_ABORTWARNING # This will warn the user if they exit from the installer.

!insertmacro MUI_PAGE_WELCOME # Welcome to the installer page.
# !insertmacro MUI_PAGE_LICENSE "resources\eula.txt" # Adds a EULA page to the installer
!insertmacro MUI_PAGE_DIRECTORY # In which folder install page.
!insertmacro MUI_PAGE_INSTFILES # Installing page.
!insertmacro MUI_PAGE_FINISH # Finished installation page.

!insertmacro MUI_UNPAGE_INSTFILES # Uinstalling page

!insertmacro MUI_LANGUAGE "English" # Set the Language of the installer

!define BEAM_FILE_CLASS "Beam.Profile"
!define BEAM_FILE_DESCRIPTION "Beam Profile"
!define BEAM_PROTOCOL_DESCRIPTION "URL:Beam Protocol"
!define PRODUCT_RELAY_EXECUTABLE "BeamRelay.exe"

## The following two statements can be used to sign the installer and the uninstaller. The path to the binaries are provided in %1
#!uninstfinalize 'signtool --file "%1"'
#!finalize 'signtool --file "%1"'

Name "${INFO_PRODUCTNAME}"
OutFile "..\..\bin\${INFO_PROJECTNAME}-${ARCH}-installer.exe" # Name of the installer's file.
InstallDir "$PROGRAMFILES64\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}" # Default installing folder ($PROGRAMFILES is Program Files folder).
ShowInstDetails show # This will always show the installation details.

Function .onInit
   !insertmacro wails.checkArchitecture
FunctionEnd

; Названы beam.* (а не wails.*), т.к. wails_tools.nsh (пересобирается заново
; каждым `wails build`) уже определяет пустые заглушки wails.associateFiles/
; wails.associateCustomProtocols/их unassociate-пары — переопределение
; !macro с тем же именем является ошибкой компиляции NSIS ("macro already
; exists"). Команды указывают на BeamRelay.exe, а не на Beam.exe: релей не
; требует прав администратора, поэтому открытие .beam-файла или beam://
; ссылки, пока приложение уже запущено, не вызывает лишний UAC-запрос (см.
; internal/application/system/protocol_service_windows.go).
!macro beam.associateFiles
    !insertmacro APP_ASSOCIATE "beam" "${BEAM_FILE_CLASS}" "${BEAM_FILE_DESCRIPTION}" "$INSTDIR\${PRODUCT_EXECUTABLE},0" "Open with Beam" '"$INSTDIR\${PRODUCT_RELAY_EXECUTABLE}" "%1"'
!macroend

!macro beam.unassociateFiles
    !insertmacro APP_UNASSOCIATE "beam" "${BEAM_FILE_CLASS}"
!macroend

; CUSTOM_PROTOCOL_ASSOCIATE (в отличие от APP_ASSOCIATE) подставляет COMMAND
; в двойных кавычках, а не в бэктиках, поэтому кавычки внутри значения нужно
; экранировать через $\", а не оборачивать аргумент в одинарные кавычки.
!macro beam.associateCustomProtocols
    !insertmacro CUSTOM_PROTOCOL_ASSOCIATE "beam" "${BEAM_PROTOCOL_DESCRIPTION}" "$INSTDIR\${PRODUCT_EXECUTABLE},0" "$\"$INSTDIR\${PRODUCT_RELAY_EXECUTABLE}$\" $\"%1$\""
!macroend

!macro beam.unassociateCustomProtocols
    !insertmacro CUSTOM_PROTOCOL_UNASSOCIATE "beam"
!macroend

Section
    !insertmacro wails.setShellContext

    !insertmacro wails.webview2runtime

    SetOutPath $INSTDIR

    !insertmacro wails.files
    File "..\..\bin\BeamRelay.exe"
    ; Драйвер TUN-адаптера. wireguard/tun грузит wintun.dll только из папки
    ; приложения и System32, поэтому DLL обязана лежать рядом с Beam.exe.
    ; Кладётся в build\bin скриптом сборки (scripts\windows\build.bat).
    File "..\..\bin\wintun.dll"

    CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"
    CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"

    !insertmacro beam.associateFiles
    !insertmacro beam.associateCustomProtocols

    !insertmacro wails.writeUninstaller
SectionEnd

Section "uninstall"
    !insertmacro wails.setShellContext

    RMDir /r "$AppData\${PRODUCT_EXECUTABLE}" # Remove the WebView2 DataPath

    RMDir /r $INSTDIR

    Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
    Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

    !insertmacro beam.unassociateFiles
    !insertmacro beam.unassociateCustomProtocols

    !insertmacro wails.deleteUninstaller
SectionEnd

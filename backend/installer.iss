; Inno Setup Script for MicMose Photo Culler Pro - Dark Editorial Theme
#define MyAppName "MicMose Photo Culler Pro"
#define MyAppVersion "1.0.4"
#define MyAppBuild "104"
#define MyAppPublisher "Naphatphurin Prachantasena"
#define MyAppURL "https://github.com/Naphatpuurin/AI-Assist-Photo-Culler"
#define MyAppExeName "MicMose Photo Culler Pro.exe"

[Setup]
AppId={{E1B3E3C7-740A-4F35-950F-2FE092A572F8}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\release
OutputBaseFilename=MicMose-Photo-Culler-Pro-Setup
SetupIconFile=app.ico
WizardImageFile=wizard_large.bmp
WizardSmallImageFile=wizard_small.bmp
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
VersionInfoVersion=1.0.4.104
VersionInfoCompany=Naphatphurin Prachantasena
VersionInfoDescription=MicMose Photo Culler Pro Setup
VersionInfoCopyright=Copyright (C) 2026 Naphatphurin Prachantasena
VersionInfoProductName=MicMose Photo Culler Pro
VersionInfoProductVersion=1.0.4.104

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "app.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: isreadme
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
procedure InitializeWizard();
begin
  // Set dark background on Wizard Form and panels (Delphi BGR format)
  // Near-black #11120f -> $0F1211, Charcoal #181915 -> $151918, Input #21231D -> $1D2321
  WizardForm.Color := $0F1211;
  WizardForm.InnerPage.Color := $0F1211;
  WizardForm.MainPanel.Color := $151918;
  
  // Custom font
  WizardForm.Font.Name := 'Segoe UI';
  
  // Header texts
  WizardForm.PageNameLabel.Font.Color := $ECF2F4; // Chalk #f4f2ec
  WizardForm.PageNameLabel.Font.Style := [fsBold];
  WizardForm.PageDescriptionLabel.Font.Color := $6B8585; // Muted olive #85856b
  
  // Welcome & Finish page texts
  WizardForm.WelcomeLabel1.Font.Color := $ECF2F4; // Chalk
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.WelcomeLabel2.Font.Color := $BFC8C8; // Rule gray #c8c8bf
  WizardForm.FinishedHeadingLabel.Font.Color := $ECF2F4;
  WizardForm.FinishedHeadingLabel.Font.Style := [fsBold];
  WizardForm.FinishedLabel.Font.Color := $BFC8C8;
  
  // Directory & Group selection
  WizardForm.SelectDirLabel.Font.Color := $ECF2F4;
  WizardForm.SelectDirBrowseLabel.Font.Color := $6B8585;
  WizardForm.DirEdit.Color := $1D2321;
  WizardForm.DirEdit.Font.Color := $ECF2F4;
  WizardForm.DiskSpaceLabel.Font.Color := $6B8585;
  
  WizardForm.SelectStartMenuFolderLabel.Font.Color := $ECF2F4;
  WizardForm.SelectStartMenuFolderBrowseLabel.Font.Color := $6B8585;
  WizardForm.GroupEdit.Color := $1D2321;
  WizardForm.GroupEdit.Font.Color := $ECF2F4;
  WizardForm.NoIconsCheck.Font.Color := $ECF2F4;
  
  // Tasks list
  WizardForm.SelectTasksLabel.Font.Color := $ECF2F4;
  WizardForm.TasksList.Color := $1D2321;
  WizardForm.TasksList.Font.Color := $ECF2F4;
  
  // Ready memo
  WizardForm.ReadyLabel.Font.Color := $ECF2F4;
  WizardForm.ReadyMemo.Color := $1D2321;
  WizardForm.ReadyMemo.Font.Color := $ECF2F4;
  
  // Status & filename during installation
  WizardForm.StatusLabel.Font.Color := $ECF2F4;
  WizardForm.FileNameLabel.Font.Color := $354CE5; // Vermilion #e54c35
  
  // Monospace cue-sheet notation watermark
  WizardForm.BeveledLabel.Caption := ' MICMOSE // PHOTO CULLER PRO [VER 1.0.2 // BUILD 102] ';
  WizardForm.BeveledLabel.Font.Color := $6B8585;
  WizardForm.BeveledLabel.Font.Name := 'Consolas';
end;

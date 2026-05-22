@echo off
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Tienda Bimbo.lnk'); $s.TargetPath = '%~dp0index.html'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Sistema de Gestión - Tienda Bimbo'; $s.Save()"
echo Acceso directo creado en el escritorio
pause

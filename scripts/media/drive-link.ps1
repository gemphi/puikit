# Link the server to Google Drive, once: you sign in to Google in your browser (read-only access), and the token goes
# from this machine straight into the server's rclone config as the remote `gdrive`. Nothing is written here and the
# token is never printed. Afterwards the server copies renders itself: scripts/media/drive-pull.sh <collection>.
#   powershell -File scripts/media/drive-link.ps1
# Needs rclone on this machine (winget install Rclone.Rclone) and the server key (PHI_CDN_KEY, else the usual path).
$ErrorActionPreference = 'Stop'
$server = if ($env:PHI_CDN_SSH) { $env:PHI_CDN_SSH } else { 'ubuntu@13.63.125.132' }
$key = if ($env:PHI_CDN_KEY) { $env:PHI_CDN_KEY } else { "$HOME\perm-key\phient.pem" }

if (-not (Get-Command rclone -ErrorAction SilentlyContinue)) {
  Write-Host 'rclone is not on this machine. Install it with: winget install Rclone.Rclone   then open a new window and run this again.'
  exit 1
}

# Read-only scope: the server can copy from the Drive and can change nothing there.
$scope = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"scope":"drive.readonly"}'))
Write-Host 'A browser opens: sign in with the Google account that sees the Bold folders, and allow read-only access.'
$out = (& rclone authorize drive $scope 2>&1 | Out-String)
$m = [regex]::Match($out, '\{"access_token".*?\}(?=\s|$)', 'Singleline')
if (-not $m.Success) { Write-Host 'No token came back from the sign-in.'; exit 1 }

# Into the server's rclone config through ssh's input, so it never sits in a command line or a file here.
$m.Value | ssh -i $key -o ConnectTimeout=20 $server 'read -r tok; rclone config create gdrive drive scope=drive.readonly token="$tok" --non-interactive >/dev/null && rclone lsd gdrive: --max-depth 1 >/dev/null && echo "The server is linked to Google Drive (remote gdrive)."'

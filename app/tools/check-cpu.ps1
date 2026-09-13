Get-Process | Sort-Object CPU -Descending |
  Select-Object -First 8 Name,
    @{N='CPU_sec'; E={ [math]::Round($_.CPU, 0) }},
    @{N='RAM_MB'; E={ [math]::Round($_.WorkingSet64 / 1MB, 0) }} |
  Format-Table -AutoSize

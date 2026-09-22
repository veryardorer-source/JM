param(
 [Parameter(Mandatory=$true)][ValidateSet('Import','Export')][string]$Mode,
 [Parameter(Mandatory=$true)][string]$Book,
 [Parameter(Mandatory=$true)][string]$Result,
 [string]$Request,
 [string]$Output,
 [string]$Sheet='내역서'
)
$ErrorActionPreference='Stop'
$excel=$null; $workbook=$null; $temporary=$null
$encoding=[Text.Encoding]::GetEncoding(949)
function LispString([string]$value) {
 '"'+$value.Replace('\','\\').Replace('"','\"').Replace("`r",' ').Replace("`n",' ').Replace("`t",' ')+'"'
}
function CellText($value) { if ($null -eq $value) { '' } else { ([string]$value).Trim() } }
try {
 $Book=[IO.Path]::GetFullPath($Book)
 if (-not (Test-Path -LiteralPath $Book -PathType Leaf)) { throw '원본 내역서 파일을 찾을 수 없습니다.' }
 $excel=New-Object -ComObject Excel.Application
 $excel.Visible=$false; $excel.DisplayAlerts=$false
 $excel.AutomationSecurity=3; $excel.AskToUpdateLinks=$false
 $workbook=$excel.Workbooks.Open($Book,0,$true)
 $ws=$workbook.Worksheets.Item($Sheet)
 $values=$ws.UsedRange.Value2
 if ($ws.UsedRange.Row -ne 1 -or $ws.UsedRange.Column -ne 1) { throw '내역서의 시작 셀은 A1이어야 합니다.' }
 if ((CellText $values[3,5]) -ne '수량' -or (CellText $values[3,4]) -ne '단위') { throw '지원 양식: 내역서 D열 단위, E열 수량, 3행 제목.' }
 if ($Mode -eq 'Import') {
  $lines=New-Object 'System.Collections.Generic.List[string]'
  $lines.Add('((version . 1) (book . '+(LispString $Book)+') (sheet . '+(LispString $Sheet)+'))')
  $group=''; $section=''
  for ($r=6;$r -le $values.GetLength(0);$r++) {
   $name=CellText $values[$r,2]; $spec=CellText $values[$r,3]; $unit=CellText $values[$r,4]
   if (-not $name -or $name.StartsWith('[')) { continue }
   if ($null -ne $values[$r,1] -and $unit -eq '') { $group=$name; $section=''; continue }
   if ($unit -eq '') { $section=$name; continue }
   $label=$group; if ($section) { $label+=' / '+$section }
   $lines.Add('((id . "R'+$r+'") (row . '+$r+') (group . '+(LispString $label)+') (name . '+(LispString $name)+') (spec . '+(LispString $spec)+') (unit . '+(LispString $unit)+'))')
  }
  if ($lines.Count -lt 2) { throw '가져올 내역 항목이 없습니다.' }
  # Never silently replace unsupported characters when communicating with legacy AutoLISP.
  $strict=[Text.Encoding]::GetEncoding(949,[Text.EncoderExceptionFallback]::new(),[Text.DecoderExceptionFallback]::new())
  [IO.File]::WriteAllText($Result,($lines -join "`r`n"),$strict)
 } else {
  $Output=[IO.Path]::GetFullPath($Output)
  if ($Output -eq $Book -or (Test-Path -LiteralPath $Output)) { throw '원본 또는 기존 파일은 덮어쓰지 않습니다. 새 파일명을 지정하세요.' }
  if ([IO.Path]::GetExtension($Output) -ne [IO.Path]::GetExtension($Book)) { throw '원본과 같은 확장자로 저장하세요.' }
  $updates=@(Import-Csv -LiteralPath $Request -Encoding Default)
  if ($updates.Count -eq 0) { throw '내보낼 내역이 없습니다.' }
  $expectedRows=@()
  for ($r=6;$r -le $values.GetLength(0);$r++) {
   $name=CellText $values[$r,2]; $unit=CellText $values[$r,4]
   if ($name -and -not $name.StartsWith('[') -and $unit) { $expectedRows+=$r }
  }
  if ($updates.Count -ne $expectedRows.Count) { throw '내역서 항목 수가 달라졌습니다. 이 결과는 원래 가져온 내역서에만 저장할 수 있습니다.' }
  $seen=@{}
  foreach ($u in $updates) {
   $r=0
   if (-not [int]::TryParse($u.row,[ref]$r) -or $r -lt 6 -or $r -gt $values.GetLength(0) -or $r -notin $expectedRows -or $seen.ContainsKey($r)) { throw '내역 행 번호가 잘못되었거나 중복되었습니다.' }
   $seen[$r]=$true
   if ((CellText $values[$r,2]) -ne $u.name -or (CellText $values[$r,3]) -ne $u.spec -or (CellText $values[$r,4]) -ne $u.unit) { throw "내역서 ${r}행이 변경되었습니다. 다시 가져온 후 연결 상태를 확인하세요." }
   if ($u.state -eq 'INVALID') { throw "${r}행에 끊어진 도면 연결이 있습니다. 복구 후 내보내세요." }
   if ($u.state -notin @('OK','UNLINKED')) { throw '알 수 없는 연결 상태입니다.' }
   if ($ws.Cells.Item($r,5).HasFormula) { throw "${r}행 수량 셀에 수식이 있습니다. 자동으로 덮어쓰지 않습니다." }
   if ($u.state -eq 'OK') {
    $n=0.0
    if (-not [double]::TryParse($u.quantity,[Globalization.NumberStyles]::Float,[Globalization.CultureInfo]::InvariantCulture,[ref]$n) -or [double]::IsNaN($n) -or [double]::IsInfinity($n) -or $n -lt 0) { throw "${r}행의 수량이 유효하지 않습니다." }
    $ws.Cells.Item($r,5).Value2=$n
   } else { $ws.Cells.Item($r,5).ClearContents() | Out-Null }
  }
  # Export a complete CAD-derived result: unlinked detail quantities stay blank.
  $excel.CalculateFull()
  $temporary=Join-Path ([IO.Path]::GetDirectoryName($Output)) (([IO.Path]::GetFileNameWithoutExtension($Output))+'.'+[guid]::NewGuid().ToString('N')+[IO.Path]::GetExtension($Output))
  $workbook.SaveCopyAs($temporary)
  [IO.File]::Move($temporary,$Output); $temporary=$null
  [IO.File]::WriteAllText($Result,'((ok . 1) (output . '+(LispString $Output)+'))',$encoding)
 }
} catch {
 [IO.File]::WriteAllText($Result+'.error',$_.Exception.Message,$encoding)
 exit 1
} finally {
 if ($workbook) { $workbook.Close($false) }
 if ($excel) { $excel.Quit(); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($excel) }
 if ($temporary -and (Test-Path -LiteralPath $temporary)) { Remove-Item -LiteralPath $temporary }
}

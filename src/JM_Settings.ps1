param([Parameter(Mandatory=$true)][string]$Config,[switch]$SmokeTest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$c=Import-Csv -LiteralPath $Config -Encoding Default | Select-Object -First 1
if($c.token -notmatch '^[A-Za-z0-9_-]+$'){throw '잘못된 설정 세션입니다.'}
$enc=[Text.Encoding]::GetEncoding(949)
$script:pending=$false
function LispString([string]$s){'"'+$s.Replace('\','\\').Replace('"','\"').Replace("`r",' ').Replace("`n",' ')+'"'}
$form=New-Object Windows.Forms.Form;$form.Text='내역 산출 설정 · 도면과 함께 보기'
$form.Font=New-Object Drawing.Font('맑은 고딕',11);$form.Size=New-Object Drawing.Size(590,640);$form.MinimumSize=$form.Size
$form.StartPosition='CenterScreen';$form.TopMost=$true;$form.BackColor=[Drawing.Color]::FromArgb(246,248,251)
$layout=New-Object Windows.Forms.TableLayoutPanel;$layout.Dock='Fill';$layout.Padding=New-Object Windows.Forms.Padding(16);$layout.ColumnCount=2;$layout.RowCount=14
$layout.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',215))) | Out-Null
$layout.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100))) | Out-Null
foreach($h in @(58,39,39,39,39,39,39,39,39,35,52,45,20,20)){$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',$h))) | Out-Null};$form.Controls.Add($layout)
$title=New-Object Windows.Forms.Label;$title.Text=$c.title;$title.Dock='Fill';$title.Font=New-Object Drawing.Font('맑은 고딕',12,[Drawing.FontStyle]::Bold);$layout.Controls.Add($title,0,0);$layout.SetColumnSpan($title,2)
$modes=@('길이(m)','닫힌 경계 면적(㎡)','벽 길이×높이(㎡)','블록 개수(EA/SET)','수동 수량(식/인 등)','각재 합계(EA)','석고보드(EA)','보강 합판(EA)','벽지(롤)','천장지(롤)','걸레받이(개)','면적→BOX')
$fields=@{}
function AddField($key,$label,$row,$value,$choices){
 $l=New-Object Windows.Forms.Label;$l.Text=$label;$l.Dock='Fill';$l.TextAlign='MiddleLeft';$layout.Controls.Add($l,0,$row)
 if($choices){$x=New-Object Windows.Forms.ComboBox;$x.DropDownStyle='DropDownList';$x.Items.AddRange($choices);$x.SelectedIndex=0;$x.SelectedItem=[string]$value}else{$x=New-Object Windows.Forms.TextBox;$x.Text=[string]$value}
 $x.Dock='Fill';$x.Margin=New-Object Windows.Forms.Padding(3,4,3,4);$layout.Controls.Add($x,1,$row);$fields[$key]=$x
}
AddField mode '계산 방식' 1 $modes[[int]$c.mode] $modes
AddField label '위치 / 방 / 면 이름' 2 '101-A' $null
AddField factor 'CAD 1단위 = 실제 mm' 3 '1' $null
AddField height '벽 높이(mm)' 4 '2580' $null
AddField stock '각재 주문 길이(mm)' 5 '2700' @('2400','2700','3000','3600')
AddField width '보강 합판 띠 폭(mm)' 6 '80' $null
AddField pack 'BOX당 면적(㎡)' 7 '' $null
AddField manual '수동 수량' 8 '1' $null
$top=New-Object Windows.Forms.CheckBox;$top.Text='항상 위에 표시';$top.Checked=$true;$top.AutoSize=$true;$layout.Controls.Add($top,0,9);$layout.SetColumnSpan($top,2);$top.Add_CheckedChanged({$form.TopMost=$top.Checked})
$hint=New-Object Windows.Forms.Label;$hint.Text="창을 켜둔 채 CAD에서 이동·확대할 수 있습니다.`r`n도면을 찾은 뒤 아래 버튼으로 선택을 시작하세요.";$hint.Dock='Fill';$hint.ForeColor=[Drawing.Color]::FromArgb(50,76,108);$layout.Controls.Add($hint,0,10);$layout.SetColumnSpan($hint,2)
$pick=New-Object Windows.Forms.Button;$pick.Text='설정 적용 후 도면 선택';$pick.Dock='Fill';$pick.BackColor=[Drawing.Color]::FromArgb(30,94,190);$pick.ForeColor=[Drawing.Color]::White;$pick.FlatStyle='Flat';$layout.Controls.Add($pick,0,11);$layout.SetColumnSpan($pick,2)
$status=New-Object Windows.Forms.Label;$status.Text='목록은 CAD 명령 JMLIST로 다시 열 수 있습니다.';$status.Dock='Fill';$status.AutoSize=$false;$status.Font=New-Object Drawing.Font('맑은 고딕',9);$layout.Controls.Add($status,0,12);$layout.SetColumnSpan($status,2);$layout.SetRowSpan($status,2)
function RefreshFields {
 $m=$fields.mode.SelectedIndex
 $fields.height.Enabled=$m -in @(2,5,6,7,8);$fields.stock.Enabled=$m -eq 5;$fields.width.Enabled=$m -eq 7;$fields.pack.Enabled=$m -eq 11;$fields.manual.Enabled=$m -eq 4;$fields.factor.Enabled=$m -ne 4
 $pick.Text=if($m -eq 4){'수동 수량 저장'}else{'설정 적용 후 도면 선택'}
}
$fields.mode.Add_SelectedIndexChanged({RefreshFields});RefreshFields
function SettingsData {
 $m=$fields.mode.SelectedIndex;$data=@{mode=$m;label=$fields.label.Text.Trim();stock=[int]$fields.stock.SelectedItem}
 if(-not $data.label){throw '위치 / 방 / 면 이름을 입력하세요.'}
 foreach($k in @('factor','height','width','pack','manual')){
  $n=0.0;$needed=$fields[$k].Enabled
  if(-not [double]::TryParse($fields[$k].Text,[Globalization.NumberStyles]::Float,[Globalization.CultureInfo]::InvariantCulture,[ref]$n) -or [double]::IsNaN($n) -or [double]::IsInfinity($n) -or ($needed -and (($k -ne 'manual' -and $n -le 0) -or ($k -eq 'manual' -and $n -lt 0)))){
   if($needed){throw '필요한 치수와 수량을 숫자로 입력하세요.'}
   $n=switch($k){'factor'{1}'height'{2580}'width'{80}'pack'{1}'manual'{0}}
  }
  $data[$k]=$n
 }
 if($m -eq 7 -and $data.width -gt 1220){throw '합판 띠 폭은 1220mm 이하여야 합니다.'}
 $line='((token . '+(LispString $c.token)+') (nonce . '+(LispString ([guid]::NewGuid().ToString('N')))+') (id . '+(LispString $c.id)+') (label . '+(LispString $data.label)+')'
 foreach($k in @('mode','factor','height','stock','width','pack','manual')){$line+=' ('+$k+' . '+$data[$k].ToString([Globalization.CultureInfo]::InvariantCulture)+')'}
 $line+')'
}
# Resolve the exact running DWG first; GetActiveObject alone can choose another CAD process.
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
public static class JMRunningDrawing {
 [DllImport("ole32.dll")] static extern int GetRunningObjectTable(int reserved,out IRunningObjectTable table);
 [DllImport("ole32.dll")] static extern int CreateBindCtx(int reserved,out IBindCtx ctx);
 public static object Find(string path) {
  if(String.IsNullOrEmpty(path)) return null;
  IRunningObjectTable table; IBindCtx ctx; GetRunningObjectTable(0,out table); CreateBindCtx(0,out ctx);
  IEnumMoniker en; table.EnumRunning(out en); IMoniker[] m=new IMoniker[1];
  try { while(en.Next(1,m,IntPtr.Zero)==0) {
   try { string name; m[0].GetDisplayName(ctx,null,out name);
    if(String.Equals(name.TrimStart('!'),path,StringComparison.OrdinalIgnoreCase)) { object value; table.GetObject(m[0],out value); return value; }
   } finally { Marshal.ReleaseComObject(m[0]); }
  }} finally { Marshal.ReleaseComObject(en); Marshal.ReleaseComObject(ctx); Marshal.ReleaseComObject(table); }
  return null;
 }
}
"@
function TargetDocument {
 $direct=[JMRunningDrawing]::Find([string]$c.docfull)
 if($direct -and [string]$direct.Application.HWND -eq $c.hwnd -and [string]$direct.Name -eq $c.docname -and [string]$direct.FullName -eq $c.docfull){
  if(-not $direct.Application.GetAcadState().IsQuiescent){throw 'CAD 명령을 끝낸 뒤 다시 눌러주세요.'}
  return $direct
 }
 $app=$null
 foreach($prog in @('AutoCAD.Application','AutoCAD.Application.24.2')){
  try{$candidate=[Runtime.InteropServices.Marshal]::GetActiveObject($prog);if([string]$candidate.HWND -eq $c.hwnd){$app=$candidate;break}}catch{}
 }
 if(-not $app){throw '연결할 CAD 창을 찾지 못했습니다. 설정을 다시 열어주세요.'}
 if(-not $app.GetAcadState().IsQuiescent){throw 'CAD 명령을 끝낸 뒤 다시 눌러주세요. 진행 중인 명령은 취소하지 않습니다.'}
 foreach($d in $app.Documents){if([string]$d.Name -eq $c.docname -and [string]$d.FullName -eq $c.docfull){return $d}}
 throw '원래 도면이 닫혔거나 이름이 바뀌었습니다. 해당 도면에서 설정을 다시 열어주세요.'
}
$pick.Add_Click({
 try{
  $data=SettingsData;$doc=TargetDocument
  if(Test-Path -LiteralPath ($Config+'.reply')){Remove-Item -LiteralPath ($Config+'.reply')}
  [IO.File]::WriteAllText($Config+'.request',$data,$enc)
  $script:pending=$true;$pick.Enabled=$false;$status.Text='CAD에서 대상을 선택하세요. 취소하려면 CAD에서 Esc를 누르세요.'
  $doc.Activate()
  $doc.SendCommand('(jl:pick-request "'+$c.token+'")'+[char]13)
 }catch{
  $status.Text=$_.Exception.Message
  if($script:pending){$status.Text+=' CAD에서 JMLPICK을 입력하면 같은 요청을 이어갑니다.'}else{$pick.Enabled=$true}
 }
})
$timer=New-Object Windows.Forms.Timer;$timer.Interval=500
$timer.Add_Tick({
 if(Test-Path -LiteralPath ($Config+'.closed')){$form.Close();return}
 if($script:pending -and (Test-Path -LiteralPath ($Config+'.reply'))){
  try{$status.Text=[IO.File]::ReadAllText($Config+'.reply',$enc);$script:pending=$false;$pick.Enabled=$true}catch{}
 }
})
$form.Add_Shown({$timer.Start();if($SmokeTest){
 $bitmap=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bitmap,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bitmap.Save($Config+'.png');$bitmap.Dispose()
 @{mode=$fields.mode.SelectedIndex;heightEnabled=$fields.height.Enabled;packEnabled=$fields.pack.Enabled;topMost=$form.TopMost} | ConvertTo-Json | Set-Content ($Config+'.test.json')
 $form.Close()
}})
$form.Add_FormClosed({$timer.Stop();[IO.File]::WriteAllText($Config+'.closed','closed')})
try{[void]$form.ShowDialog()}finally{$timer.Dispose();$form.Dispose()}

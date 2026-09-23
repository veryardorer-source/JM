param([Parameter(Mandatory=$true)][string]$Config,[switch]$SmokeTest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$c=Import-Csv -LiteralPath $Config -Encoding Default | Select-Object -First 1
if($c.token -notmatch '^[A-Za-z0-9_-]+$'){throw '잘못된 설정 세션입니다.'}
$enc=[Text.Encoding]::GetEncoding(949)
$script:pending=$false;$script:stamp='';$script:rows=@()
function LispString([string]$s){'"'+$s.Replace('\','\\').Replace('"','\"').Replace("`r",' ').Replace("`n",' ')+'"'}
$form=New-Object Windows.Forms.Form;$form.Text='구역별 물량 연결 · 도면을 보면서 추가'
$form.Font=New-Object Drawing.Font('맑은 고딕',11);$form.Size=New-Object Drawing.Size(1120,760);$form.MinimumSize=$form.Size
$form.StartPosition='CenterScreen';$form.TopMost=$true;$form.BackColor=[Drawing.Color]::FromArgb(246,248,251)
$outer=New-Object Windows.Forms.TableLayoutPanel;$outer.Dock='Fill';$outer.Padding=New-Object Windows.Forms.Padding(14);$outer.ColumnCount=2;$outer.RowCount=3
[void]$outer.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',415)));[void]$outer.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100)))
foreach($v in @(52,-1,55)){[void]$outer.RowStyles.Add((New-Object Windows.Forms.RowStyle($(if($v -eq -1){'Percent'}else{'Absolute'}),$(if($v -eq -1){100}else{$v}))))};$form.Controls.Add($outer)
$title=New-Object Windows.Forms.Label;$title.Text=$c.title;$title.Dock='Fill';$title.Font=New-Object Drawing.Font('맑은 고딕',13,[Drawing.FontStyle]::Bold);$outer.Controls.Add($title,0,0);$outer.SetColumnSpan($title,2)
$layout=New-Object Windows.Forms.TableLayoutPanel;$layout.Dock='Fill';$layout.ColumnCount=2;$layout.RowCount=14;$layout.Padding=New-Object Windows.Forms.Padding(0,0,14,0)
[void]$layout.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',175)));[void]$layout.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100)))
foreach($v in @(38,42,38,38,38,38,38,38,38,38,32,62,48,10)){[void]$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',$v)))};$outer.Controls.Add($layout,0,1)
$modes=@('길이(m)','닫힌 경계 면적(㎡)','벽 길이×높이(㎡)','블록 개수(EA/SET)','수동 수량(식/인 등)','각재 합계(EA)','석고보드(EA)','보강 합판(EA)','벽지(롤)','천장지(롤)','걸레받이(개)','면적→BOX')
$fields=@{}
function AddField($key,$label,$row,$value,$choices){
 $l=New-Object Windows.Forms.Label;$l.Text=$label;$l.Dock='Fill';$l.TextAlign='MiddleLeft';$layout.Controls.Add($l,0,$row)
 if($choices){$x=New-Object Windows.Forms.ComboBox;$x.DropDownStyle='DropDownList';$x.Items.AddRange($choices);$x.SelectedIndex=0;$x.SelectedItem=[string]$value}else{$x=New-Object Windows.Forms.TextBox;$x.Text=[string]$value}
 $x.Dock='Fill';$x.Margin=New-Object Windows.Forms.Padding(3,4,3,4);$layout.Controls.Add($x,1,$row);$fields[$key]=$x
}
AddField label '① 구역 선택' 0 '' @('구역을 등록하세요')
$fields.label.DropDownStyle='DropDown';$fields.label.Items.Clear();$fields.label.SelectedIndex=-1;$fields.label.Text=''
$zone=New-Object Windows.Forms.Button;$zone.Text='CAD 실명·도면번호 글자에서 등록';$zone.Dock='Fill';$layout.Controls.Add($zone,0,1);$layout.SetColumnSpan($zone,2)
AddField mode '② 계산 방식' 2 $modes[[int]$c.mode] $modes
AddField selection '폴리선 선택 범위' 3 '클릭한 한 변' @('클릭한 한 변','객체 전체')
AddField factor 'CAD 1단위 = 실제 mm' 4 '1' $null
AddField height '벽 높이(mm)' 5 '2580' $null
AddField stock '각재 주문 길이(mm)' 6 '2700' @('2400','2700','3000','3600')
AddField width '보강 합판 띠 폭(mm)' 7 '80' $null
AddField pack 'BOX당 면적(㎡)' 8 '' $null
AddField manual '수동 수량' 9 '1' $null
$top=New-Object Windows.Forms.CheckBox;$top.Text='항상 위에 표시';$top.Checked=$true;$top.AutoSize=$true;$layout.Controls.Add($top,0,10);$layout.SetColumnSpan($top,2);$top.Add_CheckedChanged({$form.TopMost=$top.Checked})
$hint=New-Object Windows.Forms.Label;$hint.Text="클릭할 때마다 한 건씩 저장됩니다.`r`nEnter / Esc로 선택을 끝낸 뒤 구역을 바꾸세요.`r`n이미 추가한 내역은 그대로 유지됩니다.";$hint.Dock='Fill';$hint.Font=New-Object Drawing.Font('맑은 고딕',10);$hint.ForeColor=[Drawing.Color]::FromArgb(50,76,108);$layout.Controls.Add($hint,0,11);$layout.SetColumnSpan($hint,2)
$pick=New-Object Windows.Forms.Button;$pick.Text='③ 연속 선택 시작';$pick.Dock='Fill';$pick.BackColor=[Drawing.Color]::FromArgb(30,94,190);$pick.ForeColor=[Drawing.Color]::White;$pick.FlatStyle='Flat';$layout.Controls.Add($pick,0,12);$layout.SetColumnSpan($pick,2)
$right=New-Object Windows.Forms.TableLayoutPanel;$right.Dock='Fill';$right.ColumnCount=1;$right.RowCount=4
foreach($v in @(38,-1,54,78)){[void]$right.RowStyles.Add((New-Object Windows.Forms.RowStyle($(if($v -eq -1){'Percent'}else{'Absolute'}),$(if($v -eq -1){100}else{$v}))))};$outer.Controls.Add($right,1,1)
$heading=New-Object Windows.Forms.Label;$heading.Text='이 품목에 추가된 내역 · 모든 구역';$heading.Dock='Fill';$heading.Font=New-Object Drawing.Font('맑은 고딕',12,[Drawing.FontStyle]::Bold);$right.Controls.Add($heading,0,0)
$grid=New-Object Windows.Forms.DataGridView;$grid.Dock='Fill';$grid.ReadOnly=$true;$grid.AllowUserToAddRows=$false;$grid.AllowUserToDeleteRows=$false;$grid.RowHeadersVisible=$false;$grid.MultiSelect=$false;$grid.SelectionMode='FullRowSelect';$grid.BackgroundColor=[Drawing.Color]::White;$grid.AutoSizeColumnsMode='Fill';$grid.RowTemplate.Height=32;$grid.ColumnHeadersHeight=36;$grid.EnableHeadersVisualStyles=$false;$grid.ColumnHeadersDefaultCellStyle.BackColor=[Drawing.Color]::FromArgb(226,234,244);$grid.AlternatingRowsDefaultCellStyle.BackColor=[Drawing.Color]::FromArgb(246,249,253)
foreach($pair in @(@('rid','ID'),@('region','구역'),@('source','선택'),@('quantity','수량'),@('status','상태'))){[void]$grid.Columns.Add($pair[0],$pair[1])};$grid.Columns['rid'].Visible=$false;$grid.Columns['region'].FillWeight=150;$right.Controls.Add($grid,0,1)
$summary=New-Object Windows.Forms.Label;$summary.Dock='Fill';$summary.Font=New-Object Drawing.Font('맑은 고딕',10);$right.Controls.Add($summary,0,2)
$buttons=New-Object Windows.Forms.TableLayoutPanel;$buttons.Dock='Fill';$buttons.ColumnCount=2;$buttons.RowCount=2
[void]$buttons.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',50)));[void]$buttons.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',50)));$right.Controls.Add($buttons,0,3)
$actions=@{}
$i=0;foreach($pair in @(@('show','선택 내역 위치 보기'),@('showzone','현재 구역 위치 보기'),@('remove','선택 연결 삭제'),@('refresh','도면 변경 후 새로고침'))){$b=New-Object Windows.Forms.Button;$b.Text=$pair[1];$b.Dock='Fill';$b.Tag=$pair[0];$buttons.Controls.Add($b,($i%2),[int][Math]::Floor($i/2));$actions[$pair[0]]=$b;$i++}
$status=New-Object Windows.Forms.Label;$status.Text='먼저 CAD의 실명·도면번호 글자를 클릭해 구역을 등록하세요.';$status.Dock='Fill';$status.Font=New-Object Drawing.Font('맑은 고딕',10);$outer.Controls.Add($status,0,2);$outer.SetColumnSpan($status,2)
function RefreshFields {
 foreach($x in $fields.Values){$x.Enabled=-not $script:pending};$zone.Enabled=-not $script:pending;$pick.Enabled=-not $script:pending;foreach($b in $actions.Values){$b.Enabled=-not $script:pending}
 if($script:pending){return}
 $m=$fields.mode.SelectedIndex
 $fields.height.Enabled=$m -in @(2,5,6,7,8);$fields.stock.Enabled=$m -eq 5;$fields.width.Enabled=$m -eq 7;$fields.pack.Enabled=$m -eq 11;$fields.manual.Enabled=$m -eq 4;$fields.factor.Enabled=$m -ne 4;$fields.selection.Enabled=$m -notin @(1,3,4,9,11)
 $pick.Text=if($m -eq 4){'③ 수동 수량 추가'}else{'③ 연속 선택 시작'}
}
function UpdateSummary {
 $current=@($script:rows | Where-Object {$_.region -eq $fields.label.Text.Trim()});$valid=@($current | Where-Object {$_.status -eq '정상'});$sum=0.0;foreach($r in $valid){$sum+=[double]::Parse($r.quantity,[Globalization.CultureInfo]::InvariantCulture)}
 $bad=$current.Count-$valid.Count;$summary.Text="현재 구역: $($current.Count)건 / 정상 수량 합계 $($sum.ToString('0.###')) / 확인필요 $bad 건`r`n품목 전체: $($script:rows.Count)건 · 수량 단위는 선택한 품목 기준"
}
function ReadSnapshot {
 $path=$Config+'.links.csv';if(-not (Test-Path -LiteralPath $path)){return}
 $stamp=(Get-Item -LiteralPath $path).LastWriteTimeUtc.Ticks.ToString();if($stamp -eq $script:stamp){return}
 try{
  $all=@(Import-Csv -LiteralPath $path -Encoding Default);$script:rows=@($all | Where-Object {$_.type -eq 'link'})
  $name=$fields.label.Text;$fields.label.Items.Clear();foreach($n in @($all | Select-Object -ExpandProperty region -Unique)){if($n){[void]$fields.label.Items.Add($n)}};$fields.label.Text=$name
  $selected=if($grid.CurrentRow){[string]$grid.CurrentRow.Cells['rid'].Value}else{''};$grid.Rows.Clear()
  foreach($r in $script:rows){$q=if($r.quantity -ne ''){([double]::Parse($r.quantity,[Globalization.CultureInfo]::InvariantCulture)).ToString('0.###')}else{'-'};$idx=$grid.Rows.Add($r.rid,$r.region,$r.source,$q,$r.status);if($r.status -ne '정상'){$grid.Rows[$idx].DefaultCellStyle.BackColor=[Drawing.Color]::MistyRose};if($r.rid -eq $selected){$grid.CurrentCell=$grid.Rows[$idx].Cells['region']}}
  if($script:pending -and $grid.Rows.Count -gt 0){$grid.FirstDisplayedScrollingRowIndex=$grid.Rows.Count-1}
  $script:stamp=$stamp;UpdateSummary
 }catch{}
}
$fields.mode.Add_SelectedIndexChanged({RefreshFields});$fields.label.Add_TextChanged({UpdateSummary});RefreshFields
function SettingsData {
 $m=$fields.mode.SelectedIndex;$data=@{mode=$m;label=$fields.label.Text.Trim();stock=[int]$fields.stock.SelectedItem}
 if(-not $data.label){throw 'CAD 글자에서 구역을 등록하거나 구역 이름을 입력하세요.'}
 foreach($k in @('factor','height','width','pack','manual')){
  $n=0.0;$needed=$fields[$k].Enabled
  if(-not [double]::TryParse($fields[$k].Text,[Globalization.NumberStyles]::Float,[Globalization.CultureInfo]::InvariantCulture,[ref]$n) -or [double]::IsNaN($n) -or [double]::IsInfinity($n) -or ($needed -and (($k -ne 'manual' -and $n -le 0) -or ($k -eq 'manual' -and $n -lt 0)))){if($needed){throw '필요한 치수와 수량을 숫자로 입력하세요.'};$n=switch($k){'factor'{1}'height'{2580}'width'{80}'pack'{1}'manual'{0}}};$data[$k]=$n
 }
 if($m -eq 7 -and $data.width -gt 1220){throw '합판 띠 폭은 1220mm 이하여야 합니다.'}
 $line=' (label . '+(LispString $data.label)+') (selection . '+(LispString $(if($fields.selection.SelectedIndex -eq 1){'whole'}else{'segment'}))+')'
 foreach($k in @('mode','factor','height','stock','width','pack','manual')){$line+=' ('+$k+' . '+$data[$k].ToString([Globalization.CultureInfo]::InvariantCulture)+')'};$line
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

function Dispatch([string]$op){
 try{
  if($script:pending){return}
  $data='((token . '+(LispString $c.token)+') (nonce . '+(LispString ([guid]::NewGuid().ToString('N')))+') (id . '+(LispString $c.id)+') (op . '+(LispString $op)+')'
  if($op -eq 'pick'){$data+=SettingsData}
  if($op -in @('show','remove')){if(-not $grid.CurrentRow){throw '오른쪽 목록에서 내역을 선택하세요.'};$data+=' (rid . '+(LispString ([string]$grid.CurrentRow.Cells['rid'].Value))+')'}
  if($op -eq 'showzone'){if(-not $fields.label.Text.Trim()){throw '구역을 먼저 선택하세요.'};$data+=' (region . '+(LispString $fields.label.Text.Trim())+')'}
  $data+=')';$doc=TargetDocument
  foreach($ext in @('.reply','.progress','.zone')){if(Test-Path -LiteralPath ($Config+$ext)){Remove-Item -LiteralPath ($Config+$ext)}}
  [IO.File]::WriteAllText($Config+'.request',$data,$enc)
  $script:pending=$true;RefreshFields;$status.Text=if($op -eq 'zone'){'CAD의 실명·도면번호 글자를 클릭하세요.'}elseif($op -eq 'pick'){'CAD에서 계속 클릭하세요. Enter / Esc로 종료합니다.'}else{'도면에서 요청을 처리하고 있습니다.'}
  $doc.Activate();$doc.SendCommand('(jl:pick-request "'+$c.token+'")'+[char]13)
 }catch{$status.Text=$_.Exception.Message;if($script:pending){$status.Text+=' CAD에서 JMLPICK을 입력하면 이어갑니다.'}else{RefreshFields}}
}
$pick.Add_Click({Dispatch 'pick'});$zone.Add_Click({Dispatch 'zone'});foreach($b in $actions.Values){$b.Add_Click({Dispatch ([string]$this.Tag)})}
$timer=New-Object Windows.Forms.Timer;$timer.Interval=400
$timer.Add_Tick({
 if(Test-Path -LiteralPath ($Config+'.closed')){$form.Close();return}
 ReadSnapshot
 if($script:pending){
  try{if(Test-Path -LiteralPath ($Config+'.progress')){$status.Text=[IO.File]::ReadAllText($Config+'.progress',$enc)}}catch{}
  if(Test-Path -LiteralPath ($Config+'.reply')){
   try{
    $status.Text=[IO.File]::ReadAllText($Config+'.reply',$enc)
    if(Test-Path -LiteralPath ($Config+'.zone')){$fields.label.Text=[IO.File]::ReadAllText($Config+'.zone',$enc).Trim();Remove-Item -LiteralPath ($Config+'.zone')}
    $script:pending=$false;RefreshFields;ReadSnapshot;UpdateSummary
   }catch{}
  }
 }
})
$form.Add_Shown({ReadSnapshot;$timer.Start();if($SmokeTest){
 $bitmap=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bitmap,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bitmap.Save($Config+'.png');$bitmap.Dispose()
 @{mode=$fields.mode.SelectedIndex;rows=$grid.Rows.Count;regions=$fields.label.Items.Count;heightEnabled=$fields.height.Enabled;packEnabled=$fields.pack.Enabled;topMost=$form.TopMost} | ConvertTo-Json | Set-Content ($Config+'.test.json')
 $form.Close()
}})
$form.Add_FormClosed({$timer.Stop();[IO.File]::WriteAllText($Config+'.closed','closed')})
try{[void]$form.ShowDialog()}finally{$timer.Dispose();$form.Dispose()}

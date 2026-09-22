param([Parameter(Mandatory=$true)][string]$Snapshot,[Parameter(Mandatory=$true)][string]$Result,[switch]$SmokeTest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$records=@(Import-Csv -LiteralPath $Snapshot -Encoding Default)
$script:selection=''; $script:loading=$true
$statePath=$Snapshot+'.ui.json'
$previous=$null
if(Test-Path -LiteralPath $statePath){try{$previous=Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json}catch{}}
$screen=[Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$form=New-Object Windows.Forms.Form
$form.Text='JM 물량 산출 · 내역서 연결'
$form.StartPosition='CenterScreen'; $form.AutoScaleMode='Dpi'
$form.Size=New-Object Drawing.Size([Math]::Min(1240,$screen.Width-40),[Math]::Min(810,$screen.Height-50))
$form.MinimumSize=New-Object Drawing.Size(940,600)
$form.Font=New-Object Drawing.Font('맑은 고딕',11)
$form.BackColor=[Drawing.Color]::FromArgb(245,247,250)
$layout=New-Object Windows.Forms.TableLayoutPanel
$layout.Dock='Fill'; $layout.Padding=New-Object Windows.Forms.Padding(20);$layout.ColumnCount=1;$layout.RowCount=6
foreach($h in @(54,54,32)){$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',$h))) | Out-Null}
$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Percent',100))) | Out-Null
$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',86))) | Out-Null
$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',56))) | Out-Null
$form.Controls.Add($layout)
$header=New-Object Windows.Forms.TableLayoutPanel;$header.Dock='Fill';$header.ColumnCount=3
$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100))) | Out-Null
$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',125))) | Out-Null
$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',170))) | Out-Null
$title=New-Object Windows.Forms.Label;$title.Text='내역서에서 품목을 선택하세요';$title.Dock='Fill';$title.Font=New-Object Drawing.Font('맑은 고딕',16,[Drawing.FontStyle]::Bold)
$export=New-Object Windows.Forms.Button;$export.Text='새 엑셀로 저장';$export.Dock='Fill';$export.Height=40;$export.FlatStyle='Flat';$export.BackColor=[Drawing.Color]::White
$fontSize=New-Object Windows.Forms.ComboBox;$fontSize.DropDownStyle='DropDownList';$fontSize.Items.AddRange(@('글자 11','글자 12','글자 13'));$fontSize.SelectedIndex=0;$fontSize.Dock='Top';$fontSize.Margin=New-Object Windows.Forms.Padding(6,6,12,0)
$header.Controls.Add($title,0,0);$header.Controls.Add($fontSize,1,0);$header.Controls.Add($export,2,0);$layout.Controls.Add($header,0,0)
$filters=New-Object Windows.Forms.TableLayoutPanel;$filters.Dock='Fill';$filters.ColumnCount=7
foreach($w in @(52,190,52,135,52)){$filters.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',$w))) | Out-Null}
$filters.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100))) | Out-Null
$filters.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',72))) | Out-Null
function MakeLabel($text){$l=New-Object Windows.Forms.Label;$l.Text=$text;$l.Dock='Fill';$l.TextAlign='MiddleLeft';return $l}
$group=New-Object Windows.Forms.ComboBox;$group.DropDownStyle='DropDownList';$group.Dock='Fill';$group.Margin=New-Object Windows.Forms.Padding(2,8,10,0)
$group.Items.Add('전체 공종') | Out-Null
@($records | ForEach-Object{$_.group} | Select-Object -Unique) | ForEach-Object{$group.Items.Add($_) | Out-Null};$group.SelectedIndex=0
$status=New-Object Windows.Forms.ComboBox;$status.DropDownStyle='DropDownList';$status.Dock='Fill';$status.Margin=New-Object Windows.Forms.Padding(2,8,10,0)
$status.Items.AddRange(@('전체 상태','미연결','연결됨','확인필요'));$status.SelectedIndex=0
$search=New-Object Windows.Forms.TextBox;$search.Dock='Fill';$search.Margin=New-Object Windows.Forms.Padding(2,8,10,0)
$reset=New-Object Windows.Forms.Button;$reset.Text='초기화';$reset.Dock='Fill';$reset.FlatStyle='Flat';$reset.BackColor=[Drawing.Color]::White
$filters.Controls.Add((MakeLabel '공종'),0,0);$filters.Controls.Add($group,1,0);$filters.Controls.Add((MakeLabel '상태'),2,0);$filters.Controls.Add($status,3,0);$filters.Controls.Add((MakeLabel '검색'),4,0);$filters.Controls.Add($search,5,0);$filters.Controls.Add($reset,6,0)
$layout.Controls.Add($filters,0,1)
$counts=MakeLabel ''; $counts.ForeColor=[Drawing.Color]::FromArgb(74,88,108);$counts.Font=New-Object Drawing.Font('맑은 고딕',10);$layout.Controls.Add($counts,0,2)
$grid=New-Object Windows.Forms.DataGridView
$grid.Dock='Fill';$grid.ReadOnly=$true;$grid.AllowUserToAddRows=$false;$grid.AllowUserToDeleteRows=$false;$grid.RowHeadersVisible=$false
$grid.SelectionMode='FullRowSelect';$grid.MultiSelect=$false;$grid.AutoGenerateColumns=$false;$grid.AllowUserToResizeRows=$false
$grid.BackgroundColor=[Drawing.Color]::White;$grid.BorderStyle='None';$grid.CellBorderStyle='SingleHorizontal';$grid.GridColor=[Drawing.Color]::FromArgb(230,234,240)
$grid.EnableHeadersVisualStyles=$false;$grid.ColumnHeadersHeight=40;$grid.ColumnHeadersHeightSizeMode='DisableResizing'
$grid.ColumnHeadersDefaultCellStyle.BackColor=[Drawing.Color]::FromArgb(233,238,245)
$grid.ColumnHeadersDefaultCellStyle.Font=New-Object Drawing.Font('맑은 고딕',11,[Drawing.FontStyle]::Bold)
$grid.DefaultCellStyle.SelectionBackColor=[Drawing.Color]::FromArgb(219,235,255);$grid.DefaultCellStyle.SelectionForeColor=[Drawing.Color]::FromArgb(18,49,87)
$grid.DefaultCellStyle.Padding=New-Object Windows.Forms.Padding(8,0,8,0);$grid.RowTemplate.Height=36
$grid.AlternatingRowsDefaultCellStyle.BackColor=[Drawing.Color]::FromArgb(249,251,254)
$table=New-Object Data.DataTable
$defs=@(@('id','ID',0),@('group','공종',145),@('name','품명',245),@('spec','규격',260),@('unit','단위',65),@('quantity','산출 수량',105),@('status','연결 상태',105))
foreach($d in $defs){[void]$table.Columns.Add($d[0],[string]);$c=New-Object Windows.Forms.DataGridViewTextBoxColumn;$c.Name=$d[0];$c.DataPropertyName=$d[0];$c.HeaderText=$d[1];$c.Width=[Math]::Max(30,$d[2]);$c.SortMode='NotSortable';if($d[0] -eq 'id'){$c.Visible=$false};if($d[0] -eq 'name'){$c.AutoSizeMode='Fill';$c.MinimumWidth=175};if($d[0] -eq 'quantity'){$c.DefaultCellStyle.Alignment='MiddleRight'};[void]$grid.Columns.Add($c)}
$grid.DataSource=$table;$layout.Controls.Add($grid,0,3)
$details=New-Object Windows.Forms.Label;$details.Dock='Fill';$details.Padding=New-Object Windows.Forms.Padding(10,9,8,5);$details.BackColor=[Drawing.Color]::FromArgb(235,240,247);$details.AutoEllipsis=$true;$details.Text='품목을 선택하면 전체 규격과 연결 정보를 확인할 수 있습니다.';$layout.Controls.Add($details,0,4)
$actions=New-Object Windows.Forms.FlowLayoutPanel;$actions.Dock='Fill';$actions.WrapContents=$false;$actions.Padding=New-Object Windows.Forms.Padding(0,7,0,0)
function MakeButton($text,$width){$b=New-Object Windows.Forms.Button;$b.Text=$text;$b.Width=$width;$b.Height=40;$b.FlatStyle='Flat';$b.BackColor=[Drawing.Color]::White;$b.Margin=New-Object Windows.Forms.Padding(0,0,10,0);return $b}
$add=MakeButton '도면 선택해서 추가' 190;$add.BackColor=[Drawing.Color]::FromArgb(30,94,190);$add.ForeColor=[Drawing.Color]::White
$show=MakeButton '도면 위치 보기' 150;$links=MakeButton '연결 관리' 125;$check=MakeButton '누락 후보 검사' 150;$close=MakeButton '닫기' 85
$actions.Controls.AddRange(@($add,$show,$links,$check,$close));$layout.Controls.Add($actions,0,5)
function UpdateSelection {
 $has=$null -ne $grid.CurrentRow -and $grid.Rows.Count -gt 0
 foreach($b in @($add,$show,$links,$check)){$b.Enabled=$has}
 if(-not $has){$script:selection='';$details.Text='검색 결과가 없습니다. 공종·상태 필터를 바꾸거나 검색어를 지워주세요.';return}
 $script:selection=[string]$grid.CurrentRow.Cells['id'].Value
 $r=$records | Where-Object{$_.id -eq $script:selection} | Select-Object -First 1
 if($r){$details.Text=$r.name+'   ·   '+$r.group+"`r`n규격: "+$(if($r.spec){$r.spec}else{'-'})+'   |   단위: '+$r.unit+'   |   연결 '+$r.links+'건'+"`r`n품목을 더블클릭하면 도면 연결을 시작합니다."}
}
function ApplyFilter {
 if($script:loading){return}
 $keep=$script:selection;$term=$search.Text.Trim()
 $table.Rows.Clear()
 foreach($r in $records){
  if($group.SelectedIndex -gt 0 -and $r.group -ne [string]$group.SelectedItem){continue}
  if($status.SelectedIndex -gt 0 -and $r.status -ne [string]$status.SelectedItem){continue}
  if($term -and ($r.name+' '+$r.spec+' '+$r.group).IndexOf($term,[StringComparison]::OrdinalIgnoreCase) -lt 0){continue}
  $n=$table.NewRow();foreach($d in $defs){$n[$d[0]]=[string]$r.($d[0]);if($d[0] -eq 'quantity' -and $r.status -eq '연결됨'){$n[$d[0]]=([double]::Parse($r.quantity,[Globalization.CultureInfo]::InvariantCulture)).ToString('#,##0.###',[Globalization.CultureInfo]::InvariantCulture)}};$table.Rows.Add($n)
 }
 foreach($r in $grid.Rows){$s=[string]$r.Cells['status'].Value;$r.Cells['status'].Style.ForeColor=switch($s){'연결됨'{[Drawing.Color]::FromArgb(26,122,80)} '확인필요'{[Drawing.Color]::FromArgb(188,52,42)} default{[Drawing.Color]::FromArgb(112,121,135)}};if([string]$r.Cells['id'].Value -eq $keep){$grid.CurrentCell=$r.Cells['name']}}
 $ok=@($records | Where-Object{$_.status -eq '연결됨'}).Count;$bad=@($records | Where-Object{$_.status -eq '확인필요'}).Count
 $counts.Text='전체 '+$records.Count+'개    연결 '+$ok+'개    미연결 '+($records.Count-$ok-$bad)+'개    확인필요 '+$bad+'개    |    현재 표시 '+$table.Rows.Count+'개'
 UpdateSelection
}
function CompleteAction([int]$action){
 if($action -in @(1,2,3,4) -and -not $script:selection){return}
 if($script:selection -and $script:selection -notmatch '^R[0-9]+$'){throw '항목 식별자가 잘못되었습니다.'}
 [IO.File]::WriteAllText($Result,'((action . '+$action+') (id . "'+$script:selection+'"))',[Text.Encoding]::ASCII)
 $form.Close()
}
$add.Add_Click({CompleteAction 1});$show.Add_Click({CompleteAction 2});$check.Add_Click({CompleteAction 3});$links.Add_Click({CompleteAction 4});$export.Add_Click({CompleteAction 5});$close.Add_Click({CompleteAction 0})
$grid.Add_CellDoubleClick({param($sender,$e) if($e.RowIndex -ge 0){CompleteAction 1}})
$grid.Add_SelectionChanged({if(-not $script:loading){UpdateSelection}})
$group.Add_SelectedIndexChanged({ApplyFilter});$status.Add_SelectedIndexChanged({ApplyFilter});$search.Add_TextChanged({ApplyFilter})
$reset.Add_Click({$script:loading=$true;$group.SelectedIndex=0;$status.SelectedIndex=0;$search.Clear();$script:loading=$false;ApplyFilter})
$fontSize.Add_SelectedIndexChanged({
 $size=11+$fontSize.SelectedIndex;$form.Font=New-Object Drawing.Font('맑은 고딕',$size)
 $grid.ColumnHeadersDefaultCellStyle.Font=New-Object Drawing.Font('맑은 고딕',$size,[Drawing.FontStyle]::Bold)
 $grid.RowTemplate.Height=36+($size-11)*3;foreach($r in $grid.Rows){$r.Height=$grid.RowTemplate.Height}
})
$form.CancelButton=$close
$form.Add_FormClosing({
 try{@{group=[string]$group.SelectedItem;status=[string]$status.SelectedItem;search=$search.Text;id=$script:selection;fontSize=$fontSize.SelectedIndex} | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8}catch{}
 if(-not (Test-Path -LiteralPath $Result)){[IO.File]::WriteAllText($Result,'((action . 0) (id . ""))')}
})
$form.Add_Shown({
 if($previous){if($previous.fontSize -in @(0,1,2)){$fontSize.SelectedIndex=[int]$previous.fontSize};if($group.Items.Contains([string]$previous.group)){$group.SelectedItem=[string]$previous.group};if($status.Items.Contains([string]$previous.status)){$status.SelectedItem=[string]$previous.status};$search.Text=[string]$previous.search;$script:selection=[string]$previous.id}
 $script:loading=$false;ApplyFilter
 if($SmokeTest){
  $before=$table.Rows.Count;$search.Text='각재';$filtered=$table.Rows.Count
  $status.SelectedItem='미연결';$empty=$table.Rows.Count;$disabled=(-not $add.Enabled)
  $reset.PerformClick();$group.SelectedItem='목작업';$groupRows=$table.Rows.Count;$reset.PerformClick()
  $bmp=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bmp,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bmp.Save($Snapshot+'.preview.png');$bmp.Dispose()
  @{rows=$before;searchResults=$filtered;emptyResults=$empty;emptyDisablesActions=$disabled;woodRows=$groupRows;columns=$grid.Columns.Count-1;fontSize=$form.Font.Size} | ConvertTo-Json | Set-Content ($Snapshot+'.test.json')
  CompleteAction 0
 }
})
try{[void]$form.ShowDialog()}finally{$form.Dispose()}

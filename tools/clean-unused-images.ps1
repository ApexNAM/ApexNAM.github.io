# 미사용 게시글 이미지 정리 스크립트
#
# 사용법 (저장소 루트에서):
#   powershell -File tools/clean-unused-images.ps1           → 삭제 후보 미리보기만
#   powershell -File tools/clean-unused-images.ps1 -Delete   → 실제로 git rm 실행
#
# 검사 대상: srcs/imgs/post_imgs/ 아래 이미지 + 저장소 루트에 굴러다니는 이미지
# (게임 페이지 에셋 폴더는 건드리지 않음)
param([switch]$Delete)

$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

$images = git ls-files | Where-Object {
    $_ -match '\.(png|jpe?g|gif|webp)$' -and
    ($_ -like 'srcs/imgs/post_imgs/*' -or $_ -notmatch '/')
}

$docs = git ls-files | Where-Object {
    $_ -match '\.(md|html|css|js)$' -and $_ -notlike '_templates/*'
}
$haystack = ($docs | ForEach-Object { Get-Content $_ -Raw -Encoding UTF8 }) -join "`n"
Add-Type -AssemblyName System.Web
$haystackDecoded = [System.Web.HttpUtility]::UrlDecode($haystack)

$orphans = @()
foreach ($img in $images) {
    $name = [System.IO.Path]::GetFileName($img)
    # 파일명이 어디에서도 언급되지 않으면 미사용으로 판정
    # (같은 파일명이 다른 폴더에서 쓰이면 보수적으로 남겨둠)
    if (-not $haystack.Contains($name) -and -not $haystackDecoded.Contains($name)) {
        $orphans += $img
    }
}

if ($orphans.Count -eq 0) {
    Write-Host "미사용 이미지가 없습니다." -ForegroundColor Green
    exit 0
}

Write-Host "미사용 이미지 $($orphans.Count)개:" -ForegroundColor Yellow
$orphans | ForEach-Object { Write-Host "  $_" }

if ($Delete) {
    $orphans | ForEach-Object { git rm -- "$_" }
    Write-Host "삭제 완료. 커밋해서 반영하세요. (git 히스토리에서 복구 가능)" -ForegroundColor Green
} else {
    Write-Host "`n실제로 삭제하려면 -Delete 옵션을 붙여 다시 실행하세요." -ForegroundColor Cyan
}

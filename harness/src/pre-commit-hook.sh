#!/bin/zsh

# 🛡️ Git 커밋 전 무결성 검증 훅 (Pre-commit Hook Template)
# 본 파일은 .git/hooks/pre-commit 파일로 심볼릭 링크하거나 복사해서 사용합니다.
# 역할: 커밋 생성 전 코드 포맷팅, oxlint Linter 검증 및 TypeScript 컴파일 에러를 차단합니다.

echo "============================================="
echo " 🛡️ Git pre-commit Hook: 코드 무결성 검사 중..."
echo "============================================="

# 1. oxlint Linter 검사 (대시보드 소스 코드 검사)
if [ -d "dashboard" ]; then
    echo "\n🔎 [1단계] oxlint Linter 구동..."
    cd dashboard
    
    # oxlint 설치 여부 검사
    if npx oxlint --version >/dev/null 2>&1; then
        npx oxlint
        LINT_STATUS=$?
        if [ $LINT_STATUS -ne 0 ]; then
            echo " ❌ Lint 에러 감지: 코드를 수정하기 전에는 커밋할 수 없습니다."
            exit 1
        fi
        echo " ✅ Linter 검증 통과!"
    else
        echo " ⚠️ 경고: oxlint가 설치되어 있지 않아 린트 단계는 스킵합니다."
    fi
    cd ..
fi

# 2. TypeScript 컴파일러 타입 체크 (tsc)
if [ -d "dashboard" ]; then
    echo "\n🔎 [2단계] TypeScript 컴파일 및 타입 검증 (tsc)..."
    cd dashboard
    
    # tsc 구동 (빌드를 통한 타입 검증)
    if npm run build >/dev/null 2>&1; then
        echo " ✅ TypeScript 타입 체크 & 빌드 무결성 검증 통과!"
    else
        echo " ❌ TypeScript 컴파일 오류 감지: 빌드가 실패하여 커밋을 차단합니다."
        echo "    로컬에서 'npm run build'를 직접 구동하여 타입 오류를 픽스하세요."
        exit 1
    fi
    cd ..
fi

echo "\n🎉 [검증 성공] 모든 무결성 테스트를 통과했습니다. 커밋을 진행합니다."
exit 0

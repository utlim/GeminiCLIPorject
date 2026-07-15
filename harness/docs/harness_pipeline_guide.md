# 🛡️ 테스트 하네스 & 배포 자동화 파이프라인 가이드 (Harness Pipeline Guide)

본 문서는 신규 대상 사이트의 데이터 수집, 가공, 시각화 및 웹 대시보드 무결성을 검증하고, 이를 GitHub Pages로 배포하는 자동화 툴체인(Harness/Hook/Workflow)의 명세서 및 사용 설명서입니다.

---

## 1. ⚙️ 로컬 오케스트레이터 CLI (`harness/src/orchestrator.py`)
로컬 개발 환경에서 수집부터 빌드 검증까지의 전 단계를 일괄 구동 및 제어하기 위한 오케스트레이션 도구입니다.

### 🚀 사용법 및 옵션
```bash
python harness/src/orchestrator.py \
  --scraper <수집기 경로> \
  --analyzer <분석기 경로> \
  --converter <데이터 전처리 경로> \
  --dashboard <대시보드 루트 디렉터리>
```

* **동작 파이프라인 순서**:
  1. **수집 단계**: 수집 스크립트 실행 후 원천 데이터 생성 검증.
  2. **분석 단계**: pandas 정제 및 matplotlib 차트 이미지 생산.
  3. **전처리 단계**: CSV를 프론트엔드가 바로 소비할 수 있도록 JSON 에셋 변환 배치.
  4. **최종 빌드 검증**: `npm run build`를 통한 TypeScript 타입 검사 및 정적 번들링 에러 사전 감지.
* **통과 조건**: 모든 단계에서 오류(`Exit Code: 0`)가 없어야 무결성 패스가 완료됩니다.

---

## 2. 🛡️ Git pre-commit 훅 연동 (`harness/src/pre-commit-hook.sh`)
오류가 있는 코드나 TypeScript 컴파일 에러를 유발하는 변경 사항이 원격 깃 저장소에 커밋되는 것을 개발자의 로컬 단계에서 강제 차단합니다.

### 🛠️ 설치 및 활성화 방법
로컬 저장소 루트 경로에서 터미널을 열고 아래 명령어를 실행하여 훅을 활성화합니다.

```bash
# 1. 템플릿 파일을 git pre-commit hook 경로로 복사
cp harness/src/pre-commit-hook.sh .git/hooks/pre-commit

# 2. 훅 파일에 실행 권한 부여
chmod +x .git/hooks/pre-commit
```

* **동작 시점**: 개발자가 `git commit -m "..."`을 실행하는 즉시 자동으로 가동됩니다.
* **차단 요건**:
  * oxlint 린터 에러 검출 시 커밋 즉각 차단.
  * TypeScript 컴파일 에러(`tsc -b`) 검출 시 커밋 차단.
  * 검증을 모두 통과하면 커밋 생성이 완료됩니다.

---

## 3. 🚀 GitHub Actions 배포 워크플로우 (`.github/workflows/deploy.yml`)
로컬 무결성 검증을 통과해 `master` 브랜치에 코드가 push되면, 깃허브 원격 서버가 자동으로 배포를 수행하는 CI/CD 파이프라인입니다.

* **동작 조건**: `master` 브랜치에 푸시가 발생하고, 동시에 `dashboard/` 폴더 내 소스 코드가 변경되었을 때 가동.
* **배포 기법 (JamesIves Deploy Action)**:
  * 깃허브 Actions 가상 가동 환경에서 Node.js 캐시 패키지를 복구 및 의존성을 정합합니다.
  * `npm run build`를 통해 생성된 순수 프로덕션 빌드 에셋(`dashboard/dist/` 폴더 내부의 5개 파일)만 분리 추출합니다.
  * 깃허브가 제공하는 환경 토큰을 활용해 원격 **`gh-pages`** 브랜치로 무결점 클린 덮어쓰기 배포를 안전하게 수행하여 호스팅을 자동 갱신합니다.

---

## 4. 🤖 자율 협업 에이전트 팀 가동 & 프롬프트 예시 (Subagent Prompt Blueprints)
신규 사이트의 분석 프로젝트 실행 시, `/teamwork-preview` 커맨드로 소환된 3대 전문 자율 에이전트에 지시할 때 사용하는 구체적인 **역할별 지시 프롬프트 예시**입니다.

### A. 수집 전담 에이전트 (Scraper Agent) 호출 예시
> **[지시 프롬프트]**
> "너는 수집 전담 에이전트(Scraper Agent)다. `.agents/rules/universal-scraping-rules.md`를 필독하고 다음 작업을 수행하라:
> 1. 타겟 도메인 `https://example.com/trends`를 정찰하여 SSR/SPA 여부 및 데이터 수신 API endpoint를 식별하라.
> 2. `requests` 패키지 또는 Playwright 스니핑 기술을 사용해 데이터를 가로채는 `scraper.py` 코드를 작성하라.
> 3. 수집 속도에 최소 1.5초 지연(sleep)을 섞어 우회하고 결과를 `data/trends.csv` 정규 데이터셋으로 정합해라."

### B. 분석 전담 에이전트 (Analyzer Agent) 호출 예시
> **[지시 프롬프트]**
> "너는 분석 전담 에이전트(Analyzer Agent)다. `.agents/rules/universal-analysis-rules.md`를 준수하여 다음 작업을 수행하라:
> 1. `data/trends.csv` 데이터를 로드해 pandas 기술 통계량을 도출하라.
> 2. matplotlib를 가동해 시각화 차트 3종을 생성하라. (단, seaborn의 테마 설정은 금지하며, `import koreanize_matplotlib`을 필수 호출해 한글 깨짐을 예방하라.)
> 3. 분석 보고서인 `reports/EDA_Report.md`와 발표용 `reports/EDA_Report_Slides.md`(Marp 마크다운 형식)를 자동 작성하라."

### C. 대시보드 및 배포 에이전트 (Dashboard Agent) 호출 예시
> **[지시 프롬프트]**
> "너는 대시보드 개발 에이전트(Dashboard Agent)다. `.agents/rules/universal-dashboard-rules.md`를 엄격히 준수하라:
> 1. `reports/EDA_Report.md` 분석 결과를 바탕으로, 데이터를 프론트엔드가 즉시 임포트할 수 있도록 JSON 에셋으로 변환 전처리하라.
> 2. React + TS 기반의 Bento Grid 테마 반응형 웹 대시보드 UI를 작성하라.
> 3. Chart.js 시각화 마운트 시 리렌더링 오류를 차단하기 위해 고유 `key={theme + data.length}`를 연동하고, `LineController`와 `BarController` 모듈을 명시적 레지스터에 등록하라."

---

## 5. ⚓ 로컬 pre-commit 훅 동작 로그 예시 (Git Hook Output Example)
로컬에서 개발자가 커밋을 수행할 때, 터미널 상에서 `pre-commit-hook.sh`가 무결성을 검증하고 내뱉는 정상 패스 로그 시뮬레이션입니다.

```text
$ git commit -m "feat: 새로운 대시보드 필터 상태 연동"

=============================================
 🛡️ Git pre-commit Hook: 코드 무결성 검사 중...
=============================================

🔎 [1단계] oxlint Linter 구동...
  - dashboard/src/App.tsx 검사 중...
  - dashboard/src/components/BestsellerCharts.tsx 검사 중...
 ✅ Linter 검증 통과!

🔎 [2단계] TypeScript 컴파일 및 타입 검증 (tsc)...
  - tsc -b 빌드 구동...
  - vite build 번들 최적화...
 ✅ TypeScript 타입 체크 & 빌드 무결성 검증 통과!

🎉 [검증 성공] 모든 무결성 테스트를 통과했습니다. 커밋을 진행합니다.

[master 8c0d9fa] feat: 새로운 대시보드 필터 상태 연동
 2 files changed, 25 insertions(+)
```


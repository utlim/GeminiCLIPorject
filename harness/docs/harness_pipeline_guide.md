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

---

## 6. 🛠️ 안정성 및 보안 보완 수칙 (Robustness & Security Best Practices)
테스트 하네스의 신뢰성과 원격 자동 배포의 무결성을 기성급 수준으로 유지하기 위해 아래 **5가지 상세 보완 조치**를 실전 코딩 시 적용합니다.

### ① 데이터 스키마 유효성 검증 (Data Schema Validation)
* **문제점**: 수집 데이터의 컬럼 누락이나 타입 오매칭은 빌드 시점에 잡히지 않아 대시보드 런타임 크래시를 유발합니다.
* **보완책**: 파이썬 `pydantic` 또는 `marshmallow` 스키마 벨리데이터를 활용해 데이터 로드 시 각 행의 규격(정가 ＞ 판매가 여부, 필수 문자열 검사 등)을 1차적으로 강제 통과시켜 검증을 고도화합니다.

### ② 비밀 자격 증명 보안 강화 (Credential Security)
* **문제점**: API 게이트웨이 호출 토큰이나 깃허브 개인 API 키가 마스터 브랜치에 그대로 커밋되어 외부에 노출될 위험이 존재합니다.
* **보완책**:
  - 비밀 정보는 프로젝트 루트의 `.env` 파일에 보관하고 `.gitignore`에 등록하여 로컬 디스크 상에만 격리합니다.
  - GitHub Actions 구동 시에는 GitHub Repository Settings ➡️ Secrets에 토큰을 안전하게 등록하고, `deploy.yml` 본문에서 `${{ secrets.DEPLOY_TOKEN }}` 형태로만 주입받도록 구성합니다.

### ③ 가상환경 의존성 자동 동기화 (Dependency Auto-Syncing)
* **문제점**: 수집기나 분석기가 로컬에 없는 외부 라이브러리(예: `requests`, `playwright` 등)를 임포트할 때 로컬 오케스트레이터가 예외를 뿜고 뻗어 버립니다.
* **보완책**: `orchestrator.py` 구동 도입부에 현재 사용 가상환경(`sys.executable`)에 락된 패키지 리스트를 검사하고, 미설치 라이브러리 검출 시 `uv pip install -r requirements.txt` 를 자동으로 Subprocess로 트리거하여 실행 동기화(Syncing)를 보장합니다.

### ④ Playwright 요소 기반 대기 전략 (DOM Wait Strategy)
* **문제점**: 페이지 로딩이 네트워크 지연으로 느려질 경우 단순 시간 지연(`time.sleep`)이나 `networkidle`은 30초 한계 타임아웃 오류를 야기합니다.
* **보완책**: 중요 컨테이너 요소가 마운트될 때까지 대기하는 `page.wait_for_selector(".dashboard-ready-class", timeout=10000)` 등 요소 기반 반응형 대기(DOM-based Wait) 코드를 수집 및 캡처 스크립트에 반드시 구성합니다.

### ⑤ 대시보드 런타임 Error Boundary 및 롤백 정책
* **문제점**: 예기치 못한 브라우저 런타임 오류 시, 대시보드 페이지 전체가 하얗게 크래시되는 현상이 생기며, 깃허브 배포 오작동 시 이전 버전으로 수동 복구해야 합니다.
* **보완책**:
  - React 대시보드 내 최상단에 `ErrorBoundary` 컴포넌트를 설계하여 크래시 시 사용자에게 친절한 "에러 복구 중" 컴포넌트를 띄우고 차트 붕괴를 고립시킵니다.
  - 배포 실패나 비정상 렌더링 검출 시, 깃 명령 `git push origin +<commit-hash>:gh-pages`를 강제로 실행해 즉각 이전 무오류 배포본으로의 즉시 롤백(Rollback Roll) 정책을 수립해 운용합니다.



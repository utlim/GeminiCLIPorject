# 🎨 범용 데이터 자동화 파이프라인 아키텍처 다이어그램

본 문서는 수집, 분석, 리포팅, 대시보드 렌더링 및 훅 기반 검증으로 이어지는 범용 자동화 프레임워크의 상세 데이터 흐름 및 에이전트 협업 구조를 시각화한 Mermaid 다이어그램 문서입니다.

---

## 📊 파이프라인 통합 흐름도 (Mermaid Diagram)

```mermaid
flowchart TD
    %% 스타일 정의
    classDef init fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef agent fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef validate fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef deploy fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff;
    classDef data fill:#f59e0b,stroke:#d97706,stroke-width:1px,color:#fff;

    %% 노드 정의
    Start(["🚀 파이프라인 개시 요청"]):::init
    
    subgraph Step1 ["1단계: 정찰 및 데이터 수집"]
        Recon["1.1 웹사이트 스택 정찰<br>(SPA, SSR, Robots.txt)"]
        Scraper["1.2 Scraper Agent 구동<br>(Playwright / Requests)"]
        RawCSV[("원천 CSV 데이터셋<br>(data/bestsellers.csv)")]:::data
    end
    
    subgraph Step2 ["2단계: EDA 분석 및 문서화"]
        Analyzer["2.1 Analyzer Agent 구동<br>(pandas / matplotlib)"]
        Charts["2.2 한글 폰트 차트 생성<br>(images/*.png)"]
        Report["2.3 EDA Report & Marp 슬라이드 작성<br>(reports/EDA_Report.md)"]
    end
    
    subgraph Step3 ["3단계: 전처리 및 빌드 검증"]
        Preprocess["3.1 CSV to JSON 전처리 변환<br>(convert_data.py)"]
        JsonAsset[("정형 JSON 에셋<br>(src/assets/data/*.json)")]:::data
        Dashboard["3.2 React 대시보드 UI 연동<br>(App.tsx / Charts.tsx)"]
    end

    subgraph Step4 ["4단계: 로컬 훅 검증 (Harness / Hook)"]
        Hook{"Git pre-commit Hook 작동<br>(pre-commit-hook.sh)"}:::validate
        LintCheck["oxlint Linter 검사"]
        TscCheck["tsc -b 타입 컴파일 검증"]
        HarnessCli["harness/src/orchestrator.py<br>(5단계 로컬 일괄 검사)"]:::validate
    end

    subgraph Step5 ["5단계: CI/CD 자동화 및 배포"]
        Commit["Git master Push"]
        Actions["GitHub Actions 트리거<br>(.github/workflows/deploy.yml)"]
        BuildStep["npm run build <br>(Vite 상대경로 './' 컴파일)"]
        DeployStep["gh-pages 브랜치 clean force-push"]:::deploy
        LiveUrl(["🌐 실시간 대시보드 오픈<br>(utlim.github.io/repo-name/)"]):::deploy
    end

    %% 관계선 매핑
    Start --> Recon
    Recon --> Scraper
    Scraper -->|universal-scraping-rules 적용| RawCSV
    
    RawCSV --> Analyzer
    Analyzer -->|koreanize-matplotlib 적용| Charts
    Analyzer -->|universal-analysis-rules 적용| Report
    
    RawCSV & Report --> Preprocess
    Preprocess --> JsonAsset
    JsonAsset --> Dashboard
    
    Dashboard --> HarnessCli
    HarnessCli -->|로컬 파이프라인 일괄 검사| Hook
    Hook -->|검사 1| LintCheck
    Hook -->|검사 2| TscCheck
    
    TscCheck -->|타입 검증 무오류 통과| Commit
    Commit --> Actions
    Actions --> BuildStep
    BuildStep --> DeployStep
    DeployStep --> LiveUrl

    %% 스타일 바인딩
    class Start,Recon,Scraper init;
    class Analyzer,Dashboard agent;
    class LintCheck,TscCheck validate;
    class Commit,Actions,BuildStep deploy;
```

---

## 🔄 파이프라인 시퀀스 다이어그램 (Sequence Diagram)

본 시퀀스 다이어그램은 수집-분석-커밋-빌드-배포 전 과정에 참여하는 로컬 구성원들과 원격 깃허브 파이프라인 간의 **시간 순서 흐름과 역할 인계 상호작용**을 구체적으로 도식화한 것입니다.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as 개발자 / 에이전트
    participant Orc as 오케스트레이터<br>(orchestrator.py)
    participant Hook as Git pre-commit Hook<br>(pre-commit-hook.sh)
    participant Git as 로컬 Git 저장소
    participant Hub as GitHub 원격 저장소
    participant Act as GitHub Actions<br>(deploy.yml)
    participant Pages as GitHub Pages CDN

    %% 1. 로컬 파이프라인 가동
    Note over Dev, Orc: 1단계: 로컬 파이프라인 일괄 실행 (수집 및 변환)
    Dev->>Orc: 파이프라인 가동 명령 (args: scraper, analyzer, converter)
    activate Orc
    Orc->>Orc: 1. 수집기 (scraper.py) 구동 ➡️ CSV 데이터 적재
    Orc->>Orc: 2. 분석기 (eda.py) 구동 ➡️ 차트 이미지 & EDA 리포트 생성
    Orc->>Orc: 3. 변환기 (convert_data.py) 구동 ➡️ 정형 JSON 에셋 추출
    Orc-->>Dev: 전처리 완료 및 에셋 대시보드 이식 완료 보고
    deactivate Orc

    %% 2. Git Commit 검증 단계
    Note over Dev, Git: 2단계: 로컬 커밋 및 Hook 무결성 검증 (Gate)
    Dev->>Git: git commit 실행 요청
    activate Hook
    Git->>Hook: 커밋 전 Hook 가로채기 트리거
    Hook->>Hook: 1. oxlint Linter 검증
    Hook->>Hook: 2. npm run build (tsc 타입 체크 및 빌드 이상 유무 검사)
    alt 타입 검증 에러 발생 (TypeScript 에러 등)
        Hook-->>Git: 에러 검출 (Exit Code: 1)
        Git-->>Dev: 커밋 거절 및 중단 (Commit Blocked)
    else 타입 검증 무오류 패스 (Exit Code: 0)
        Hook-->>Git: 통과 (Exit Code: 0)
        deactivate Hook
        Git->>Git: 로컬 커밋 생성 완료
        Git-->>Dev: 커밋 성공 보고
    end

    %% 3. 원격 푸시 및 자동 배포 단계
    Note over Dev, Pages: 3단계: 원격 동기화 및 깃허브 페이지 자동 서빙 (CI/CD)
    Dev->>Hub: git push origin master 실행
    activate Hub
    Hub->>Act: master 브랜치 푸시 감지 ➡️ deploy.yml 워크플로우 트리거
    deactivate Hub
    activate Act
    Act->>Act: 1. Node.js 20 캐싱 및 환경 셋업
    Act->>Act: 2. tsc 컴파일 & Vite 빌드 (dist/ 에셋 생성)
    Act->>Hub: 3. dist/ 내부 산출물만 gh-pages 브랜치에 강제 덮어쓰기 push
    deactivate Act
    activate Pages
    Pages->>Pages: CDN 캐시 갱신 및 상대경로 ('./') 호스팅 배포 개시
    Pages-->>Dev: 실시간 공개 URL 접속 지원 (utlim.github.io/GeminiCLIPorject/)
    deactivate Pages
```


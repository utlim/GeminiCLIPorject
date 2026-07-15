# [이슈 등록용] YES24 vs 교보문고 컴퓨터/IT 베스트셀러 웹 대시보드 구축 구현 계획

> **GitHub Issue 작성 가이드**: 본 마크다운 본문 전체를 복사하여 깃허브 새 이슈 생성 페이지(New Issue) 본문에 붙여넣으면 체크박스 및 레이아웃이 깔끔하게 렌더링됩니다.

---

## 1. 개요 (Overview)
본 이슈는 YES24 및 교보문고의 컴퓨터/IT 분야 베스트셀러 도서 데이터를 크로스 플랫폼 관점에서 심층 비교 및 실시간 필터링할 수 있는 **반응형 모던 웹 대시보드**를 개발하는 작업을 정의합니다. 분석 결과로 도출된 가격대 분포, 메이저 출판사 독과점, 평점 인플레이션, AI/수험서 최신 트렌드를 대화형 차트(Chart.js)와 입체적 레이아웃으로 구현합니다.

---

## 2. 기술 스택 (Tech Stack)
* **Framework**: React (Vite 기반, TypeScript 탑재)
* **Styling**: Tailwind CSS (반응형 벤토 그리드 및 3대 테마 마감)
* **Visualization**: Chart.js (via `react-chartjs-2`)
* **Pipeline**: Python (CSV의 정규화 및 JSON 파일 정적 번들 빌드 변환)

---

## 3. 핵심 구현 작업 목록 (GitHub Tasks)

### 🚀 Epic 1. 데이터 파이프라인 및 정적 변환
- [ ] 파이썬 데이터 전처리 스크립트 작성 (`kyobobooks/src/convert_data.py`)
- [ ] YES24/교보문고 CSV 로드 및 가격/날짜 데이터 타입 통일 (정수형 전처리)
- [ ] 정제된 데이터의 정적 JSON 포맷 변환 및 프론트엔드(`src/assets/data/`) 연동 자동화

### 🎨 Epic 2. UI/UX 레이아웃 및 3대 전역 테마 스위처 구축
- [ ] Vite React + TypeScript 초기화 및 Tailwind CSS 환경 셋업
- [ ] CSS 변수(`var(--color-bg)`) 기반의 전역 테마 컨텍스트(`ThemeContext`) 설계
- [ ] 3대 UI 테마 스타일 가이드 구현 및 실시간 전환 토글 헤더 탑재
  - [ ] **Sleek Dark Bento Theme**: 다크 모드 입체적 카드 구조
  - [ ] **Glassmorphism Theme**: 반투명 프로스트 글래스 효과 라이트/다크
  - [ ] **Neon Cyberpunk Theme**: 형광 아웃라인 글로우 효과의 사이버펑크 뷰

### 📊 Epic 3. Chart.js 기반 5대 시각화 콤보 컴포넌트 구현
- [ ] 테마 상태 변경 시 폰트/그리드 색상이 동적으로 변화하는 Chart.js 공통 옵션 바인더 구축
- [ ] **차트 1. 가격대 분포 비교**: 두 서점의 가격대 다중 시리즈 막대/꺾은선 차트
- [ ] **차트 2. 출판사 점유율/평점**: 메이저 출판사 등재 도서 수 가로 막대 및 Radar 차트
- [ ] **차트 3. 평점대 만족도 분석**: 평점 좌측 쏠림을 시각화하는 Polar Area 및 Doughnut 차트
- [ ] **차트 4. 순위별 성과 비교**: 순위 구간에 따른 리뷰 수 및 판매지수 관계 Combo 차트
- [ ] **차트 5. TF-IDF 핵심 키워드**: 가중치 가로 막대 비교 차트

### ⚡ Epic 4. 6대 인터랙티브 필터 및 크로스 매핑 엔진 개발
- [ ] 인메모리(Client-side) 통합 검색 및 다중 정렬 기능 (순위, 가격, 평점, 리뷰 수 기준)
- [ ] **1:1 도서 매칭 비교 카드 (Cross-platform Map)**: 
  - [ ] 도서명 불필요 특수문자 정규화 및 Fuzzy Match 매칭 알고리즘 구현
  - [ ] 도서 클릭 시 양쪽 서점의 순위, 가격 차이, 리뷰 현황을 나란히 오버랩 비교하는 슬라이딩 뷰
- [ ] 양방향 레인지 슬라이더(Double Range Slider) 기반의 가격대 필터
- [ ] 주요 출판사 및 할인율 다중 선택(Multi-select Checkbox) 드롭다운 필터
- [ ] 상단 실시간 메가 트렌드 태그 클릭 필터 디스패치
- [ ] 필터링된 결과값에 따른 하단 요약 통계 테이블 실시간 재계산 로직

### 🛠️ Epic 5. 웹앱 최적화 및 최종 마감
- [ ] 데이터 검색/필터 복합 연산 지연 방지를 위한 `useMemo` 캐싱 최적화
- [ ] Framer Motion을 활용한 벤토 그리드 카드의 마이크로 인터랙션 및 애니메이션 보완
- [ ] 모바일/태블릿/데스크탑 환경을 완벽 지원하는 반응형 벤토 레이아웃 점검
- [ ] 로컬 빌드 및 웹 크로스브라우징 기능 검증

---

## 4. 핵심 기술 설계 명세

### 4.1 도서 1:1 매칭 정규화 알고리즘
두 서점의 도서명이 미세하게 다를 경우(예: 개정년도 유무, 출판사 괄호 표기 등)를 보완하기 위해 다음과 같은 문자열 전처리를 적용한 후 매칭을 시도합니다.
```typescript
function normalizeBookTitle(title: string): string {
  return title
    .replace(/\[.*?\]|\(.*?\)/g, '') // 대괄호, 소괄호 내부 주석 제거
    .replace(/\s+/g, '')             // 모든 공백 제거
    .replace(/[.,·\/#!$%\^&\*;:{}=\-_`~()]/g, '') // 특수문자 제거
    .toLowerCase();                  // 영어의 경우 소문자화
}
```

### 4.2 테마 연동 Chart.js 전역 반응성 처리
테마 변경에 따라 Chart.js 캔버스가 새로 렌더링되거나 차트 전역 Config 속성이 실시간 갱신되도록 리액트 라이프사이클과 동기화합니다.
- `ThemeContext`에서 제공하는 active theme 클래스가 변할 때, Chart.js의 그리드 선 색상(`grid.color`) 및 라벨 색상(`ticks.color`)을 dynamic theme color 매개변수로 업데이트하여 `chart.update()`를 호출합니다.

---

## 5. 작업 일정 및 마일스톤 (Milestone)
- **1주차**: Epic 1 (데이터 JSON 파이프라인 완료) & Epic 2 (Vite React + Tailwind CSS 테마 구성 완료)
- **2주차**: Epic 3 (Chart.js 5종 차트 컴포넌트 통합 완료)
- **3주차**: Epic 4 (인터랙션 및 1:1 도서 매칭 알고리즘 구현 완료)
- **4주차**: Epic 5 (성능 튜닝, Framer Motion 애니메이션 마감 및 배포 검증 완료)

---
name: marp-slide
description: "Use this skill whenever the user wants to create a presentation, slide deck, pitch deck, or presentation notes using Marp Markdown. Trigger especially when the user mentions 'Marp', 'Marp slide', 'presentation markdown', 'slide deck', or '발표 자료'. Make sure to use this skill whenever generating presentation materials, even if the user does not explicitly name 'Marp', as it provides the gold standard for Markdown-based slideshows."
---

# Marp 마크다운 슬라이드 작성 지침 (프로젝트 로컬 워크플로우 전용)

이 스킬은 마크다운 문서를 기반으로 고품질의 발표용 Marp 슬라이드(대본 및 간지 포함)를 제작하기 위한 지침과 템플릿을 제공합니다. 이 프로젝트 내의 모든 발표용 슬라이드는 본 규격을 엄격하게 따릅니다.

---

## 1. Marp 기본 설정 및 디자인 테마

Marp 슬라이드를 작성할 때 항상 다음 최상단 YAML 프론트매터 및 CSS 정의 블록을 기본 구조로 사용하십시오.

```markdown
---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #1A365D
color: #FFFFFF
style: |
  section {
    font-family: 'Arial', 'NanumGothic', sans-serif;
    padding: 40px;
  }
  h1 {
    color: #FBD38D;
  }
  h2 {
    color: #90CDF4;
    border-bottom: 2px solid #90CDF4;
  }
  footer {
    font-size: 0.5em;
    color: #CBD5E0;
  }
  code {
    background-color: #2D3748;
    color: #FEEBC8;
  }
  table {
    font-size: 0.65em;
    border-collapse: collapse;
    width: 100%;
  }
  th {
    background-color: #2B6CB0;
    color: #FFFFFF;
  }
  td, th {
    border: 1px solid #CBD5E0;
    padding: 6px;
  }
---
```

### 디자인 세부 사항:
- **폰트**: 고딕 계열(Arial, NanumGothic 등)을 사용해 텍스트가 깨지거나 자간이 흐트러지는 현상을 차단하십시오.
- **표 스타일**: 데이터의 폰트를 `0.65em`으로 축소하여 텍스트 오버플로우를 막고, 헤더는 짙은 파란색(`#2B6CB0`)으로 칠해 전문성을 부여하십시오.

---

## 2. 슬라이드 구조 및 기승전결 (간지 구성)

슬라이드 덱은 일반적으로 **30~35페이지 내외**의 분량으로 기승전결이 유지되도록 설계하십시오. 발표 흐름이 루즈해지지 않도록 각 부(Part)의 경계마다 **네이비 계열의 간지 슬라이드(Divider Slide)**를 삽입하여 환기시켜야 합니다.

### 슬라이드 배치 순서:
1. **타이틀 슬라이드**: 딥네이비 배경, 큰 폰트, 발표자 및 일자 명시.
2. **목차 슬라이드**: 전체 아웃라인 구성 나열.
3. **[간지 1] 1부. 데이터셋 요약 및 정합성 검증**
4. **1부 본문**: 데이터 무결성 검증, 결측치 대체, 데이터 샘플 표.
5. **[간지 2] 2부. 요약 기술 통계 및 분석 인사이트**
6. **2부 본문**: 수치형/범주형 통계표 기재 및 요약 통계의 상세 비즈니스 가치 해석.
7. **[간지 3] 3부. 다차원 시각화 분석 결과**
8. **3부 본문**: 각 개별 차트의 상세 시각화 및 수치 근거 표, 분석 의견.
9. **[간지 4] 4부. 텍스트 분석 및 자연어 처리 프로토콜**
10. **4부 본문**: 특수문자 정제 규칙, 조사 제거 정규식, TF-IDF 핵심 키워드 도출 과정.
11. **[간지 5] 5부. 품질 검증(QA) 자가 진단 및 결론**
12. **5부 본문**: 품질 검사 통과 여부 및 비즈니스 액션 아이템 제언.
13. **피날레 슬라이드**: 감사 인사 및 관련 산출물 경로 제시.

---

## 3. 개별 슬라이드 레이아웃 및 근거 요약표 병제

- **이미지 배치**: 슬라이드 내에 시각화 차트를 포함할 때는 Marp의 배경 이미지 문법 `![bg right:45% width:90%](이미지경로)`을 사용하여 슬라이드 오른쪽에 배치하고, 왼쪽 영역에는 텍스트 요약을 정렬하십시오.
- **수치 요약표 병제**: 시각화 결과를 논하는 장표에는 단순 분석 해석만 나열하지 말고, **통계적 수치 근거 요약표(Markdown Table)를 반드시 슬라이드 내에 병행 출력**하여 발표의 정확성을 담보하십시오.
- **비즈니스 제언(Action Item)**: 현상 기술(e.g., "A가 높다")을 지양하고, 실제 마케터나 의사결정권자가 적용할 수 있는 구체적인 권장 전술을 **250자 이상** 상세히 기입하십시오.

---

## 4. 2분 분량의 발표자 노트 (Presenter Notes) 작성 지침

**각 슬라이드가 끝나는 지점마다 반드시 `<!--` 와 `-->` 주석 문법을 활용해 발표자 노트를 한글로 작성하십시오.**

### 스피치 가이드라인:
- **분량**: 각 슬라이드별로 **한글 기준 공백 제외 800자 ~ 1,000자 내외 (스피치 기준 2분 분량)**의 풀-스크립트(Full Script) 대본으로 채워 넣으십시오.
- **구성 요소**:
  1. 청중에게 말을 건네는 정중한 경어체 구어체 도입부 ("안녕하십니까. 이번 슬라이드에서는...")
  2. 슬라이드 내 수치 정보와 차트의 변화 추이에 대한 정량적이고 상세한 낭독 분석.
  3. 이 데이터 지표가 비즈니스 마케팅 및 전략 기획 단계에 제공하는 현실적인 실천안 결론 연계.
- 단순히 한두 줄의 개요 수준으로 작성하는 행위는 절대 엄금하며, 발표자가 슬라이드 모니터만 보고도 끊김 없이 2분간 말할 수 있도록 완결성 있는 스크립트로 구성하십시오.

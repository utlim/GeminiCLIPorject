# YES24 베스트셀러 데이터 탐색적 데이터 분석 (EDA) 계획

YES24에서 수집된 1,000개의 IT/컴퓨터 분야 베스트셀러 도서 데이터를 탐색적으로 분석하여 데이터의 전반적인 특성을 이해하고 통계적 인사이트 및 시각화 자료를 구축합니다.

## User Review Required

> [!NOTE]
> * 데이터 분석 및 시각화 시 **데이터 분석 프로토콜(Data Analysis Protocol)**을 준수합니다.
>   * `seaborn` 스타일 설정을 사용하지 않습니다.
>   * `matplotlib` 기반 시각화 시 한글 폰트 깨짐 방지를 위해 `koreanize-matplotlib`를 사용하여 처리합니다.
> * 시각화 파일은 `yes24/images/` 폴더에 저장하며, 분석 코드는 `yes24/src/eda.py`에 작성합니다.
> * 최종 분석 보고서는 `yes24/docs/eda_report.md` 파일로 저장합니다.

## Proposed Changes

### EDA 실행 및 보고서 작성 컴포넌트

#### [NEW] [eda.py](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/src/eda.py)
데이터 로드, 요약 통계량 계산, 시각화 이미지 생성을 수행하는 파이썬 스크립트입니다.
- **주요 기능**:
  - `pandas`를 이용한 결측치 확인 및 통계치 정보 도출
  - `matplotlib` 및 `koreanize-matplotlib`를 이용한 시각화 그래프 작성
  - 생성 그래프 목록 (`yes24/images/`에 저장):
    1. `price_distribution.png`: 도서 정가 및 판매가 분포 (히스토그램)
    2. `rating_review_distribution.png`: 도서 평점 분포 및 리뷰 개수 분포 (히스토그램 및 박스플롯)
    3. `correlation_analysis.png`: 판매지수와 가격/평점/리뷰수 간 상관관계 (산점도)
    4. `top_publishers.png`: 가장 많은 베스트셀러를 올린 출판사 Top 10 (막대 그래프)
    5. `top_authors.png`: 가장 많은 베스트셀러를 집필한 저자 Top 10 (막대 그래프)

#### [NEW] [eda_report.md](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/docs/eda_report.md)
수집된 데이터에 대한 탐색적 분석의 통계 요약 및 통계적 인사이트, 생성된 시각화 이미지를 임베딩하여 정리한 한국어 보고서 파일입니다.

## Verification Plan

### Automated Tests
- 아래 명령을 실행하여 오류 없이 데이터 가공, 이미지 생성 및 마크다운 파일 작성이 완료되는지 확인합니다:
  ```bash
  .venv/bin/python yes24/src/eda.py
  ```

### Manual Verification
- [yes24/images/](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/images) 폴더 내 시각화 파일 5종 확인
- [yes24/docs/eda_report.md](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/docs/eda_report.md) 내 마크다운 링크 및 내용이 올바르게 출력되는지 확인

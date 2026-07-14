# YES24 컴퓨터/IT 베스트셀러 데이터 수집기 안내서

본 문서는 `yes24/src/scraper.py` 스크립트를 사용하여 YES24 컴퓨터/IT 베스트셀러 도서 데이터를 안전하고 깨끗하게 수집하는 방법에 대해 안내합니다.

---

## 1. 개요 및 목적
YES24 베스트셀러 Contents API를 통해 컴퓨터/IT 분야의 전체 베스트셀러 정보를 수집하여 데이터 분석 및 시각화용 원천 데이터([bestsellers.csv](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/data/bestsellers.csv))를 구축하는 것을 목적으로 합니다.

## 2. 주요 기능 및 아키텍처
* **자동 다중 페이지 수집**: 1페이지부터 마지막 페이지(더 이상 데이터가 반환되지 않는 페이지)까지 자동으로 페이지를 순회하며 데이터를 수집합니다.
* **차단 방지 및 서버 보호**: 요청 간에 `0.1초`에서 `0.5초` 사이의 랜덤한 대기 시간(`time.sleep`)을 적용하여 크롤링 차단 가능성을 방지합니다.
* **데이터 정화 (Clean Data)**: 수집된 텍스트 필드(도서명, 부제, 저자 등) 내부의 라인피드(`\n`, `\r`) 및 탭(`\t`)과 같은 모든 개행 문자를 공백으로 병합 처리하여 CSV 구조가 깨지는 현상을 방지합니다.
* **인코딩 최적화**: 엑셀(MS Excel) 프로그램에서 한글 깨짐 없이 바로 열어볼 수 있도록 `UTF-8-BOM` (`utf-8-sig`) 인코딩 형식으로 저장합니다.

## 3. 설치 및 의존성
가상환경(`uv` 환경)을 활성화한 후, 아래의 라이브러리를 설치해야 합니다.
```bash
uv pip install requests beautifulsoup4 pandas
```

## 4. 수집되는 데이터 스키마
저장된 CSV 파일([bestsellers.csv](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/data/bestsellers.csv))은 아래와 같은 컬럼 구조를 갖습니다.

| 컬럼명 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| `goods_no` | string | YES24 도서 고유 번호 |
| `rank` | integer | 베스트셀러 순위 |
| `title` | string | 도서명 (개행 정화 완료) |
| `subtitle` | string | 부제 또는 책 소개 요약 |
| `author` | string | 저자 정보 (공저 포함 한 줄 처리 완료) |
| `publisher` | string | 출판사명 |
| `publish_date` | string | 출간일 정보 (예: 2025년 12월) |
| `discount_rate` | string | 할인율 (예: 10%) |
| `sale_price` | integer | YES24 판매가 (원 단위) |
| `original_price`| integer | 정가 (원 단위) |
| `point` | string | 포인트 적립 정보 |
| `sale_index` | integer | YES24 판매지수 |
| `review_count` | integer | 회원 리뷰 등록 수 |
| `rating` | float | 리뷰 평점 (10.0 만점) |

## 5. 실행 방법
프로젝트 루트 디렉터리에서 가상환경의 파이썬을 활용해 스크립트를 실행합니다.

```bash
.venv/bin/python yes24/src/scraper.py
```

실행이 완료되면 자동으로 [yes24/data/bestsellers.csv](file:///Users/utaekim/aiProject/GeminiCLIPorject/yes24/data/bestsellers.csv) 경로에 정형화된 데이터 파일이 생성 또는 덮어쓰기 방식으로 저장됩니다.

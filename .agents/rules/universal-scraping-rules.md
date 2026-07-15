# 🕸️ 범용 데이터 수집 프로토콜 (Universal Scraping Rules)

본 룰셋은 신규 대상 사이트로부터 데이터를 안정적이고 안전하게 수집하기 위한 크롤링 표준 동작 수칙입니다.

---

## 1. 수집 전 정찰 단계 (Scraping Reconnaissance)
크롤러를 먼저 작성하기 전, 반드시 다음 4단계 정찰을 거치고 결과를 기록합니다.
1. **렌더링 방식 확인**: SPA(React/Vue 등 동적)인지 SSR/정적 HTML 구조인지 파악합니다.
2. **보안 및 APIgw 통신 분석**: 브라우저 네트워크 탭을 켜고 데이터 렌더링 시 내부적으로 Fetch하는 REST API endpoint와 dynamic key(`x-api-gw-key` 등)가 요구되는지 검사합니다.
3. **Robots.txt 검토**: 대상 도메인의 robots.txt에 명시된 수집 배제 경로를 확인합니다.
4. **IP 차단 정책 대비**: 과도한 호출로 인한 차단을 피하기 위해 각 요청 사이에 최소 `1.0초 ~ 3.0초` 범위의 무작위 지연(random sleep)을 삽입합니다.

---

## 2. 크롤링 아키텍처 선택 기준 (Dual Architecture)
대상 사이트의 기술 특성에 따라 크롤러 구현체를 이원화합니다.

### A. 동적 API 스니핑 & 브라우저 자동화 (Playwright)
* **적용 대상**: SPA, 난독화된 API 키 동적 생성 사이트, Cloudflare 방화벽 우회 필요 사이트.
* **수행 방식**: Playwright Headless 브라우저를 구동하여 네트워크 통신(`page.on("request")` 또는 `page.on("response")`)을 모니터링하여 토큰과 API 응답 데이터를 동적으로 가로챕니다.

### B. 정적 HTML 및 API 직접 호출 (Requests & BeautifulSoup)
* **적용 대상**: SSR 구조의 정적 페이지, 헤더에 특수 토큰을 요구하지 않는 일반 공개 REST API.
* **수행 방식**: 파이썬 `requests` 모듈과 User-Agent 헤더 세팅을 통해 빠르고 가볍게 데이터를 직접 조회합니다.

---

## 3. 예외 처리 및 무결성 검증
* **네트워크 재시도**: 일시적인 타임아웃에 대비해 `tenacity` 등의 모듈을 활용하여 최소 3회 이상의 지연 후 재시도(Backoff retry) 메커니즘을 탑재합니다.
* **데이터 정규화**: 수집 직후 특수문자, 날짜 포맷, 가격 콤마(,) 및 통화 기호 등을 정밀 가공하여 정수(int) 또는 실수(float) 등의 표준 데이터 형식으로 가공하여 CSV/JSON 파일로 직렬화합니다.

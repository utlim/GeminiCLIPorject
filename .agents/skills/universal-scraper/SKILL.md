# 🛠️ 범용 데이터 수집 스킬 가이드 (Universal Scraper Skill)

본 스킬은 에이전트가 새로운 도메인 및 타겟 사이트에서 원하는 데이터를 동적/정적 방식으로 유연하게 스니핑하고 수집할 수 있도록 상세 개발 템플릿과 실행 지침을 제공합니다.

---

## 1. Playwright 동적 네트워크 API 가로채기 템플릿
웹사이트가 dynamic key나 복잡한 난독화 스크립트를 사용하여 직접 REST API 호출이 불가능할 경우, Playwright 브라우저를 띄워 실제 렌더링 시 발생하는 네트워크 응답(response)을 가로챕니다.

### 🐍 파이썬 스니핑 예제 코드
```python
"""
프로젝트명: 범용 네트워크 응답 스니퍼
파일 역할: 브라우저가 타겟 주소를 로드하는 동안 API 게이트웨이의 JSON 응답을 감청하여 파일로 저장합니다.
"""
import json
import time
from playwright.sync_api import sync_playwright

def sniffNetworkApi(target_url: str, api_keyword: str, output_path: str) -> None:
    """
    브라우저의 네트워크 트래픽을 가로채 특정 키워드가 포함된 API 응답을 저장합니다.
    """
    captured_data = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 네트워크 응답 리스너 정의
        def handleResponse(response):
            if api_keyword in response.url:
                try:
                    # JSON 응답 본문을 직접 파싱 및 추출
                    data = response.json()
                    captured_data.append(data)
                    print(f"[스니핑 성공] API URL: {response.url[:80]}...")
                except Exception as e:
                    # 응답이 JSON이 아닌 경우 예외 처리
                    pass

        page.on("response", handleResponse)
        
        # 페이지 로딩 개시
        page.goto(target_url, wait_until="networkidle", timeout=30000)
        time.sleep(3) # 추가 렌더링 대기
        
        browser.close()

    # 가로챈 데이터 직렬화 저장
    if captured_data:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(captured_data, f, ensure_ascii=False, indent=2)
        print(f"가로챈 데이터 {len(captured_data)}건을 파일에 저장 완료: {output_path}")
```

---

## 2. requests & BeautifulSoup 정적 가속 크롤링 템플릿
웹서버가 단순 정적 HTML을 서빙하거나 일반 GET API를 개방하고 있을 경우 가볍게 가속 수집합니다.

### 🐍 파이썬 정적 가속 예제 코드
```python
"""
프로젝트명: requests 기반 정적 데이터 크롤러
파일 역할: HTTP GET 요청과 파싱 파이프라인을 구동하여 데이터를 구조화합니다.
"""
import requests
from bs4 import BeautifulSoup
import pandas as pd

def fetchStaticData(url: str) -> list:
    """
    정적 페이지를 파싱하여 구조화된 딕셔너리 리스트를 반환합니다.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    }
    
    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"HTTP GET 실패 (코드: {response.status_code})")
        return []
        
    soup = BeautifulSoup(response.text, "html.parser")
    items = []
    
    # 예시: 특정 아이템 리스트 파싱 루프
    for el in soup.select(".item-row-class"):
        items.append({
            "title": el.select_one(".title-class").text.strip(),
            "author": el.select_one(".author-class").text.strip(),
            "price": int(el.select_one(".price-class").text.replace(",", "").replace("원", "").strip())
        })
        
    return items
```

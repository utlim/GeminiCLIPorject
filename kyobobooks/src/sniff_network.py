"""
프로젝트명: 교보문고 상품 목록 API 감시 스크립트
파일 역할: 분야별 상품 목록 페이지(베스트셀러 탭 포함)에서 호출되는 도서 목록 조회 API(Pagination 지원) 엔드포인트와 헤더를 캡처합니다.
작성자: Antigravity AI
생성일: 2026-07-14
"""

from playwright.sync_api import sync_playwright
import time

def sniffGoodsList() -> None:
    """
    교보문고 컴퓨터/IT 카테고리의 베스트셀러 목록 페이지로 접속하여, 도서 리스트를 가져오는 API를 감시합니다.
    """
    # 33: 컴퓨터/IT 국내도서 베스트셀러 탭 URL
    url = "https://store.kyobobook.co.kr/category/domestic/33/best"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
        )
        
        def handleResponse(response) -> None:
            resp_url = response.url
            # 내부 게이트웨이 호출 중 데이터 목록을 가져올 법한 API 필터링
            # URL에 'goods'나 'list'나 'product'나 'bestseller' 등이 들어가고 json을 반환하는 것 타겟
            if "api/gw" in resp_url and response.status == 200:
                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        data = response.json()
                        # 데이터 내부에 도서 리스트가 들어있는지 감지
                        has_books = False
                        key_sample = list(data.get("data", {}).keys()) if isinstance(data.get("data"), dict) else []
                        
                        # 응답 데이터에 상품 배열이 들어있는지 체크
                        data_payload = data.get("data", {})
                        if isinstance(data_payload, dict):
                            # 일반적인 상품 목록 API의 리스트 키 명칭들 검출
                            for k in ["resultList", "goodsList", "contentsList", "productList", "items", "list"]:
                                if k in data_payload and isinstance(data_payload[k], list):
                                    has_books = True
                                    print(f"\n[★ 상품 목록 API 검출: {resp_url}]")
                                    print(f" - 검출된 키: data.{k} (크기: {len(data_payload[k])}개)")
                                    if data_payload[k]:
                                        print(f" - 첫 상품명: {data_payload[k][0].get('cmdtName') or data_payload[k][0].get('goodsName') or '이름 없음'}")
                                        
                        if not has_books:
                            # 일반적인 API 로깅
                            print(f"[일반 API] URL: {resp_url} | 키 목록: {key_sample}")
                    except Exception:
                        pass
                    
        page.on("response", handleResponse)
        
        print(f"교보문고 카테고리 베스트셀러 페이지({url}) 접속 중...")
        try:
            page.goto(url, wait_until="networkidle")
        except Exception as e:
            print(f"접속 에러(무시): {e}")
            
        print("네트워크 데이터 수집 대기 (10초)...")
        time.sleep(10)
        
        browser.close()

if __name__ == "__main__":
    sniffGoodsList()

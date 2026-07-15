"""
프로젝트명: 교보문고 컴퓨터/IT 베스트셀러 다중 페이지 수집기 (Scraper)
파일 역할: Playwright를 통한 실시간 API 게이트웨이 키 획득 및 requests 기반의 다중 페이지(1~5페이지, 총 100위) 순회 호출을 수행하는 하이브리드 스크래퍼입니다.
주요 기능:
  - Playwright를 사용해 카테고리 베스트셀러 탭을 로딩하고 x-api-gw-key 라이센스 키 스니핑
  - v2/best-seller/online API를 1페이지부터 5페이지까지 순회 호출하여 100위까지 수집
  - 변동된 API JSON 스키마(product 하위 구조)에 맞춘 정교한 데이터 파싱 및 매핑
  - 수집 데이터를 utf-8-sig 인코딩의 CSV 파일로 저장
작성자: Antigravity AI
생성일: 2026-07-14
"""

import os
import time
import random
import requests
import pandas as pd
from typing import List, Dict, Any, Optional
from playwright.sync_api import sync_playwright

# 백업용 하드코딩된 API 키 (스니핑 실패 시 활용)
DEFAULT_API_KEY = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..PmJ4IuZHtl44pDK4.bnr7taDiwIvAD-zX0xE7ZHeGVj-h-XqHwUQesrxl_j2xkdeuWrjN_LIHOcXED91IiSEy4Rozn0gBytqsaxt2S9PpvJRLpNIYXlaAgkw6tY4p1jrDICpRpSoOVsHpruU9kjBg4dhM.VZz9OwhOoYUZzNbqmws0rA"

def sniffApiKey() -> str:
    """
    Playwright를 사용해 교보문고 컴퓨터/IT 분야 베스트셀러 페이지를 띄우고,
    x-api-gw-key 게이트웨이 라이센스 키를 가로채어 반환합니다.

    Returns:
        str: 획득한 API 게이트웨이 라이센스 키
    """
    url = "https://store.kyobobook.co.kr/category/domestic/33/best"
    api_key = ""
    
    print("API 라이센스 키를 실시간으로 가로채기 위해 Playwright 브라우저를 백그라운드에서 구동합니다...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
            )
            
            # 응답 가로채기 핸들러 등록
            def handleResponse(response) -> None:
                nonlocal api_key
                # v2/best-seller/online API 혹은 corner/contents API 요청에서 키 추출
                if "best-seller/online" in response.url or "corner/contents" in response.url:
                    headers = response.request.headers
                    if "x-api-gw-key" in headers:
                        api_key = headers["x-api-gw-key"]
            
            page.on("response", handleResponse)
            
            # 페이지로 이동 후 네트워크가 유휴 상태가 될 때까지 대기
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            time.sleep(2)
            browser.close()
            
            if api_key:
                print(f"성공적으로 실시간 x-api-gw-key 획득! (길이: {len(api_key)})")
                
    except Exception as e:
        print(f"Playwright API 키 스니핑 중 오류 발생: {e}")
        
    if not api_key:
        print("실시간 키 획득에 실패하여 하드코딩된 백업 API 키를 사용합니다.")
        return DEFAULT_API_KEY
        
    return api_key

def fetchBestsellersPage(apiKey: str, pageNumber: int = 1) -> Optional[Dict[str, Any]]:
    """
    특정 페이지의 온라인 베스트셀러 목록 API를 호출합니다.

    Args:
        apiKey (str): API 게이트웨이 라이센스 키
        pageNumber (int): 수집할 페이지 번호 (기본값: 1)

    Returns:
        Optional[Dict[str, Any]]: 성공 시 API 응답 JSON 딕셔너리, 실패 시 None
    """
    url = "https://store.kyobobook.co.kr/api/gw/best/v2/best-seller/online"
    
    # 카테고리 33(컴퓨터/IT)의 주간 베스트셀러 데이터 20개 요청 파라미터
    params = {
        "page": pageNumber,
        "per": 20,
        "saleCmdtClstCode": "33",      # 컴퓨터/IT
        "soldOutExcludeYn": "N",
        "saleCmdtDsplDvsnCode": "KOR",  # 국내도서
        "period": "002",                # 주간
        "dsplDvsnCode": "001",
        "dsplTrgtDvsnCode": "004"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://store.kyobobook.co.kr",
        "Referer": "https://store.kyobobook.co.kr/category/domestic/33/best",
        "x-api-gw-key": apiKey
    }
    
    try:
        # 차단 방지 및 서버 부하 경감을 위한 무작위 대기 (0.1 ~ 0.5초)
        sleep_time = random.uniform(0.1, 0.5)
        time.sleep(sleep_time)
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"API 요청 실패. page={pageNumber}, 상태 코드: {response.status_code}")
            return None
    except Exception as e:
        print(f"API HTTP 요청 중 오류 발생: {e}")
        return None

def parseBooks(jsonData: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    v2/best-seller/online API 응답 JSON에서 도서 정보를 파싱하여
    YES24 호환 스키마로 매핑합니다.

    Args:
        jsonData (Optional[Dict[str, Any]]): API 응답 JSON 데이터

    Returns:
        List[Dict[str, Any]]: 파싱 및 변환된 도서 정보 딕셔너리 리스트
    """
    book_list = []
    
    if not jsonData:
        return book_list
        
    try:
        data_obj = jsonData.get("data", {})
        items = data_obj.get("bestSeller", [])
        
        for item in items:
            product = item.get("product", {})
            prod_info = product.get("productInfo", {})
            price_info = product.get("priceInfo", {})
            review_info = product.get("reviewInfo", {})
            
            # 1. 도서 번호 (상품 고유 ID)
            goods_no = prod_info.get("saleCmdtid", "")
            if not goods_no:
                continue
                
            # 2. 순위
            rank = item.get("prstRnkn", 0)
            
            # 3. 도서명 및 부제목
            title = prod_info.get("cmdtName", "").strip()
            title = " ".join(title.split())  # 개행 문자 및 유해 공백 정화
            
            subtitle = prod_info.get("sbttName1", "") or prod_info.get("sbttName2", "") or ""
            subtitle = " ".join(subtitle.split())
            
            # 4. 저자 및 출판사
            author = prod_info.get("chrcName", "").strip()
            publisher = prod_info.get("pbcmName", "").strip()
            
            # 5. 출판일 (YYYYMMDD 형식을 YYYY-MM-DD로 변환)
            raw_date = prod_info.get("rlseDate", "")
            publish_date = ""
            if len(raw_date) == 8:
                publish_date = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:]}"
            else:
                publish_date = raw_date
                
            # 6. 가격 정보
            discount_val = price_info.get("saleCmdtPrceDscnRate", 0.0)
            # 정수로 떨어지면 소수점 제거
            if isinstance(discount_val, float) and discount_val.is_integer():
                discount_val = int(discount_val)
            discount_rate = f"{discount_val}%"
            
            sale_price = price_info.get("saleCmdtSapr", 0)
            original_price = price_info.get("saleCmdtPrce", 0)
            
            # 7. 포인트 적립액
            point_val = price_info.get("upntAcmlAmnt", 0)
            point = f"{point_val}원"
            
            # 8. 리뷰 및 평점 정보
            review_count = review_info.get("count", 0)
            rating = review_info.get("score", 0.0)
            
            # 9. 판매지수 (판매적중도)
            # v2/best-seller/online API 구조에서는 slesPlac가 제공되지 않는 경우가 있으므로 기본값 0 처리
            sale_index = item.get("slesPlac", 0) or prod_info.get("slesPlac", 0)
            
            book_info = {
                "goods_no": goods_no,
                "rank": rank,
                "title": title,
                "subtitle": subtitle,
                "author": author,
                "publisher": publisher,
                "publish_date": publish_date,
                "discount_rate": discount_rate,
                "sale_price": int(sale_price) if sale_price else 0,
                "original_price": int(original_price) if original_price else 0,
                "point": point,
                "sale_index": int(sale_index) if sale_index else 0,
                "review_count": int(review_count) if review_count else 0,
                "rating": float(rating) if rating else 0.0
            }
            
            book_list.append(book_info)
            
    except Exception as e:
        print(f"API JSON 데이터 파싱 중 오류 발생: {e}")
        
    return book_list

def saveToCsv(bookList: List[Dict[str, Any]], filePath: str) -> bool:
    """
    수집된 교보문고 도서 목록을 CSV 파일로 저장합니다.

    Args:
        bookList (List[Dict[str, Any]]): 저장할 도서 목록
        filePath (str): CSV 저장 경로

    Returns:
        bool: 저장 성공 여부
    """
    try:
        if not bookList:
            print("저장할 도서 정보가 없습니다.")
            return False
            
        df = pd.DataFrame(bookList)
        os.makedirs(os.path.dirname(filePath), exist_ok=True)
        
        # 한글 깨짐 방지를 위해 utf-8-sig 인코딩 사용
        df.to_csv(filePath, mode='w', index=False, header=True, encoding='utf-8-sig')
        print(f"성공적으로 데이터를 저장했습니다. 경로: {filePath}")
        return True
    except Exception as e:
        print(f"CSV 저장 중 오류 발생: {e}")
        return False

def main() -> None:
    """
    메인 제어 함수입니다.
    100위까지 데이터를 수집하기 위해 1페이지부터 5페이지까지 순회 호출합니다.
    """
    csv_path = "kyobobooks/data/bestsellers.csv"
    
    print("=" * 60)
    print("교보문고 컴퓨터/IT 베스트셀러 다중 페이지 수집 파이프라인 가동")
    print("=" * 60)
    
    # 1. API Gateway 라이센스 키 획득
    api_key = sniffApiKey()
    
    # 2. 다중 페이지 순회 수집 (1 ~ 5페이지, 총 100개 도서)
    all_books = []
    total_pages = 5
    
    for page in range(1, total_pages + 1):
        print(f"[{page}/{total_pages} 페이지] 수집 중...")
        json_data = fetchBestsellersPage(api_key, pageNumber=page)
        
        if not json_data:
            print(f"[{page} 페이지] 응답이 없어 수집을 조기 종료합니다.")
            break
            
        page_books = parseBooks(json_data)
        if not page_books:
            print(f"[{page} 페이지] 도서 목록이 비어있어 수집을 조기 종료합니다.")
            break
            
        print(f"[{page} 페이지] {len(page_books)}개 도서 수집 완료")
        all_books.extend(page_books)
        
    # 3. 수집 결과 저장
    if all_books:
        success = saveToCsv(all_books, csv_path)
        if success:
            print(f"\n성공: 총 {len(all_books)}개의 컴퓨터/IT 베스트셀러 도서 정보를 수집 및 저장 완료했습니다.")
        else:
            print("\n실패: 도서 데이터 저장에 실패했습니다.")
    else:
        print("\n실패: 수집된 도서 데이터가 없습니다.")

if __name__ == "__main__":
    main()

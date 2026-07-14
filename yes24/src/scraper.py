"""
프로젝트명: YES24 컴퓨터/IT 베스트셀러 데이터 수집기 (Scraper)
파일 역할: YES24 베스트셀러 Contents API를 활용하여 컴퓨터/IT 분야의 모든 베스트셀러 도서 목록을 수집하고 CSV 파일로 저장합니다.
주요 기능:
  - YES24 베스트셀러 API HTTP GET 요청 수행
  - 수집 데이터 내 포함된 라인피드(\\n, \\r) 및 탭(\\t) 등의 모든 개행 문자를 제거하여 깔끔한 CSV 포맷 유지
  - BeautifulSoup을 사용한 HTML 파싱 및 도서 정보 추출
  - pandas를 활용한 CSV 파일 저장 및 덮어쓰기 기능
  - 페이지 간 0.1~0.5초 사이의 랜덤 딜레이 적용으로 차단 방지 및 서버 부하 경감
작성자: Antigravity AI
생성일: 2026-07-08
"""

import os
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
from typing import List, Dict, Any, Optional

def fetchBestsellerData(pageNumber: int = 1) -> Optional[str]:
    """
    YES24 베스트셀러 Contents API에 HTTP GET 요청을 보내고 HTML 응답 문자열을 반환합니다.

    Args:
        pageNumber (int): 수집할 페이지 번호 (기본값: 1)

    Returns:
        Optional[str]: 성공 시 HTML 응답 본문 문자열, 실패 시 None
    """
    url = "https://www.yes24.com/product/category/BestSellerContents"
    
    # HTTP 요청에 필요한 헤더 정보 설정
    headers = {
        "host": "www.yes24.com",
        "referer": f"https://www.yes24.com/product/category/bestseller?categoryNumber=001001003&pageNumber={pageNumber}&pageSize=24",
        "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest"
    }
    
    # GET 파라미터 정보 설정
    params = {
        "categoryNumber": "001001003",
        "sumGb": "06",
        "sex": "A",
        "age": "255",
        "goodsTp": "0",
        "addOptionTp": "0",
        "excludeTp": "2",
        "pageNumber": str(pageNumber),
        "pageSize": "24",
        "goodsStatGb": "06",
        "eBookTp": "0",
        "bestType": "YES24_BESTSELLER",
        "type": "",
        "saleYear": "0",
        "saleMonth": "0",
        "weekNo": "0",
        "saleDts": "",
        "viewMode": "",
        "freeYn": ""
    }
    
    try:
        # HTTP GET 요청 보내기
        response = requests.get(url, headers=headers, params=params)
        # HTTP 응답 상태가 200 OK인지 확인
        if response.status_code == 200:
            return response.text
        else:
            print(f"HTTP 요청 실패. 상태 코드: {response.status_code}")
            return None
    except Exception as e:
        print(f"HTTP 요청 중 오류 발생: {e}")
        return None

def parseHtml(htmlContent: Optional[str]) -> List[Dict[str, Any]]:
    """
    HTML 콘텐츠를 파싱하여 도서 정보 목록을 추출합니다.
    텍스트 추출 시, CSV 포맷이 깨지는 원인인 라인피드(\\n, \\r) 등의 문자를 제거하고 단일 공백으로 치환합니다.

    Args:
        htmlContent (Optional[str]): YES24 Contents API로부터 받은 HTML 본문 문자열

    Returns:
        List[Dict[str, Any]]: 파싱된 도서 정보 딕셔너리 리스트
    """
    bookList = []
    
    if not htmlContent:
        return bookList
        
    try:
        soup = BeautifulSoup(htmlContent, 'html.parser')
        # 각 도서 항목(li 태그)을 추출
        items = soup.find_all('li')
        
        for item in items:
            # data-goods-no 속성이 없는 경우 건너뜀 (도서 항목이 아님)
            if not item.has_attr('data-goods-no'):
                continue
                
            goodsNo = item.get('data-goods-no')
            
            # 1. 순위 추출
            rankEl = item.select_one('em.ico.rank')
            rank = rankEl.text.strip() if rankEl else ""
            
            # 2. 도서명 및 부제 추출
            nameEl = item.select_one('a.gd_name')
            title = " ".join(nameEl.text.split()) if nameEl else ""
            
            nameEEl = item.select_one('span.gd_nameE')
            subtitle = " ".join(nameEEl.text.split()) if nameEEl else ""
            
            # 3. 저자, 출판사, 출판일 추출
            authEl = item.select_one('span.authPub.info_auth')
            author = " ".join(authEl.text.replace(" 저", "").split()) if authEl else ""
            
            pubEl = item.select_one('span.authPub.info_pub')
            publisher = " ".join(pubEl.text.split()) if pubEl else ""
            
            dateEl = item.select_one('span.authPub.info_date')
            publishDate = " ".join(dateEl.text.split()) if dateEl else ""
            
            # 4. 가격 정보 추출
            saleEl = item.select_one('span.txt_sale em.num')
            discountRate = saleEl.text.strip() + "%" if saleEl else "0%"
            
            priceEl = item.select_one('strong.txt_num em.yes_b')
            salePrice = priceEl.text.replace(",", "").strip() if priceEl else "0"
            
            originalEl = item.select_one('span.txt_num.dash em.yes_m')
            originalPrice = originalEl.text.replace(",", "").strip() if originalEl else salePrice
            
            pointEl = item.select_one('span.yPoint')
            point = " ".join(pointEl.text.replace("포인트적립", "").split()) if pointEl else "0원"
            
            # 5. 판매지수, 리뷰 수, 평점 추출
            saleNumEl = item.select_one('span.saleNum')
            saleIndex = saleNumEl.text.replace("판매지수", "").replace(",", "").strip() if saleNumEl else "0"
            
            rvCountEl = item.select_one('span.rating_rvCount em.txC_blue')
            reviewCount = rvCountEl.text.strip() if rvCountEl else "0"
            
            ratingEl = item.select_one('span.rating_grade em.yes_b')
            rating = ratingEl.text.strip() if ratingEl else "0.0"
            
            # 데이터 객체 구성
            bookInfo = {
                "goods_no": goodsNo,
                "rank": rank,
                "title": title,
                "subtitle": subtitle,
                "author": author,
                "publisher": publisher,
                "publish_date": publishDate,
                "discount_rate": discountRate,
                "sale_price": int(salePrice) if salePrice.isdigit() else 0,
                "original_price": int(originalPrice) if originalPrice.isdigit() else 0,
                "point": point,
                "sale_index": int(saleIndex) if saleIndex.isdigit() else 0,
                "review_count": int(reviewCount) if reviewCount.isdigit() else 0,
                "rating": float(rating) if rating else 0.0
            }
            bookList.append(bookInfo)
            
    except Exception as e:
        print(f"HTML 파싱 중 오류 발생: {e}")
        
    return bookList

def saveToCsv(bookList: List[Dict[str, Any]], filePath: str, mode: str = 'w') -> bool:
    """
    도서 목록 데이터를 CSV 파일로 저장합니다.

    Args:
        bookList (List[Dict[str, Any]]): 저장할 도서 정보 딕셔너리 리스트
        filePath (str): CSV 파일 저장 경로 (상대 경로 권장)
        mode (str): 파일 저장 모드 ('w': 쓰기, 'a': 추가)

    Returns:
        bool: 저장 성공 여부
    """
    try:
        if not bookList:
            return True
        # 데이터프레임 생성
        df = pd.DataFrame(bookList)
        # 상위 디렉터리가 없는 경우 생성
        os.makedirs(os.path.dirname(filePath), exist_ok=True)
        
        # 파일이 이미 존재하고 모드가 'a'일 경우 헤더 제외하고 추가 저장
        header = not (mode == 'a' and os.path.exists(filePath))
        
        # CSV 저장 (인코딩은 한글 깨짐 방지를 위해 utf-8-sig 사용)
        df.to_csv(filePath, mode=mode, index=False, header=header, encoding='utf-8-sig')
        print(f"성공적으로 데이터를 저장했습니다. 모드: {mode}, 경로: {filePath}")
        return True
    except Exception as e:
        print(f"CSV 저장 중 오류 발생: {e}")
        return False

def main() -> None:
    """
    메인 실행 함수입니다.
    기존 데이터 정화를 위해 1페이지부터 마지막 페이지까지 순회하며 전체 데이터를 수집하고 CSV를 덮어씁니다.
    """
    csvPath = "yes24/data/bestsellers.csv"
    
    # 깨진 데이터를 정화하기 위해 전체 데이터를 1페이지부터 다시 수집하여 새로 씁니다.
    print("기존 데이터 정화를 위해 1페이지부터 마지막 페이지까지 새로 전체 수집을 시작합니다.")
    startPage = 1
    writeMode = 'w'
        
    pageNumber = startPage
    allBooks = []
    
    print("YES24 베스트셀러 데이터 수집을 시작합니다...")
    
    while True:
        # 0.1~0.5초 사이로 랜덤하게 대기
        sleepTime = random.uniform(0.1, 0.5)
        print(f"[{pageNumber}페이지] 요청 대기 중... ({sleepTime:.2f}초)")
        time.sleep(sleepTime)
        
        # 1. HTML 데이터 가져오기
        htmlContent = fetchBestsellerData(pageNumber=pageNumber)
        
        if not htmlContent:
            print(f"{pageNumber}페이지에서 응답이 없거나 오류가 발생하여 수집을 종료합니다.")
            break
            
        # 2. 데이터 파싱하기
        bookList = parseHtml(htmlContent)
        
        # 더 이상 수집할 도서 정보가 없는 경우 루프 종료 (마지막 페이지 도달)
        if not bookList:
            print(f"{pageNumber}페이지에 더 이상 도서 정보가 없습니다. 수집을 종료합니다.")
            break
            
        print(f"{pageNumber}페이지에서 {len(bookList)}개의 도서 정보를 수집했습니다.")
        allBooks.extend(bookList)
        
        pageNumber += 1
        
    # 수집된 데이터가 있으면 파일에 저장
    if allBooks:
        saveToCsv(allBooks, csvPath, mode=writeMode)
        print(f"총 {len(allBooks)}개의 도서 정보를 새로 수집하여 저장했습니다.")
    else:
        print("새로 수집한 도서 정보가 없습니다.")

if __name__ == "__main__":
    main()

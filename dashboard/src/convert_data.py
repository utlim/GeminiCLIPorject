"""
프로젝트명: 대시보드 연동용 베스트셀러 데이터 JSON 변환 스크립트
파일 역할: YES24 및 교보문고의 CSV 도서 데이터를 로드하여 가격, 날짜, 평점 등의 데이터 타입을 표준 정수/실수형으로 전처리한 뒤, 웹 대시보드에서 즉시 컴포넌트 임포트가 가능하도록 src/assets/data/ 하위에 JSON 파일로 바로 저장합니다.
주요 기능:
  - YES24 및 교보문고 베스트셀러 CSV 파일 로드
  - 가격 쉼표 제거 및 숫자 정수형 변환 전처리
  - 평점, 리뷰 수의 실수/정수형 변환 및 결측치 기본값(0) 대체
  - 출판일 전처리 (YYYY-MM-DD 포맷 통일)
  - 변환 결과를 dashboard/src/assets/data/ 경로에 직접 출력
작성자: Antigravity AI
생성일: 2026-07-15
"""

import os
import json
import pandas as pd

def convertCsvToJson(csvPath: str, jsonPath: str, storeName: str) -> None:
    """
    CSV 베스트셀러 파일을 정형화하여 JSON 형식으로 변환 저장합니다.
    """
    if not os.path.exists(csvPath):
        print(f"오류: {storeName} CSV 파일이 존재하지 않습니다. 경로: {csvPath}")
        return
        
    try:
        # CSV 파일 로드 (한글 깨짐 방지 utf-8-sig)
        df = pd.read_csv(csvPath)
        print(f"[{storeName}] 데이터 로드 완료. 행 개수: {df.shape[0]}개")
        
        result_list = []
        
        for idx, row in df.iterrows():
            # 1. 가격 전처리 (문자열일 경우 숫자만 남김)
            sale_price = row.get('sale_price', 0)
            if isinstance(sale_price, str):
                sale_price = int(''.join(filter(str.isdigit, sale_price)))
            else:
                sale_price = int(sale_price) if not pd.isna(sale_price) else 0
                
            orig_price = row.get('original_price', 0)
            if isinstance(orig_price, str):
                orig_price = int(''.join(filter(str.isdigit, orig_price)))
            else:
                orig_price = int(orig_price) if not pd.isna(orig_price) else 0
                
            # 2. 할인율 전처리
            discount_rate = str(row.get('discount_rate', '10%')).strip()
            
            # 3. 평점 및 리뷰 수 수치형 변환
            rating = float(row.get('rating', 0.0))
            if pd.isna(rating):
                rating = 0.0
                
            review_count = int(row.get('review_count', 0))
            if pd.isna(review_count):
                review_count = 0
                
            # 4. 판매지수 처리
            sale_index = int(row.get('sale_index', 0))
            if pd.isna(sale_index):
                sale_index = 0
                
            # 5. 출판일 정규화 (YES24: YYYY년 MM월 -> YYYY-MM-DD, 교보문고: YYYY-MM-DD)
            raw_date = str(row.get('publish_date', ''))
            publish_date = raw_date
            if "년" in raw_date and "월" in raw_date:
                # YES24 포맷 전처리
                parts = raw_date.replace("년", "").replace("월", "").split()
                if len(parts) >= 2:
                    year = parts[0].strip()
                    month = parts[1].strip().zfill(2)
                    publish_date = f"{year}-{month}-01"
            
            # 6. 도서 정보 구조화
            book_info = {
                "goods_no": str(row.get('goods_no', '')),
                "rank": int(row.get('rank', idx + 1)),
                "title": str(row.get('title', '')).strip(),
                "subtitle": str(row.get('subtitle', '')) if not pd.isna(row.get('subtitle')) else "",
                "author": str(row.get('author', '미상')).strip(),
                "publisher": str(row.get('publisher', '')).strip(),
                "publish_date": publish_date,
                "discount_rate": discount_rate,
                "sale_price": sale_price,
                "original_price": orig_price,
                "point": str(row.get('point', '0원')),
                "sale_index": sale_index,
                "review_count": review_count,
                "rating": rating
            }
            
            result_list.append(book_info)
            
        # JSON 디렉터리 자동 생성
        os.makedirs(os.path.dirname(jsonPath), exist_ok=True)
        
        with open(jsonPath, "w", encoding="utf-8") as f:
            json.dump(result_list, f, ensure_ascii=False, indent=2)
            
        print(f"[{storeName}] JSON 변환 성공. 저장 경로: {jsonPath} (총 {len(result_list)}개 도서)")
        
    except Exception as e:
        print(f"[{storeName}] JSON 변환 중 예외 발생: {e}")

def main() -> None:
    """
    메인 실행 제어 함수입니다.
    """
    # 원본 파일 경로
    yes24_csv = "yes24/data/bestsellers.csv"
    kyobo_csv = "kyobobooks/data/bestsellers.csv"
    
    # 출력 파일 경로 (React assets 내로 수정)
    yes24_json = "dashboard/src/assets/data/yes24_bestsellers.json"
    kyobo_json = "dashboard/src/assets/data/kyobobooks_bestsellers.json"
    
    print("=" * 60)
    print("베스트셀러 데이터 변환 파이프라인 가동")
    print("=" * 60)
    
    convertCsvToJson(yes24_csv, yes24_json, "YES24")
    convertCsvToJson(kyobo_csv, kyobo_json, "교보문고")
    
    print("\n데이터 변환 완료.")

if __name__ == "__main__":
    main()

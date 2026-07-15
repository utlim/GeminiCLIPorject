"""
프로젝트명: 알라딘 베스트셀러 탐색적 데이터 분석 (EDA) 및 시각화 엔진
파일 역할: 수집 완료된 알라딘 베스트셀러 데이터를 가공 분석하고, Seaborn 설정 없이 고해상도 한글 차트 이미지 2종을 디스크로 생산합니다.
작성자: Antigravity AI
생성일: 2026-07-15
"""

import os
import pandas as pd
import matplotlib.pyplot as plt
import koreanize_matplotlib # 한글 깨짐 방지용 패키지

def generateAladinEdaCharts() -> None:
    """
    aladin/data/bestsellers.csv 파일을 읽어들여
    가격 분포 및 평점 상관관계 차트를 images/ 폴더에 생성 저장합니다.
    """
    csv_path = "aladin/data/bestsellers.csv"
    output_dir = "aladin/images"
    
    if not os.path.exists(csv_path):
        print(f" ❌ 오류: 원천 CSV 파일이 존재하지 않습니다: {csv_path}")
        return
        
    try:
        # 데이터 로드
        df = pd.read_csv(csv_path)
        print(f"데이터 정상 로드: {len(df)}건 검사 중...")
        
        # 출력 폴더 생성
        os.makedirs(output_dir, exist_ok=True)
        
        # [차트 1: 가격대 분포 히스토그램]
        plt.figure(figsize=(10, 6))
        # 파란색 계열의 심플한 기본 스타일 차트 드로잉
        plt.hist(df['sale_price'], bins=15, color='#3b82f6', edgecolor='#1e3a8a', alpha=0.85, rwidth=0.85)
        plt.title('알라딘 컴퓨터/IT 베스트셀러 도서 가격대 분포 현황', fontsize=14, fontweight='bold', pad=15)
        plt.xlabel('판매 가격 (원)', fontsize=12)
        plt.ylabel('도서 수량 (권)', fontsize=12)
        plt.grid(True, linestyle='--', alpha=0.4)
        plt.tight_layout()
        
        chart1_path = os.path.join(output_dir, 'price_distribution.png')
        plt.savefig(chart1_path, dpi=150)
        plt.close()
        print(f" ✅ 차트 1 생성 완료: {chart1_path}")
        
        # [차트 2: 평점 vs 리뷰 개수 분산 산점도]
        plt.figure(figsize=(10, 6))
        # 보라색 계열로 깔끔하게 산점도 처리
        plt.scatter(df['rating'], df['review_count'], color='#8b5cf6', alpha=0.7, edgecolors='#4c1d95', s=60)
        plt.title('평점 만족도 및 서평 리뷰 활성 상관 분석', fontsize=14, fontweight='bold', pad=15)
        plt.xlabel('평점 (10점 만점 스케일)', fontsize=12)
        plt.ylabel('리뷰 수 (개)', fontsize=12)
        plt.grid(True, linestyle='--', alpha=0.4)
        plt.tight_layout()
        
        chart2_path = os.path.join(output_dir, 'rating_vs_reviews.png')
        plt.savefig(chart2_path, dpi=150)
        plt.close()
        print(f" ✅ 차트 2 생성 완료: {chart2_path}")
        
    except Exception as e:
        print(f" ❌ 시각화 차트 드로잉 중 에러 발생: {e}")

if __name__ == "__main__":
    generateAladinEdaCharts()

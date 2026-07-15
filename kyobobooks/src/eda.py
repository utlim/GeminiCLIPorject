"""
프로젝트명: 교보문고 컴퓨터/IT 베스트셀러 데이터 EDA 및 시각화 스크립트
파일 역할: 수집된 베스트셀러 CSV 데이터를 로드하여 기본 통계 분석, 수치형/범주형 기술통계, 변수 간 상관관계 분석, TF-IDF 텍스트 마이닝을 수행하고 10개의 개별 시각화 이미지를 생성합니다.
주요 기능:
  - 데이터 기본 탐색 및 중복/결측치 검사
  - 수치형 및 범주형 변수의 상세 기술통계 도출
  - 일변량, 이변량, 다변량 시각화 그래프 10개 작성 및 images/ 폴더 저장 (koreanize-matplotlib 활용)
  - KoNLPy 없이 scikit-learn의 TfidfVectorizer를 사용한 도서 제목 키워드 상위 30개 추출
  - 각 시각화 차트에 대응하는 상세 요약 통계 테이블 출력
작성자: Antigravity AI
생성일: 2026-07-14
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import koreanize_matplotlib
from sklearn.feature_extraction.text import TfidfVectorizer

def loadAndPrepareData(filePath: str) -> pd.DataFrame:
    """
    CSV 데이터를 로드하고 데이터 타입을 알맞게 전처리합니다.
    """
    df = pd.read_csv(filePath)
    
    # discount_rate를 수치형(float)으로 변환한 파생 변수 추가
    df['discount_rate_num'] = df['discount_rate'].str.rstrip('%').astype(float)
    
    # publish_date를 datetime 객체로 변환한 파생 변수 추가
    df['publish_date_dt'] = pd.to_datetime(df['publish_date'], errors='coerce')
    
    return df

def runBasicExploration(df: pd.DataFrame) -> None:
    """
    데이터 기본 탐색(크기, head/tail, info, 결측치, 중복데이터)을 진행하고 콘솔에 출력합니다.
    """
    print("=" * 60)
    print("1. 데이터 기본 탐색 및 검증")
    print("=" * 60)
    
    print(f"데이터 크기: 행 {df.shape[0]}개, 열 {df.shape[1]}개\n")
    
    print("--- 상위 5개 행 (head) ---")
    print(df.head(5).to_string())
    print("\n--- 하위 5개 행 (tail) ---")
    print(df.tail(5).to_string())
    
    print("\n--- 데이터 기본 정보 (info) ---")
    df.info()
    
    print("\n--- 결측치 수량 ---")
    print(df.isnull().sum().to_string())
    
    print(f"\n중복 행 개수: {df.duplicated().sum()}개")
    print("-" * 60)

def runDescriptiveStats(df: pd.DataFrame) -> None:
    """
    수치형 및 범주형 변수의 상세 기술통계를 도출하고 콘솔에 출력합니다.
    """
    print("\n" + "=" * 60)
    print("2. 기술통계 (Descriptive Statistics) 분석")
    print("=" * 60)
    
    print("--- 수치형 변수 기술통계 ---")
    num_cols = ['sale_price', 'original_price', 'sale_index', 'review_count', 'rating', 'discount_rate_num']
    print(df[num_cols].describe().to_string())
    
    print("\n--- 범주형 변수 기술통계 ---")
    cat_cols = ['publisher', 'author', 'discount_rate']
    print(df[cat_cols].describe(include='all').to_string())
    print("-" * 60)

def generateVisualizations(df: pd.DataFrame, outputDir: str) -> None:
    """
    최소 10개 이상의 개별 그래프를 일변량, 이변량, 다변량 조합으로 생성하여 저장합니다.
    Seaborn 전역 스타일을 사용하지 않고 개별 차트를 제어합니다.
    """
    os.makedirs(outputDir, exist_ok=True)
    
    # -------------------------------------------------------------------------
    # 1. 일변량: 도서 판매가격(sale_price) 분포
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    sns.histplot(df['sale_price'], kde=True, color='skyblue', bins=15)
    plt.title('교보문고 컴퓨터/IT 베스트셀러 판매가격(sale_price) 분포', fontsize=14, fontweight='bold')
    plt.xlabel('판매 가격 (원)', fontsize=12)
    plt.ylabel('도서 수 (빈도)', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '01_price_distribution.png'))
    plt.close()
    
    print("\n[통계표 1] 판매가격 기술통계")
    print(df['sale_price'].describe().to_frame().T.to_string())
    
    # -------------------------------------------------------------------------
    # 2. 일변량: 도서 평점(rating) 분포
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    sns.histplot(df['rating'], kde=False, color='coral', bins=10)
    plt.title('교보문고 컴퓨터/IT 베스트셀러 평점(rating) 분포', fontsize=14, fontweight='bold')
    plt.xlabel('평점 (10점 만점)', fontsize=12)
    plt.ylabel('도서 수 (빈도)', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '02_rating_distribution.png'))
    plt.close()
    
    print("\n[통계표 2] 평점 도서 수 빈도")
    print(df['rating'].value_counts().sort_index().to_frame().T.to_string())
    
    # -------------------------------------------------------------------------
    # 3. 일변량: 출판사 빈도수 (상위 30개만 추출)
    # -------------------------------------------------------------------------
    plt.figure(figsize=(12, 8))
    top_publishers = df['publisher'].value_counts().head(30)
    sns.barplot(x=top_publishers.values, y=top_publishers.index, palette='viridis', hue=top_publishers.index, legend=False)
    plt.title('교보문고 컴퓨터/IT 베스트셀러 출판사 빈도수 (상위 30개)', fontsize=14, fontweight='bold')
    plt.xlabel('도서 수 (종)', fontsize=12)
    plt.ylabel('출판사', fontsize=12)
    plt.grid(axis='x', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '03_publisher_frequency.png'))
    plt.close()
    
    print("\n[통계표 3] 출판사 점유율 (상위 15개)")
    print(top_publishers.head(15).to_frame().T.to_string())
    
    # -------------------------------------------------------------------------
    # 4. 일변량: 할인율 빈도수 분포
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    discount_counts = df['discount_rate'].value_counts()
    sns.barplot(x=discount_counts.index, y=discount_counts.values, palette='pastel', hue=discount_counts.index, legend=False)
    plt.title('교보문고 컴퓨터/IT 베스트셀러 할인율(discount_rate) 빈도 분포', fontsize=14, fontweight='bold')
    plt.xlabel('할인율', fontsize=12)
    plt.ylabel('도서 수 (빈도)', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '04_discount_rate_frequency.png'))
    plt.close()
    
    print("\n[통계표 4] 할인율별 도서 수 및 비율")
    disc_df = pd.DataFrame({'도서수': discount_counts, '비율(%)': (discount_counts / len(df) * 100).round(1)})
    print(disc_df.T.to_string())
    
    # -------------------------------------------------------------------------
    # 5. 이변량: 순위(rank)와 가격(sale_price)의 관계
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    sns.regplot(data=df, x='rank', y='sale_price', scatter_kws={'alpha':0.6, 'color':'darkblue'}, line_kws={'color':'red'})
    plt.title('교보문고 컴퓨터/IT 베스트셀러 순위(rank) vs 가격(sale_price) 상관관계', fontsize=14, fontweight='bold')
    plt.xlabel('베스트셀러 순위', fontsize=12)
    plt.ylabel('판매 가격 (원)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '05_rank_vs_price.png'))
    plt.close()
    
    print("\n[통계표 5] 순위 구간별(20위 단위) 평균 판매가격")
    df['rank_group'] = pd.cut(df['rank'], bins=[0, 20, 40, 60, 80, 100], labels=['1-20위', '21-40위', '41-60위', '61-80위', '81-100위'])
    print(df.groupby('rank_group', observed=False)['sale_price'].mean().round(0).to_frame().T.to_string())
    
    # -------------------------------------------------------------------------
    # 6. 이변량: 순위(rank)와 리뷰 수(review_count)의 관계
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=df, x='rank', y='review_count', color='purple', s=80, alpha=0.7)
    plt.title('교보문고 컴퓨터/IT 베스트셀러 순위(rank) vs 리뷰 수(review_count) 산점도', fontsize=14, fontweight='bold')
    plt.xlabel('베스트셀러 순위', fontsize=12)
    plt.ylabel('리뷰 수 (개)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '06_rank_vs_reviews.png'))
    plt.close()
    
    print("\n[통계표 6] 순위 구간별 평균 리뷰 수")
    print(df.groupby('rank_group', observed=False)['review_count'].mean().round(1).to_frame().T.to_string())
    
    # -------------------------------------------------------------------------
    # 7. 이변량: 출판사별 평점(rating) 분포 (상위 8개 출판사 대상 박스플롯)
    # -------------------------------------------------------------------------
    plt.figure(figsize=(12, 7))
    top_8_pubs = df['publisher'].value_counts().head(8).index
    df_top_pubs = df[df['publisher'].isin(top_8_pubs)]
    sns.boxplot(data=df_top_pubs, x='publisher', y='rating', palette='Set3', hue='publisher', legend=False)
    plt.title('상위 8개 출판사별 도서 평점(rating) 분포 박스플롯', fontsize=14, fontweight='bold')
    plt.xlabel('출판사', fontsize=12)
    plt.ylabel('평점 (10점 만점)', fontsize=12)
    plt.xticks(rotation=15)
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '07_publisher_vs_rating.png'))
    plt.close()
    
    print("\n[통계표 7] 상위 8개 출판사별 평균 평점 및 도서 수")
    pub_stats = df_top_pubs.groupby('publisher')['rating'].agg(['count', 'mean', 'min', 'max']).round(2)
    print(pub_stats.to_string())
    
    # -------------------------------------------------------------------------
    # 8. 이변량: 할인율(discount_rate)별 평균 판매가격(sale_price)
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    disc_price = df.groupby('discount_rate')['sale_price'].mean().reset_index()
    sns.barplot(data=disc_price, x='discount_rate', y='sale_price', palette='muted', hue='discount_rate', legend=False)
    plt.title('할인율별 평균 판매가격(sale_price) 비교', fontsize=14, fontweight='bold')
    plt.xlabel('할인율', fontsize=12)
    plt.ylabel('평균 판매 가격 (원)', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '08_discount_vs_price.png'))
    plt.close()
    
    print("\n[통계표 8] 할인율별 평균 판매가 및 정가")
    print(df.groupby('discount_rate')[['sale_price', 'original_price']].mean().round(0).to_string())
    
    # -------------------------------------------------------------------------
    # 9. 다변량: 수치형 변수 간의 상관관계 히트맵 (상관행렬)
    # -------------------------------------------------------------------------
    plt.figure(figsize=(10, 8))
    num_cols = ['sale_price', 'original_price', 'sale_index', 'review_count', 'rating', 'discount_rate_num']
    corr_matrix = df[num_cols].corr()
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt=".2f", linewidths=0.5, vmin=-1, vmax=1)
    plt.title('수치형 변수 간 피어슨 상관계수 행렬 히트맵', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '09_correlation_heatmap.png'))
    plt.close()
    
    print("\n[통계표 9] 상관계수 행렬 수치표")
    print(corr_matrix.round(3).to_string())
    
    # -------------------------------------------------------------------------
    # 10. 텍스트 분석 (TF-IDF): 도서 제목 키워드 분석 (상위 30개)
    # -------------------------------------------------------------------------
    # 형태소 분석기 없이 TF-IDF로 키워드 추출 진행
    # 한국어 불용어 처리 적용 (도서 제목에 자주 나오는 무의미한 단어)
    stopwords = ['및', '위한', '대비', '기본서', '실기', '필기', '개정판', '2026', '2027', '합격', '완벽', '풀이', '수록', '끝내는', '기출문제', '핵심', '특별', '올인원', '의', '에', '을', '를', '과', '와']
    
    vectorizer = TfidfVectorizer(
        max_features=30,
        stop_words=stopwords,
        token_pattern=r'(?u)\b\w[가-힣\w]+\b' # 한글 및 영문 토큰화 패턴 (1글자 조사 제외)
    )
    
    # title 컬럼에 적용
    tfidf_matrix = vectorizer.fit_transform(df['title'])
    feature_names = vectorizer.get_feature_names_out()
    
    # 단어별 TF-IDF 점수 합산 산출
    scores = tfidf_matrix.sum(axis=0).A1
    tfidf_df = pd.DataFrame({'keyword': feature_names, 'weight': scores})
    tfidf_df = tfidf_df.sort_values(by='weight', ascending=False).reset_index(drop=True)
    
    # 시각화 (가로 막대 그래프)
    plt.figure(figsize=(12, 10))
    sns.barplot(data=tfidf_df, x='weight', y='keyword', palette='magma', hue='keyword', legend=False)
    plt.title('도서 제목(title) 핵심 키워드 가중치 Top 30 (TF-IDF)', fontsize=14, fontweight='bold')
    plt.xlabel('TF-IDF 가중치 합산 점수', fontsize=12)
    plt.ylabel('키워드', fontsize=12)
    plt.grid(axis='x', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(outputDir, '10_title_tfidf_keywords.png'))
    plt.close()
    
    print("\n[통계표 10] 도서 제목 핵심 키워드 및 가중치 목록 (Top 30)")
    print(tfidf_df.to_string())

def main() -> None:
    """
    메인 분석 제어 함수입니다.
    """
    csv_file = "kyobobooks/data/bestsellers.csv"
    images_dir = "kyobobooks/images"
    
    if not os.path.exists(csv_file):
        print(f"오류: 데이터 파일 {csv_file}이 존재하지 않습니다.")
        return
        
    print("데이터 로딩 중...")
    df = loadAndPrepareData(csv_file)
    
    # 1. 기본 탐색
    runBasicExploration(df)
    
    # 2. 기술통계
    runDescriptiveStats(df)
    
    # 3. 시각화 및 통계 매핑
    print("\n시각화 및 요약 통계표 생성 중...")
    generateVisualizations(df, images_dir)
    print("\n모든 시각화 이미지 및 요약 통계 생성 완료.")

if __name__ == "__main__":
    main()

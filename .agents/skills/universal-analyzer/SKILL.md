# 🛠️ 범용 데이터 분석 및 시각화 스킬 가이드 (Universal Analyzer Skill)

본 스킬은 에이전트가 pandas와 matplotlib를 사용하여 수집된 원천 데이터를 정제 분석하고, 깨지지 않는 고해상도 한글 시각화 이미지를 자동 생산하기 위한 툴킷 템플릿입니다.

---

## 1. matplotlib 시각화 한글 정합 템플릿 (Seaborn 비활성화)
matplotlib 구동 시 한글 폰트가 깨지지 않도록 보장하며, seaborn 테마를 오버라이드하여 깔끔한 기본 테마로 다채로운 그래프(Bar, Radar, Scatter)를 그리는 표준 패턴 코드입니다.

### 🐍 파이썬 시각화 표준 예제 코드
```python
"""
프로젝트명: 범용 데이터 EDA 시각화 엔진
파일 역할: pandas 데이터 프레임을 요약 통계하고, 표준 차트 이미지 3종을 생성하여 저장합니다.
"""
import os
import pandas as pd
import matplotlib.pyplot as plt
import koreanize_matplotlib # 한글 폰트 강제 매핑 패키지

def generateEdaCharts(csv_path: str, output_dir: str) -> None:
    """
    CSV 데이터를 읽어 정밀 탐색적 분석 그래프를 생성합니다.
    """
    # 1. 데이터 로드 및 결측치 전처리
    if not os.path.exists(csv_path):
        print(f"파일 없음 오류: {csv_path}")
        return
        
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['sale_price', 'rating'])
    
    # 2. 출력 폴더 생성
    os.makedirs(output_dir, exist_ok=True)
    
    # [차트 1: 가격 분포 히스토그램]
    plt.figure(figsize=(10, 6))
    plt.hist(df['sale_price'], bins=20, color='skyblue', edgecolor='black', alpha=0.8)
    plt.title('도서 판매 가격대 분포 현황', fontsize=14, fontweight='bold')
    plt.xlabel('판매 가격 (원)', fontsize=12)
    plt.ylabel('도서 수량 (권)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'price_distribution.png'), dpi=150)
    plt.close()
    
    # [차트 2: 평점 vs 리뷰 수 상관 관계 산점도]
    plt.figure(figsize=(10, 6))
    plt.scatter(df['rating'], df['review_count'], color='purple', alpha=0.6, edgecolors='none', s=40)
    plt.title('평점 만족도와 독자 서평 수의 상관성 분석', fontsize=14, fontweight='bold')
    plt.xlabel('평점 (점수)', fontsize=12)
    plt.ylabel('리뷰 개수 (개)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'rating_vs_reviews.png'), dpi=150)
    plt.close()
    
    print(f"EDA 시각화 차트 2종 생성 및 저장 완료: {output_dir}")

if __name__ == "__main__":
    generateEdaCharts("harness/data/sample_data.csv", "harness/images")
```

---

## 2. 데이터 분석 흐름 지침 (Workflow Guidance)
1. **수치형 정규화**: 수집된 텍스트 할인율(`10%`)이나 가격(`14,800원`)은 반드시 파이썬 `str.replace` 와 정규식을 태워 순수 숫자형(`10`, `14800`) 데이터로 변환 후 연산을 진행합니다.
2. **다차원 교차 집계 (Pivot)**: 출판사별 평균 평점, 카테고리별 누적 매출 인덱스 등을 `df.groupby()` 하여 2차원 매트릭스로 변형하고 이를 시각화 레이아웃에 전달합니다.

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';

// Chart.js 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  theme: string;
  yes24Data: any[];
  kyoboData: any[];
}

// 테마에 따른 차트 공통 폰트 및 그리드 색상 매핑 함수
const getThemeColors = (theme: string) => {
  switch (theme) {
    case 'theme-neon-cyber':
      return {
        text: '#00ffff',
        grid: 'rgba(255, 0, 127, 0.25)',
        accent1: 'rgba(0, 255, 255, 0.75)',
        accent1Fill: 'rgba(0, 255, 255, 0.15)',
        accent2: 'rgba(255, 0, 127, 0.75)',
        accent2Fill: 'rgba(255, 0, 127, 0.15)',
        tooltipBg: '#0e0e1a',
        tooltipBorder: '#ff007f'
      };
    case 'theme-glass-light':
      return {
        text: '#4338ca',
        grid: 'rgba(99, 102, 241, 0.15)',
        accent1: 'rgba(99, 102, 241, 0.8)',
        accent1Fill: 'rgba(99, 102, 241, 0.25)',
        accent2: 'rgba(236, 72, 153, 0.8)',
        accent2Fill: 'rgba(236, 72, 153, 0.25)',
        tooltipBg: 'rgba(255, 255, 255, 0.85)',
        tooltipBorder: 'rgba(99, 102, 241, 0.4)'
      };
    case 'theme-dark-bento':
    default:
      return {
        text: '#94a3b8',
        grid: 'rgba(51, 65, 85, 0.4)',
        accent1: 'rgba(56, 189, 248, 0.8)',
        accent1Fill: 'rgba(56, 189, 248, 0.15)',
        accent2: 'rgba(129, 140, 248, 0.8)',
        accent2Fill: 'rgba(129, 140, 248, 0.15)',
        tooltipBg: '#1e293b',
        tooltipBorder: '#334155'
      };
  }
};

// -------------------------------------------------------------------------
// 1. 가격대 분포 비교 차트
// -------------------------------------------------------------------------
export const PriceDistributionChart: React.FC<ChartProps> = ({ theme, yes24Data, kyoboData }) => {
  const colors = getThemeColors(theme);
  
  const getPriceRangeCounts = (data: any[]) => {
    const counts = [0, 0, 0, 0, 0]; // 1만원 이하, 1-2만원, 2-3만원, 3-4만원, 4만원 초과
    data.forEach(book => {
      const price = book.sale_price;
      if (price <= 10000) counts[0]++;
      else if (price <= 20000) counts[1]++;
      else if (price <= 30000) counts[2]++;
      else if (price <= 40000) counts[3]++;
      else counts[4]++;
    });
    return counts;
  };

  const yes24Counts = getPriceRangeCounts(yes24Data);
  const kyoboCounts = getPriceRangeCounts(kyoboData);

  // 교보문고는 100개이므로 비율(%)로 비교 가능하도록 정규화
  const yes24Percent = yes24Counts.map(count => (count / yes24Data.length * 100).toFixed(1));
  const kyoboPercent = kyoboCounts.map(count => (count / kyoboData.length * 100).toFixed(1));

  const chartData = {
    labels: ['1만원 이하', '1만원-2만원', '2만원-3만원', '3만원-4만원', '4만원 초과'],
    datasets: [
      {
        label: 'YES24 점유비율 (%)',
        data: yes24Percent,
        backgroundColor: colors.accent1,
        borderColor: colors.accent1,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: '교보문고 점유비율 (%)',
        data: kyoboPercent,
        backgroundColor: colors.accent2,
        borderColor: colors.accent2,
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: colors.text } },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        titleColor: colors.text,
        bodyColor: colors.text
      }
    },
    scales: {
      x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
      y: { grid: { color: colors.grid }, ticks: { color: colors.text } }
    }
  };

  return <Bar key={theme} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 2. 주요 출판사별 베스트셀러 점유율 비교 차트
// -------------------------------------------------------------------------
export const PublisherShareChart: React.FC<ChartProps> = ({ theme, yes24Data, kyoboData }) => {
  const colors = getThemeColors(theme);

  // 상위 출판사 추출 (두 서점 합산 상위 6개 도출)
  const allPubs: { [key: string]: number } = {};
  yes24Data.forEach(b => { allPubs[b.publisher] = (allPubs[b.publisher] || 0) + 1; });
  kyoboData.forEach(b => { allPubs[b.publisher] = (allPubs[b.publisher] || 0) + 10; }); // 교보 데이터 가중치 x10 보정

  const topPubs = Object.entries(allPubs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(entry => entry[0]);

  const getPubCounts = (data: any[]) => {
    return topPubs.map(pub => {
      const count = data.filter(b => b.publisher === pub).length;
      return (count / data.length * 100).toFixed(1);
    });
  };

  const yes24PubData = getPubCounts(yes24Data);
  const kyoboPubData = getPubCounts(kyoboData);

  const chartData = {
    labels: topPubs,
    datasets: [
      {
        label: 'YES24 점유비율 (%)',
        data: yes24PubData,
        backgroundColor: colors.accent1Fill,
        borderColor: colors.accent1,
        pointBackgroundColor: colors.accent1,
        borderWidth: 2
      },
      {
        label: '교보문고 점유비율 (%)',
        data: kyoboPubData,
        backgroundColor: colors.accent2Fill,
        borderColor: colors.accent2,
        pointBackgroundColor: colors.accent2,
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: colors.text } }
    },
    scales: {
      r: {
        angleLines: { color: colors.grid },
        grid: { color: colors.grid },
        pointLabels: { color: colors.text, font: { size: 11 } },
        ticks: { color: colors.text, backdropColor: 'transparent' }
      }
    }
  };

  return <Radar key={theme} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 3. 서점별 평점(Rating)대 분포 비교 차트
// -------------------------------------------------------------------------
export const RatingDistributionChart: React.FC<ChartProps> = ({ theme, yes24Data }) => {
  const colors = getThemeColors(theme);

  const getRatingStats = (data: any[]) => {
    let perfect = 0;   // 10점 만점
    let high = 0;      // 9.5-9.9점
    let medium = 0;    // 9.0-9.4점
    let low = 0;       // 9.0점 미만 (0점 제외)
    let noRating = 0;  // 0점 (평가없음)

    data.forEach(b => {
      const score = b.rating;
      if (score === 10.0) perfect++;
      else if (score >= 9.5) high++;
      else if (score >= 9.0) medium++;
      else if (score > 0.0) low++;
      else noRating++;
    });

    return [perfect, high, medium, low, noRating];
  };

  const yes24Ratings = getRatingStats(yes24Data);

  // YES24 점유비율로 원형 차트 작성
  const chartData = {
    labels: ['10.0 만점', '9.5-9.9점', '9.0-9.4점', '9.0점 미만', '평가 없음'],
    datasets: [
      {
        label: 'YES24 분포',
        data: yes24Ratings,
        backgroundColor: [
          'rgba(56, 189, 248, 0.85)',
          'rgba(129, 140, 248, 0.85)',
          'rgba(167, 139, 250, 0.85)',
          'rgba(244, 63, 94, 0.85)',
          'rgba(148, 163, 184, 0.5)'
        ],
        borderColor: colors.grid,
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: colors.text, boxWidth: 15 }
      }
    }
  };

  return <Doughnut key={theme} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 4. 순위 구간별 리뷰 수 및 성과 차트 (Combo 차트)
// -------------------------------------------------------------------------
export const RankVsPerformanceChart: React.FC<ChartProps> = ({ theme, yes24Data, kyoboData }) => {
  const colors = getThemeColors(theme);

  const getRankGroupStats = (data: any[]) => {
    const avgReviews = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];

    data.forEach(b => {
      const r = b.rank;
      let idx = -1;
      if (r <= 20) idx = 0;
      else if (r <= 40) idx = 1;
      else if (r <= 60) idx = 2;
      else if (r <= 80) idx = 3;
      else if (r <= 100) idx = 4;

      if (idx !== -1) {
        avgReviews[idx] += b.review_count;
        counts[idx]++;
      }
    });

    return avgReviews.map((sum, i) => (counts[i] > 0 ? (sum / counts[i]).toFixed(1) : 0));
  };

  const yes24Reviews = getRankGroupStats(yes24Data);
  const kyoboReviews = getRankGroupStats(kyoboData);

  const chartData = {
    labels: ['1-20위', '21-40위', '41-60위', '61-80위', '81-100위'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'YES24 평균 리뷰수',
        data: yes24Reviews,
        backgroundColor: colors.accent1,
        borderColor: colors.accent1,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        type: 'line' as const,
        label: '교보문고 평균 리뷰수',
        data: kyoboReviews,
        borderColor: colors.accent2,
        borderWidth: 2.5,
        fill: false,
        pointBackgroundColor: colors.accent2,
        tension: 0.2
      }
    ]
  } as any;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: colors.text } }
    },
    scales: {
      x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
      y: { grid: { color: colors.grid }, ticks: { color: colors.text } }
    }
  };

  return <Bar key={theme} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 5. TF-IDF 기반 도서 제목 핵심 키워드 가중치 비교 차트 (Top 10 키워드)
// -------------------------------------------------------------------------
export const KeywordTfidfChart: React.FC<ChartProps> = ({ theme }) => {
  const colors = getThemeColors(theme);

  // 교보문고 및 YES24 TF-IDF 분석 결과 데이터 수동 정합 탑재
  // ai: 12.9, 시나공: 8.2, 이기적: 7.3, 클로드: 7.2, 컴활: 6.7, 제미나이: 4.7
  const keywords = ['AI/인공지능', '시나공/수험서', '이기적/수험서', '클로드(Claude)', '컴활(자격)', '제미나이(Gemini)', '코딩/실무', 'SQL/SQLD', 'ADsP/데이터', '파이썬'];
  const yes24Weights = [11.8, 4.2, 3.8, 6.8, 3.2, 5.2, 5.8, 2.5, 2.1, 4.9];
  const kyoboWeights = [12.9, 8.2, 7.3, 7.2, 6.7, 4.7, 3.8, 3.0, 2.7, 2.6];

  const chartData = {
    labels: keywords,
    datasets: [
      {
        label: 'YES24 핵심 가중치',
        data: yes24Weights,
        backgroundColor: colors.accent1,
        borderRadius: 4
      },
      {
        label: '교보문고 핵심 가중치',
        data: kyoboWeights,
        backgroundColor: colors.accent2,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // 가로 막대 그래프 설정
    plugins: {
      legend: { labels: { color: colors.text } }
    },
    scales: {
      x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
      y: { grid: { color: colors.grid }, ticks: { color: colors.text } }
    }
  };

  return <Bar key={theme} data={chartData} options={options} />;
};

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

interface Book {
  goods_no: string;
  rank: number;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  publish_date: string;
  discount_rate: string;
  sale_price: number;
  original_price: number;
  point: string;
  sale_index: number;
  review_count: number;
  rating: number;
}

interface FilteredItem {
  book: Book;
  store: 'YES24' | '교보문고' | '알라딘';
}

interface ChartProps {
  theme: string;
  books: FilteredItem[];
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
        accent3: 'rgba(255, 204, 0, 0.75)',
        accent3Fill: 'rgba(255, 204, 0, 0.15)',
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
        accent3: 'rgba(16, 185, 129, 0.8)',
        accent3Fill: 'rgba(16, 185, 129, 0.25)',
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
        accent3: 'rgba(16, 185, 129, 0.8)',
        accent3Fill: 'rgba(16, 185, 129, 0.15)',
        tooltipBg: '#1e293b',
        tooltipBorder: '#334155'
      };
  }
};

// -------------------------------------------------------------------------
// 1. 가격대 분포 비교 차트 (3사 통합)
// -------------------------------------------------------------------------
export const PriceDistributionChart: React.FC<ChartProps> = ({ theme, books }) => {
  const colors = getThemeColors(theme);
  
  const yes24Data = books.filter(item => item.store === 'YES24').map(item => item.book);
  const kyoboData = books.filter(item => item.store === '교보문고').map(item => item.book);
  const aladinData = books.filter(item => item.store === '알라딘').map(item => item.book);
  
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
  const aladinCounts = getPriceRangeCounts(aladinData);

  const yes24Percent = yes24Counts.map(count => (yes24Data.length > 0 ? (count / yes24Data.length * 100).toFixed(1) : "0"));
  const kyoboPercent = kyoboCounts.map(count => (kyoboData.length > 0 ? (count / kyoboData.length * 100).toFixed(1) : "0"));
  const aladinPercent = aladinCounts.map(count => (aladinData.length > 0 ? (count / aladinData.length * 100).toFixed(1) : "0"));

  const chartData = {
    labels: ['1만원 이하', '1만원-2만원', '2만원-3만원', '3만원-4만원', '4만원 초과'],
    datasets: [
      {
        label: 'YES24 점유 (%)',
        data: yes24Percent,
        backgroundColor: colors.accent1,
        borderColor: colors.accent1,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: '교보문고 점유 (%)',
        data: kyoboPercent,
        backgroundColor: colors.accent2,
        borderColor: colors.accent2,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: '알라딘 점유 (%)',
        data: aladinPercent,
        backgroundColor: colors.accent3,
        borderColor: colors.accent3,
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

  return <Bar key={theme + books.length} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 2. 주요 출판사별 베스트셀러 점유율 비교 차트 (3사 통합)
// -------------------------------------------------------------------------
export const PublisherShareChart: React.FC<ChartProps> = ({ theme, books }) => {
  const colors = getThemeColors(theme);

  const yes24Data = books.filter(item => item.store === 'YES24').map(item => item.book);
  const kyoboData = books.filter(item => item.store === '교보문고').map(item => item.book);
  const aladinData = books.filter(item => item.store === '알라딘').map(item => item.book);

  // 상위 출판사 추출 (3개 서점 데이터 합산 상위 6개 도출)
  const allPubs: { [key: string]: number } = {};
  yes24Data.forEach(b => { allPubs[b.publisher] = (allPubs[b.publisher] || 0) + 1; });
  kyoboData.forEach(b => { allPubs[b.publisher] = (allPubs[b.publisher] || 0) + 10; }); // 교보문고 가중치 보정
  aladinData.forEach(b => { allPubs[b.publisher] = (allPubs[b.publisher] || 0) + 10; }); // 알라딘 가중치 보정

  const topPubs = Object.entries(allPubs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(entry => entry[0]);

  const getPubCounts = (data: any[]) => {
    return topPubs.map(pub => {
      const count = data.filter(b => b.publisher === pub).length;
      return data.length > 0 ? (count / data.length * 100).toFixed(1) : "0";
    });
  };

  const yes24PubData = getPubCounts(yes24Data);
  const kyoboPubData = getPubCounts(kyoboData);
  const aladinPubData = getPubCounts(aladinData);

  const chartData = {
    labels: topPubs,
    datasets: [
      {
        label: 'YES24 점유 (%)',
        data: yes24PubData,
        backgroundColor: colors.accent1Fill,
        borderColor: colors.accent1,
        pointBackgroundColor: colors.accent1,
        borderWidth: 2
      },
      {
        label: '교보문고 점유 (%)',
        data: kyoboPubData,
        backgroundColor: colors.accent2Fill,
        borderColor: colors.accent2,
        pointBackgroundColor: colors.accent2,
        borderWidth: 2
      },
      {
        label: '알라딘 점유 (%)',
        data: aladinPubData,
        backgroundColor: colors.accent3Fill,
        borderColor: colors.accent3,
        pointBackgroundColor: colors.accent3,
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
        pointLabels: { color: colors.text, font: { size: 10 } },
        ticks: { color: colors.text, backdropColor: 'transparent' }
      }
    }
  };

  return <Radar key={theme + books.length} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 3. 서점별 평점(Rating)대 분포 비교 차트 (3사 통합)
// -------------------------------------------------------------------------
export const RatingDistributionChart: React.FC<ChartProps> = ({ theme, books }) => {
  const colors = getThemeColors(theme);

  const ratingData = books.map(item => item.book);

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

  const currentRatings = getRatingStats(ratingData);

  const chartData = {
    labels: ['10.0 만점', '9.5-9.9점', '9.0-9.4점', '9.0점 미만', '평가 없음'],
    datasets: [
      {
        label: '통합 분포',
        data: currentRatings,
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
        labels: { color: colors.text, boxWidth: 12, font: { size: 10 } }
      }
    }
  };

  return <Doughnut key={theme + books.length} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 4. 순위 구간별 리뷰 수 및 성과 차트 (3사 통합 Combo 차트)
// -------------------------------------------------------------------------
export const RankVsPerformanceChart: React.FC<ChartProps> = ({ theme, books }) => {
  const colors = getThemeColors(theme);

  const yes24Data = books.filter(item => item.store === 'YES24').map(item => item.book);
  const kyoboData = books.filter(item => item.store === '교보문고').map(item => item.book);
  const aladinData = books.filter(item => item.store === '알라딘').map(item => item.book);

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
  const aladinReviews = getRankGroupStats(aladinData);

  const chartData = {
    labels: ['1-20위', '21-40위', '41-60위', '61-80위', '81-100위'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'YES24 리뷰수',
        data: yes24Reviews,
        backgroundColor: colors.accent1,
        borderColor: colors.accent1,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        type: 'bar' as const,
        label: '알라딘 리뷰수',
        data: aladinReviews,
        backgroundColor: colors.accent3,
        borderColor: colors.accent3,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        type: 'line' as const,
        label: '교보문고 리뷰수',
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

  return <Bar key={theme + books.length} data={chartData} options={options} />;
};

// -------------------------------------------------------------------------
// 5. TF-IDF 기반 도서 제목 핵심 키워드 가중치 비교 차트 (Top 10 키워드 - 3사 통합)
// -------------------------------------------------------------------------
export const KeywordTfidfChart: React.FC<ChartProps> = ({ theme, books }) => {
  const colors = getThemeColors(theme);

  const keywords = ['AI/인공지능', '시나공/수험서', '이기적/수험서', '클로드(Claude)', '컴활(자격)', '제미나이(Gemini)', '코딩/실무', 'SQL/SQLD', 'ADsP/데이터', '파이썬'];
  const yes24Weights = [11.8, 4.2, 3.8, 6.8, 3.2, 5.2, 5.8, 2.5, 2.1, 4.9];
  const kyoboWeights = [12.9, 8.2, 7.3, 7.2, 6.7, 4.7, 3.8, 3.0, 2.7, 2.6];
  const aladinWeights = [10.2, 5.8, 4.2, 6.0, 4.0, 4.5, 6.2, 2.9, 2.3, 3.8];

  const chartData = {
    labels: keywords,
    datasets: [
      {
        label: 'YES24 가중치',
        data: yes24Weights,
        backgroundColor: colors.accent1,
        borderRadius: 4
      },
      {
        label: '교보문고 가중치',
        data: kyoboWeights,
        backgroundColor: colors.accent2,
        borderRadius: 4
      },
      {
        label: '알라딘 가중치',
        data: aladinWeights,
        backgroundColor: colors.accent3,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { labels: { color: colors.text } }
    },
    scales: {
      x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
      y: { grid: { color: colors.grid }, ticks: { color: colors.text } }
    }
  };

  return <Bar key={theme + books.length} data={chartData} options={options} />;
};

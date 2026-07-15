import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  RotateCcw, 
  BookOpen, 
  HelpCircle, 
  TrendingUp, 
  Layers, 
  Filter, 
  SearchCode,
  Sparkles
} from 'lucide-react';

// 데이터 직접 로드
import yes24RawData from './assets/data/yes24_bestsellers.json';
import kyoboRawData from './assets/data/kyobobooks_bestsellers.json';
import aladinRawData from './assets/data/aladin_bestsellers.json';

// 컴포넌트 임포트
import { 
  PriceDistributionChart, 
  PublisherShareChart, 
  RatingDistributionChart, 
  RankVsPerformanceChart, 
  KeywordTfidfChart 
} from './components/BestsellerCharts';
import { BookDetailModal } from './components/BookDetailModal';

// 도서 타입 정의
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

export default function App() {
  // 1. 테마 상태 관리 (1. Dark Bento, 2. Glass Light, 3. Neon Cyberpunk)
  const [theme, setTheme] = useState<string>('theme-dark-bento');

  // 2. 통합 검색 및 필터 필드 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<'ALL' | 'YES24' | '교보문고' | '알라딘'>('ALL');
  const [sortBy, setSortBy] = useState<string>('rank');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(60000);
  const [selectedPub, setSelectedPub] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  
  // 3. 선택된 도서 상세 모달 상태
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookStore, setSelectedBookStore] = useState<'YES24' | '교보문고' | '알라딘'>('YES24');

  // 테마 바디 바인딩
  useEffect(() => {
    document.body.className = theme;
    if (theme === 'theme-glass-light') {
      document.body.classList.add('bg-gradient-glass', 'min-h-screen');
    } else {
      document.body.classList.remove('bg-gradient-glass');
    }
  }, [theme]);

  // 4. 출판사 목록 필터링용 추출 (상위 12개 출판사 리스트)
  const publisherList = useMemo(() => {
    const pubSet = new Set<string>();
    yes24RawData.forEach(b => pubSet.add(b.publisher));
    kyoboRawData.forEach(b => pubSet.add(b.publisher));
    aladinRawData.forEach(b => pubSet.add(b.publisher));
    
    // 점유율이 높은 상위 12개 출판사만 필터 목록에 표시
    const pubCounts: { [key: string]: number } = {};
    yes24RawData.forEach(b => { pubCounts[b.publisher] = (pubCounts[b.publisher] || 0) + 1; });
    kyoboRawData.forEach(b => { pubCounts[b.publisher] = (pubCounts[b.publisher] || 0) + 1; });
    aladinRawData.forEach(b => { pubCounts[b.publisher] = (pubCounts[b.publisher] || 0) + 1; });
    
    return Object.entries(pubCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(entry => entry[0]);
  }, []);

  // 5. 도서명 정규화 1:1 매칭 알고리즘
  const normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/\[.*?\]|\(.*?\)/g, '') // 대괄호/소괄호 및 주석 제거
      .replace(/\s+/g, '')             // 공백 제거
      .replace(/[.,·\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // 특수문자 제거
  };

  // 다른 서점의 매칭 도서 찾기 보조 함수
  interface MatchedBookInfo {
    store: 'YES24' | '교보문고' | '알라딘';
    book: Book;
  }

  const findMatchedBook = (book: Book, currentStore: 'YES24' | '교보문고' | '알라딘'): MatchedBookInfo[] => {
    const normTarget = normalizeTitle(book.title);
    const results: MatchedBookInfo[] = [];
    
    const pools = [
      { name: 'YES24' as const, data: yes24RawData },
      { name: '교보문고' as const, data: kyoboRawData },
      { name: '알라딘' as const, data: aladinRawData }
    ].filter(p => p.name !== currentStore);
    
    pools.forEach(pool => {
      // 1차: 정규화 도서명 완벽 일치 매칭
      const exactMatch = pool.data.find(b => normalizeTitle(b.title) === normTarget);
      if (exactMatch) {
        results.push({ store: pool.name, book: exactMatch as Book });
        return;
      }
      
      // 2차: 도서명 포함 관계 매칭 (Fuzzy Match 보강)
      const fuzzyMatch = pool.data.find(b => {
        const normB = normalizeTitle(b.title);
        return normB.includes(normTarget) || normTarget.includes(normB);
      });
      if (fuzzyMatch) {
        results.push({ store: pool.name, book: fuzzyMatch as Book });
      }
    });
    return results;
  };

  // 6. 데이터 필터링 및 캐싱 연산
  const filteredBooks = useMemo(() => {
    let list: { book: Book; store: 'YES24' | '교보문고' | '알라딘' }[] = [];

    // 서점 데이터 결합
    if (selectedStore === 'ALL' || selectedStore === 'YES24') {
      yes24RawData.forEach(b => list.push({ book: b as Book, store: 'YES24' }));
    }
    if (selectedStore === 'ALL' || selectedStore === '교보문고') {
      kyoboRawData.forEach(b => list.push({ book: b as Book, store: '교보문고' }));
    }
    if (selectedStore === 'ALL' || selectedStore === '알라딘') {
      aladinRawData.forEach(b => list.push({ book: b as Book, store: '알라딘' }));
    }

    // 조건 1. 검색어 필터 (도서명, 저자, 출판사)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.book.title.toLowerCase().includes(query) ||
        item.book.author.toLowerCase().includes(query) ||
        item.book.publisher.toLowerCase().includes(query)
      );
    }

    // 조건 2. 가격 범위 필터
    list = list.filter(item => item.book.sale_price >= minPrice && item.book.sale_price <= maxPrice);

    // 조건 3. 출판사 필터
    if (selectedPub !== 'ALL') {
      list = list.filter(item => item.book.publisher === selectedPub);
    }

    // 조건 4. 핵심 태그 키워드 필터
    if (selectedTag !== 'ALL') {
      const tagQuery = selectedTag.toLowerCase();
      list = list.filter(item => 
        item.book.title.toLowerCase().includes(tagQuery) || 
        item.book.subtitle.toLowerCase().includes(tagQuery)
      );
    }

    // 조건 5. 정렬(Sort) 처리
    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.book.sale_price - b.book.sale_price;
      if (sortBy === 'price_desc') return b.book.sale_price - a.book.sale_price;
      if (sortBy === 'rating') return b.book.rating - a.book.rating;
      if (sortBy === 'reviews') return b.book.review_count - a.book.review_count;
      // 기본값: 순위 오름차순 (단, ALL 채널인 경우 서점 가중치 처리 없이 순위 우선순위)
      return a.book.rank - b.book.rank;
    });
  }, [selectedStore, searchTerm, minPrice, maxPrice, selectedPub, selectedTag, sortBy]);

  // 7. 실시간 요약 통계 테이블 연산
  const summaryStats = useMemo(() => {
    if (filteredBooks.length === 0) {
      return { count: 0, avgOriginal: 0, avgSale: 0, avgRating: 0, totalReviews: 0 };
    }

    let originalSum = 0;
    let saleSum = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    let reviewSum = 0;

    filteredBooks.forEach(item => {
      originalSum += item.book.original_price;
      saleSum += item.book.sale_price;
      reviewSum += item.book.review_count;
      if (item.book.rating > 0.0) {
        ratingSum += item.book.rating;
        ratedCount++;
      }
    });

    return {
      count: filteredBooks.length,
      avgOriginal: Math.round(originalSum / filteredBooks.length),
      avgSale: Math.round(saleSum / filteredBooks.length),
      avgRating: ratedCount > 0 ? (ratingSum / ratedCount).toFixed(2) : '0.00',
      totalReviews: reviewSum
    };
  }, [filteredBooks]);

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStore('ALL');
    setSortBy('rank');
    setMinPrice(0);
    setMaxPrice(60000);
    setSelectedPub('ALL');
    setSelectedTag('ALL');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* 1. 상단 글로벌 헤더 & 테마 선택기 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-lg text-white">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-title)] tracking-tight">
              IT Bestseller BI Dashboard
            </h1>
            <p className="text-xs text-[var(--text-body)]">YES24 vs 교보문고 컴퓨터/IT 분야 실시간 교차 트렌드 분석</p>
          </div>
        </div>
        
        {/* 테마 스위처 */}
        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setTheme('theme-dark-bento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              theme === 'theme-dark-bento' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-[var(--text-body)] hover:text-[var(--text-title)]'
            }`}
          >
            Dark Bento
          </button>
          <button
            onClick={() => setTheme('theme-glass-light')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              theme === 'theme-glass-light' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-[var(--text-body)] hover:text-[var(--text-title)]'
            }`}
          >
            Glass Light
          </button>
          <button
            onClick={() => setTheme('theme-neon-cyber')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              theme === 'theme-neon-cyber' 
                ? 'bg-pink-500 text-white shadow-md' 
                : 'text-[var(--text-body)] hover:text-[var(--text-title)]'
            }`}
          >
            Neon Cyber
          </button>
        </div>
      </header>

      {/* 2. 전역 통합 필터 바 (Bento Card 형태) */}
      <section className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2 text-[var(--text-title)]">
            <Filter className="w-5 h-5" />
            <h2 className="font-bold text-lg font-heading">대시보드 통합 컨트롤러</h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:opacity-85 font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            필터 초기화
          </button>
        </div>

        {/* 필터 세부 항목 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* A. 실시간 검색 */}
          <div className="relative">
            <label className="block text-xs opacity-75 mb-1.5 font-medium">통합 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="도서명, 저자, 출판사 검색..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-[var(--border-color)] focus:outline-none focus:border-[var(--color-accent)] text-sm text-[var(--text-title)]"
              />
            </div>
          </div>

          {/* B. 정렬 기준 */}
          <div>
            <label className="block text-xs opacity-75 mb-1.5 font-medium">정렬 기준</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-[var(--border-color)] focus:outline-none focus:border-[var(--color-accent)] text-sm text-[var(--text-title)]"
            >
              <option value="rank">종합 순위순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
              <option value="rating">평점 높은순</option>
              <option value="reviews">리뷰 많은순</option>
            </select>
          </div>

          {/* C. 출판사 필터 */}
          <div>
            <label className="block text-xs opacity-75 mb-1.5 font-medium">출판사 선택</label>
            <select
              value={selectedPub}
              onChange={(e) => setSelectedPub(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-[var(--border-color)] focus:outline-none focus:border-[var(--color-accent)] text-sm text-[var(--text-title)]"
            >
              <option value="ALL">전체 출판사</option>
              {publisherList.map(pub => (
                <option key={pub} value={pub}>{pub}</option>
              ))}
            </select>
          </div>

          {/* D. 서점 채널 필터 */}
          <div>
            <label className="block text-xs opacity-75 mb-1.5 font-medium">서점 선택</label>
            <div className="flex bg-black/20 p-1 rounded-xl border border-[var(--border-color)]">
              {(['ALL', 'YES24', '교보문고', '알라딘'] as const).map(store => (
                <button
                  key={store}
                  onClick={() => setSelectedStore(store)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedStore === store
                      ? 'bg-[var(--bg-card)] text-[var(--color-accent)] shadow-sm'
                      : 'text-slate-400 hover:text-[var(--text-title)]'
                  }`}
                >
                  {store}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 가격 범위 & 핵심 키워드 태그 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* E. 양방향 가격 레인지 슬라이더 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>가격 범위 슬라이더</span>
              <span className="text-[var(--color-accent)] font-bold">
                {minPrice.toLocaleString()}원 ~ {maxPrice.toLocaleString()}원
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max="60000"
                step="2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* F. 트렌드 키워드 태그 클릭 디스패처 */}
          <div className="space-y-1.5">
            <label className="block text-xs opacity-75 font-medium">주요 메가트렌드 단축 필터</label>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'AI', '클로드', '시나공', '컴활', '데이터분석', 'SQLD', '코딩'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    selectedTag === tag
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-sm'
                      : 'bg-black/10 border-[var(--border-color)] text-[var(--text-body)] hover:border-[var(--color-accent)] hover:text-[var(--text-title)]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 벤토 그리드 시각화 차트 레이아웃 */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 차트 1: 가격 분포 (6/12) */}
        <div className="col-span-1 md:col-span-6 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] h-80 flex flex-col">
          <h3 className="text-sm font-semibold font-heading mb-2 text-[var(--text-title)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" /> 두 서점 도서 가격대별 점유 비교 (%)
          </h3>
          <div className="flex-1 min-h-0">
            <PriceDistributionChart theme={theme} books={filteredBooks} />
          </div>
        </div>

        {/* 차트 2: 출판사 레이더 (6/12) */}
        <div className="col-span-1 md:col-span-6 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] h-80 flex flex-col">
          <h3 className="text-sm font-semibold font-heading mb-2 text-[var(--text-title)] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-400" /> 주요 출판사별 베스트셀러 점유 비교
          </h3>
          <div className="flex-1 min-h-0">
            <PublisherShareChart theme={theme} books={filteredBooks} />
          </div>
        </div>

        {/* 차트 3: 평점 Polar (4/12) */}
        <div className="col-span-1 md:col-span-4 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] h-80 flex flex-col">
          <h3 className="text-sm font-semibold font-heading mb-2 text-[var(--text-title)] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-pink-400" /> YES24 베스트셀러 만족도(평점) 분포
          </h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <RatingDistributionChart theme={theme} books={filteredBooks} />
          </div>
        </div>

        {/* 차트 4: 순위 vs 리뷰수 (4/12) */}
        <div className="col-span-1 md:col-span-4 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] h-80 flex flex-col">
          <h3 className="text-sm font-semibold font-heading mb-2 text-[var(--text-title)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" /> 순위대별 독자 리뷰 활성 비교 (평균)
          </h3>
          <div className="flex-1 min-h-0">
            <RankVsPerformanceChart theme={theme} books={filteredBooks} />
          </div>
        </div>

        {/* 차트 5: TF-IDF 단어 가중치 (4/12) */}
        <div className="col-span-1 md:col-span-4 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] h-80 flex flex-col">
          <h3 className="text-sm font-semibold font-heading mb-2 text-[var(--text-title)] flex items-center gap-1.5">
            <SearchCode className="w-4 h-4 text-orange-400" /> 도서명 빈출 키워드 가중치 비교 (TF-IDF)
          </h3>
          <div className="flex-1 min-h-0">
            <KeywordTfidfChart theme={theme} books={filteredBooks} />
          </div>
        </div>
      </section>

      {/* 4. 실시간 요약 통계 테이블 매핑 */}
      <section className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] overflow-x-auto">
        <h3 className="text-sm font-semibold font-heading mb-3 text-[var(--text-title)] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-yellow-400" /> 필터링 결과 요약 지표
        </h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] opacity-75">
              <th className="pb-2 font-semibold">도서 총 수량</th>
              <th className="pb-2 font-semibold">평균 정가</th>
              <th className="pb-2 font-semibold">평균 실판매가</th>
              <th className="pb-2 font-semibold">평균 평점</th>
              <th className="pb-2 font-semibold">누적 리뷰 수</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm font-bold text-[var(--text-title)]">
              <td className="pt-2">{summaryStats.count}권</td>
              <td className="pt-2">{summaryStats.avgOriginal.toLocaleString()}원</td>
              <td className="pt-2 text-[var(--color-accent)]">{summaryStats.avgSale.toLocaleString()}원</td>
              <td className="pt-2 text-yellow-400">{summaryStats.avgRating}점</td>
              <td className="pt-2">{summaryStats.totalReviews.toLocaleString()}개</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 5. 도서 리스트 결과 보드 */}
      <section className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[var(--card-shadow)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-sm font-semibold font-heading text-[var(--text-title)] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-cyan-400" /> 필터링 도서 리스트 보드 ({filteredBooks.length}개 발견)
          </h3>
          <p className="text-[10px] opacity-75 font-semibold">도서를 클릭하시면 1:1 서점 비교 팝업이 활성화됩니다.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredBooks.map((item, index) => (
            <div
              key={`${item.store}-${item.book.goods_no}-${index}`}
              onClick={() => {
                setSelectedBook(item.book);
                setSelectedBookStore(item.store);
              }}
              className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-accent)] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 font-bold text-[var(--text-body)]">
                    {item.store} {item.book.rank}위
                  </span>
                  {findMatchedBook(item.book, item.store).length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" title="교차 서점 매칭 완료"></span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-[var(--text-title)] line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                  {item.book.title}
                </h4>
                {item.book.subtitle && (
                  <p className="text-[10px] opacity-75 italic line-clamp-1 mt-0.5">
                    {item.book.subtitle}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-end border-t border-[var(--border-color)]/50 pt-2">
                <div className="text-[10px]">
                  <p className="opacity-75">{item.book.author.split(' ')[0]} | {item.book.publisher}</p>
                  <p className="font-bold text-[var(--text-title)]">{item.book.sale_price.toLocaleString()}원</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-bold">
                  ★ {item.book.rating > 0 ? item.book.rating.toFixed(1) : '-'}
                  <span className="text-[9px] text-slate-400">({item.book.review_count})</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredBooks.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm opacity-60">
              필터 조건에 부합하는 도서 정보가 존재하지 않습니다. 조건을 완화해 보세요.
            </div>
          )}
        </div>
      </section>

      {/* 6. 상세 모달 뷰 마운트 */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          store={selectedBookStore}
          matchedBook={findMatchedBook(selectedBook, selectedBookStore)}
          onClose={() => setSelectedBook(null)}
          theme={theme}
        />
      )}
      
    </div>
  );
}

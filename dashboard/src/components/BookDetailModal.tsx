import React from 'react';
import { X, BookOpen, Star, MessageSquare, Award, Coins } from 'lucide-react';

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

interface BookDetailModalProps {
  book: Book;
  store: 'YES24' | '교보문고';
  matchedBook: Book | null;
  onClose: () => void;
  theme: string;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  store,
  matchedBook,
  onClose,
  theme
}) => {
  // 테마에 따른 스타일 클래스 정의
  const getThemeModalClass = () => {
    switch (theme) {
      case 'theme-neon-cyber':
        return 'bg-[#0e0e1a] border-2 border-[#ff007f] text-[#00ffff] shadow-[0_0_20px_rgba(255,0,127,0.5)]';
      case 'theme-glass-light':
        return 'backdrop-blur-xl bg-white/70 border border-white/60 text-[#1e1b4b] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]';
      case 'theme-dark-bento':
      default:
        return 'bg-[#1e293b] border border-[#334155] text-slate-100 shadow-2xl';
    }
  };

  const getSubtextClass = () => {
    return theme === 'theme-glass-light' ? 'text-indigo-600' : 'text-slate-400';
  };

  const getBadgeClass = () => {
    switch (theme) {
      case 'theme-neon-cyber':
        return 'bg-[#ff007f]/20 border border-[#ff007f] text-[#ff007f]';
      case 'theme-glass-light':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-4xl rounded-2xl p-6 ${getThemeModalClass()} max-h-[90vh] overflow-y-auto`}>
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 상단 도서 기본 헤더 */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-lg ${getBadgeClass()}`}>
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex gap-2 items-center mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass()}`}>
                {store} 베스트 {book.rank}위
              </span>
              {matchedBook && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500 text-emerald-400">
                  양대 서점 교차 매칭 도서
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold font-heading mb-1 leading-snug">{book.title}</h2>
            {book.subtitle && <p className={`text-sm italic ${getSubtextClass()}`}>{book.subtitle}</p>}
          </div>
        </div>

        {/* 바디 영역 - 그리드 구성 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 도서 메타데이터 카드 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-heading border-b pb-2">기본 정보</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-75">저자</p>
                <p className="font-semibold">{book.author}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">출판사</p>
                <p className="font-semibold">{book.publisher}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">출판일</p>
                <p className="font-semibold">{book.publish_date}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">상품 번호</p>
                <p className="font-semibold">{book.goods_no}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                <Coins className="w-5 h-5 mb-1 opacity-70" />
                <p className="text-[11px] opacity-75">실판매가</p>
                <p className="font-bold text-sm">{book.sale_price.toLocaleString()}원</p>
                <p className="text-[10px] opacity-60">({book.discount_rate} 할인)</p>
              </div>
              
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                <Star className="w-5 h-5 mb-1 text-yellow-400 opacity-90" />
                <p className="text-[11px] opacity-75">독자 평점</p>
                <p className="font-bold text-sm">{book.rating > 0 ? `${book.rating} / 10.0` : '평가 없음'}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                <MessageSquare className="w-5 h-5 mb-1 opacity-70" />
                <p className="text-[11px] opacity-75">리뷰 수</p>
                <p className="font-bold text-sm">{book.review_count}개</p>
              </div>
            </div>
          </div>

          {/* 1:1 서점 비교 뷰 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-heading border-b pb-2">양대 서점 비교 통계</h3>
            
            {matchedBook ? (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                
                {/* 1. 순위 비교 */}
                <div>
                  <p className="text-xs opacity-70 mb-1">베스트셀러 순위 비교</p>
                  <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-sm">
                    <div>
                      <span className="font-semibold text-slate-300">YES24:</span>{' '}
                      <span className="font-bold text-indigo-400">
                        {store === 'YES24' ? book.rank : matchedBook.rank}위
                      </span>
                    </div>
                    <div className="w-px h-4 bg-white/15"></div>
                    <div>
                      <span className="font-semibold text-slate-300">교보문고:</span>{' '}
                      <span className="font-bold text-pink-400">
                        {store === '교보문고' ? book.rank : matchedBook.rank}위
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-1 text-right italic opacity-75">
                    순위 편차:{' '}
                    <span className="font-bold">
                      {Math.abs(book.rank - matchedBook.rank)}위
                    </span>{' '}
                    ({book.rank < matchedBook.rank ? store : (store === 'YES24' ? '교보문고' : 'YES24')} 우위)
                  </p>
                </div>

                {/* 2. 가격 차이 비교 */}
                <div>
                  <p className="text-xs opacity-70 mb-1">실구매가격 비교</p>
                  <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-sm">
                    <div>
                      <span className="font-semibold text-slate-300">YES24:</span>{' '}
                      <span className="font-bold">
                        {(store === 'YES24' ? book.sale_price : matchedBook.sale_price).toLocaleString()}원
                      </span>
                    </div>
                    <div className="w-px h-4 bg-white/15"></div>
                    <div>
                      <span className="font-semibold text-slate-300">교보문고:</span>{' '}
                      <span className="font-bold">
                        {(store === '교보문고' ? book.sale_price : matchedBook.sale_price).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  {book.sale_price !== matchedBook.sale_price ? (
                    <p className="text-xs mt-1 text-right text-emerald-400 font-semibold">
                      차액: {Math.abs(book.sale_price - matchedBook.sale_price).toLocaleString()}원 더 저렴함 (
                      {book.sale_price < matchedBook.sale_price ? store : (store === 'YES24' ? '교보문고' : 'YES24')} 기준)
                    </p>
                  ) : (
                    <p className="text-xs mt-1 text-right opacity-60">두 서점의 유통 판매가가 일치합니다.</p>
                  )}
                </div>

                {/* 3. 독자 평가 비교 */}
                <div>
                  <p className="text-xs opacity-70 mb-1">평점 및 독자 서평 수 비교</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/20 p-2 rounded">
                      <p className="opacity-70 font-semibold mb-1">YES24 만족도</p>
                      <p>평점: <span className="font-bold text-yellow-400">{(store === 'YES24' ? book.rating : matchedBook.rating)}점</span></p>
                      <p>서평: <span className="font-bold">{(store === 'YES24' ? book.review_count : matchedBook.review_count)}개</span></p>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <p className="opacity-70 font-semibold mb-1">교보문고 만족도</p>
                      <p>평점: <span className="font-bold text-yellow-400">{(store === '교보문고' ? book.rating : matchedBook.rating)}점</span></p>
                      <p>서평: <span className="font-bold">{(store === '교보문고' ? book.review_count : matchedBook.review_count)}개</span></p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-8 bg-white/5 rounded-xl border border-white/10 border-dashed text-center">
                <Award className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-semibold opacity-85">독립 순위 도서</p>
                <p className="text-xs opacity-70 mt-1">본 도서는 해당 서점의 순위권(YES24 1,000위 / 교보문고 100위)에만 단독 랭크되어 매칭되지 않았습니다.</p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

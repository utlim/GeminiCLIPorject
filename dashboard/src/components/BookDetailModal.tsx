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

interface MatchedBookInfo {
  store: 'YES24' | '교보문고' | '알라딘';
  book: Book;
}

interface BookDetailModalProps {
  book: Book;
  store: 'YES24' | '교보문고' | '알라딘';
  matchedBook: MatchedBookInfo[];
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
              {matchedBook.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500 text-emerald-400 animate-pulse">
                  3대 서점 교차 매칭 완료 ({matchedBook.length + 1}개 서점)
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-heading mb-1 leading-snug">{book.title}</h2>
            {book.subtitle && <p className={`text-xs italic ${getSubtextClass()}`}>{book.subtitle}</p>}
          </div>
        </div>

        {/* 바디 영역 - 그리드 구성 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 도서 메타데이터 카드 */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-heading border-b border-[var(--border-color)] pb-2 flex items-center gap-1">
              <span>📖</span> 도서 상세 정보
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
              <div>
                <p className="text-[10px] opacity-75">저자</p>
                <p className="font-semibold text-[var(--text-title)]">{book.author}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-75">출판사</p>
                <p className="font-semibold text-[var(--text-title)]">{book.publisher}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-75">출판일</p>
                <p className="font-semibold text-[var(--text-title)]">{book.publish_date}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-75">상품 번호</p>
                <p className="font-semibold text-[var(--text-title)]">{book.goods_no}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 flex flex-col items-center">
                <Coins className="w-4 h-4 mb-1 opacity-70" />
                <p className="text-[10px] opacity-75">실판매가</p>
                <p className="font-bold text-xs text-[var(--color-accent)]">{book.sale_price.toLocaleString()}원</p>
                <p className="text-[9px] opacity-60">({book.discount_rate} 할인)</p>
              </div>
              
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 flex flex-col items-center">
                <Star className="w-4 h-4 mb-1 text-yellow-400 opacity-90" />
                <p className="text-[10px] opacity-75">독자 평점</p>
                <p className="font-bold text-xs text-yellow-400">{book.rating > 0 ? `${book.rating}점` : '평가 없음'}</p>
              </div>

              <div className="p-3 bg-black/25 rounded-xl border border-white/5 flex flex-col items-center">
                <MessageSquare className="w-4 h-4 mb-1 opacity-70" />
                <p className="text-[10px] opacity-75">리뷰 수</p>
                <p className="font-bold text-xs text-[var(--text-title)]">{book.review_count}개</p>
              </div>
            </div>
          </div>

          {/* 1:1 서점 비교 뷰 */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-heading border-b border-[var(--border-color)] pb-2 flex items-center gap-1">
              <span>🔍</span> 3대 온라인 서점 비교 통계
            </h3>
            
            {matchedBook.length > 0 ? (
              <div className="space-y-4">
                {/* 3사 가격/순위 동시비교 테이블 */}
                <div className="p-4 bg-black/25 rounded-xl border border-white/5 space-y-3 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 opacity-75">
                        <th className="pb-1.5 font-semibold">서점 채널</th>
                        <th className="pb-1.5 font-semibold text-center">순위</th>
                        <th className="pb-1.5 font-semibold text-right">실구매가</th>
                        <th className="pb-1.5 font-semibold text-center">평점</th>
                        <th className="pb-1.5 font-semibold text-center">리뷰</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 1. 현재 서점 정보 */}
                      <tr className="border-b border-white/5 font-bold text-[var(--color-accent)]">
                        <td className="py-2">{store} (기준)</td>
                        <td className="py-2 text-center">{book.rank}위</td>
                        <td className="py-2 text-right">{book.sale_price.toLocaleString()}원</td>
                        <td className="py-2 text-center text-yellow-400">{book.rating > 0 ? book.rating.toFixed(1) : '-'}</td>
                        <td className="py-2 text-center opacity-75">{book.review_count}</td>
                      </tr>
                      {/* 2. 매칭된 타 서점 정보들 */}
                      {matchedBook.map((item, idx) => (
                        <tr key={idx} className="border-b border-white/5 opacity-90 text-[var(--text-title)]">
                          <td className="py-2">{item.store}</td>
                          <td className="py-2 text-center">{item.book.rank}위</td>
                          <td className="py-2 text-right">{item.book.sale_price.toLocaleString()}원</td>
                          <td className="py-2 text-center text-yellow-400">{item.book.rating > 0 ? item.book.rating.toFixed(1) : '-'}</td>
                          <td className="py-2 text-center opacity-75">{item.book.review_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* 알뜰 구매 팁 제공 */}
                  {matchedBook.length > 0 && (
                    <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-[10px] text-emerald-400">
                      💡 <strong>최저가 비교 분석:</strong>{' '}
                      {(() => {
                        const allPrices = [
                          { store, price: book.sale_price },
                          ...matchedBook.map(m => ({ store: m.store, price: m.book.sale_price }))
                        ];
                        const sorted = allPrices.sort((a, b) => a.price - b.price);
                        const isSame = sorted[0].price === sorted[sorted.length - 1].price;
                        if (isSame) {
                          return '3개 서점의 판매 가격이 동일합니다.';
                        } else {
                          return `현재 "${sorted[0].store}"에서 가장 저렴하게 (${sorted[0].price.toLocaleString()}원) 판매하고 있습니다.`;
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-8 bg-black/25 rounded-xl border border-white/5 border-dashed text-center">
                <Award className="w-12 h-12 mb-2 opacity-50 text-[var(--color-accent)]" />
                <p className="text-sm font-semibold opacity-85 text-[var(--text-title)]">독립 순위 도서</p>
                <p className="text-xs opacity-70 mt-1 max-w-[280px] leading-relaxed">
                  본 도서는 {store}의 베스트셀러 순위권에만 단독 랭크되어 다른 온라인 서점에 매칭되지 않은 독립 상품입니다.
                </p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

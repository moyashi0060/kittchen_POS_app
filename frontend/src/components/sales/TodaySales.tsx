import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, Receipt } from "lucide-react";
import { salesApi } from "@/api/client";

export default function TodaySales() {
  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['sales', 'today'],
    queryFn: () => salesApi.getToday(),
    refetchInterval: 30000, // 30秒ごとに自動更新
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center justify-center h-24">
            <div className="text-white/70">読み込み中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
        <CardContent className="p-6">
          <div className="text-center text-white/70">
            売上データを取得できませんでした
          </div>
        </CardContent>
      </Card>
    );
  }

  const { total_sales = 0, total_items = 0, order_count = 0, date } = salesData || {};

  // 日付をフォーマット
  const formattedDate = date ? new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '本日';

  return (
    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          本日の売上
        </CardTitle>
        <p className="text-sm text-white/80">{formattedDate}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-4xl font-bold mb-4">
          ¥{total_sales.toLocaleString()}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
            <Receipt className="w-5 h-5" />
            <div>
              <p className="text-xs text-white/80">注文数</p>
              <p className="text-lg font-semibold">{order_count}件</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
            <ShoppingBag className="w-5 h-5" />
            <div>
              <p className="text-xs text-white/80">販売数</p>
              <p className="text-lg font-semibold">{total_items}個</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

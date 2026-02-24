import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ClipboardList,
  Menu,
  Check,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Product,
  ProductCategory,
  OrderItem,
  productsApi,
  ordersApi,
  CreateOrderData,
  CreateProductData,
} from "@/api/client";
import CartPreview from "./CartPreview";
import OrderConfirmPopup from "./OrderConfirmPopup";
import OrdersListPopup from "./OrdersListPopup";
import ProductForm from "@/components/products/ProductForm";
import TodaySales from "@/components/sales/TodaySales";

// カテゴリ定義
const CATEGORIES: { key: ProductCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "すべて", icon: "📋" },
  { key: "food", label: "フード", icon: "🍔" },
  { key: "drink", label: "ドリンク", icon: "🥤" },
  { key: "set", label: "セット", icon: "🍱" },
  { key: "other", label: "その他", icon: "📦" },
];

export default function POSScreen() {
  const queryClient = useQueryClient();
  
  // State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string>("");
  
  // スワイプ用State
  const [currentPage, setCurrentPage] = useState(0); // 0: POS画面, 1: 売上画面
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  // Data fetching
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list("-created_date", 100),
    refetchInterval: 10000,
  });

  // 今日の未完了注文数をカウント
  const pendingOrdersCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return orders.filter(
      (o) =>
        o.created_date?.startsWith(today) &&
        (o.status === "pending" || o.status === "preparing")
    ).length;
  }, [orders]);

  // 次の注文番号を生成（今日の連番）
  const generateOrderNumber = () => {
    const today = new Date().toISOString().split("T")[0];
    const todaysOrders = orders.filter((o) => o.created_date?.startsWith(today));
    const nextNumber = todaysOrders.length + 1;
    return String(nextNumber).padStart(3, "0");
  };

  // 発注処理
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      return ordersApi.create(orderData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setConfirmedOrderNumber(variables.order_number || "");
      setShowOrderConfirm(true);
      setCart([]);
    },
  });

  // 商品追加処理
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductData) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowProductForm(false);
    },
  });

  // カート操作
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          image_url: product.image_url,
          quantity: 1,
          price: product.price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is OrderItem => item !== null)
    );
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("カートを空にしますか？")) {
      setCart([]);
    }
  };

  // 発注
  const handleOrder = () => {
    if (cart.length === 0) return;
    const orderNumber = generateOrderNumber();
    const totalAmount = cart.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
    createOrderMutation.mutate({
      items: cart,
      order_number: orderNumber,
      status: "pending",
      total_amount: totalAmount,
    });
  };

  // フィルタリング
  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter((p) => p.is_active);
    if (selectedCategory === "all") return activeProducts;
    return activeProducts.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // 合計計算
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // スワイプハンドラー
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      // 左スワイプ → 売上画面へ
      setCurrentPage(1);
    } else if (offset > threshold || velocity > 500) {
      // 右スワイプ → POS画面へ
      setCurrentPage(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* ページインジケーター */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        <div 
          className={`w-2 h-2 rounded-full transition-colors ${currentPage === 0 ? 'bg-orange-500' : 'bg-gray-300'}`}
          onClick={() => setCurrentPage(0)}
        />
        <div 
          className={`w-2 h-2 rounded-full transition-colors ${currentPage === 1 ? 'bg-orange-500' : 'bg-gray-300'}`}
          onClick={() => setCurrentPage(1)}
        />
      </div>

      {/* スワイプ可能なコンテナ */}
      <motion.div
        ref={containerRef}
        className="flex h-full min-h-screen"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: currentPage === 0 ? "0vw" : "-100vw" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ x: dragX, width: "200vw" }}
      >
        {/* ページ1: POS画面 */}
        <div className="min-h-screen flex flex-col" style={{ width: "100vw" }}>
          {/* ヘッダー */}
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* 左側: メニューボタン */}
            <button className="p-2 rounded-lg hover:bg-white/20 transition">
              <Menu className="w-7 h-7" />
            </button>

            {/* 中央: タイトル */}
            <div className="text-center">
              <h1 className="text-xl font-bold">KitchPad</h1>
              <p className="text-xs text-orange-100">キッチンカー注文管理</p>
            </div>

            {/* 右側: アイコン群 */}
            <div className="flex items-center gap-2">
              {/* 注文確認アイコン */}
              <button
                onClick={() => setShowOrdersList(true)}
                className="relative p-2 rounded-lg hover:bg-white/20 transition"
              >
                <ClipboardList className="w-7 h-7" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              {/* カートアイコン */}
              <button
                onClick={() => setShowCartPreview(true)}
                className="relative p-2 rounded-lg hover:bg-white/20 transition"
              >
                <ShoppingCart className="w-7 h-7" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* 商品管理（一覧・編集） */}
              <Link to="/products">
                <button className="p-2 rounded-lg hover:bg-white/20 transition" title="商品管理">
                  <Package className="w-6 h-6" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* カテゴリタブ */}
        <div className="px-2 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-white text-orange-600 shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* メニュー一覧 */}
      <main className="flex-1 overflow-auto pb-32">
        <div className="p-4 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">商品がありません</p>
              <Link to="/products" className="text-orange-500 underline mt-2 block">
                商品を追加する
              </Link>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const cartItem = cart.find((c) => c.product_id === product.id);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="flex items-center p-4 gap-4">
                    {/* 商品画像 */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {CATEGORIES.find((c) => c.key === product.category)?.icon || "📦"}
                        </div>
                      )}
                    </div>

                    {/* 商品情報 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-800 truncate">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {product.description}
                        </p>
                      )}
                      <p className="text-xl font-bold text-orange-600 mt-1">
                        ¥{(product.price || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* 数量コントロール */}
                    <div className="flex-shrink-0">
                      {cartItem ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition active:scale-95"
                          >
                            <Minus className="w-5 h-5 text-gray-600" />
                          </button>
                          <span className="w-10 text-center text-xl font-bold text-gray-800">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition active:scale-95"
                          >
                            <Plus className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-14 h-14 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition active:scale-95 shadow-lg"
                        >
                          <Plus className="w-7 h-7 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* フッター: 合計金額 & 発注ボタン (POS画面のみ表示) */}
      {currentPage === 0 && (
      <div className="fixed bottom-0 left-0 bg-white border-t-2 border-gray-200 shadow-2xl z-30" style={{ width: "100vw" }}>
        <div className="p-4">
          {/* 合計表示 */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-lg">合計</span>
              {totalItems > 0 && (
                <Badge variant="secondary" className="text-sm px-2 py-1">
                  {totalItems}点
                </Badge>
              )}
            </div>
            <span className="text-3xl font-bold text-gray-800">
              ¥{totalAmount.toLocaleString()}
            </span>
          </div>

          {/* 発注ボタン */}
          <div className="flex gap-3">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition active:scale-95"
              >
                <Trash2 className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <button
              onClick={handleOrder}
              disabled={cart.length === 0 || createOrderMutation.isPending}
              className={`flex-1 h-14 rounded-xl text-xl font-bold transition active:scale-[0.98] flex items-center justify-center gap-2 ${
                cart.length > 0
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {createOrderMutation.isPending ? (
                <span className="animate-pulse">処理中...</span>
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  発注
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}

        </div>

        {/* ページ2: 売上画面 */}
        <div className="min-h-screen flex flex-col bg-gray-50" style={{ width: "100vw" }}>
          {/* 売上画面ヘッダー */}
          <header className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg sticky top-0 z-40">
            <div className="px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="w-10" /> {/* スペーサー */}
                <div className="text-center">
                  <h1 className="text-xl font-bold">📊 売上サマリー</h1>
                  <p className="text-xs text-green-100">本日の売上状況</p>
                </div>
                <div className="w-10" /> {/* スペーサー */}
              </div>
            </div>
          </header>

          {/* 売上コンテンツ */}
          <main className="flex-1 p-4">
            <TodaySales />
            
            {/* スワイプヒント */}
            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>← 右にスワイプして注文画面へ</p>
            </div>
          </main>
        </div>
      </motion.div>

      {/* カートプレビュー */}
      <AnimatePresence>
        {showCartPreview && (
          <CartPreview
            cart={cart}
            totalAmount={totalAmount}
            onUpdateQuantity={updateQuantity}
            onClearCart={clearCart}
            onOrder={handleOrder}
            onClose={() => setShowCartPreview(false)}
            isOrdering={createOrderMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* 発注完了ポップアップ */}
      <AnimatePresence>
        {showOrderConfirm && (
          <OrderConfirmPopup
            orderNumber={confirmedOrderNumber}
            onClose={() => setShowOrderConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* 注文一覧ポップアップ */}
      <AnimatePresence>
        {showOrdersList && (
          <OrdersListPopup
            onClose={() => setShowOrdersList(false)}
          />
        )}
      </AnimatePresence>

      {/* 商品追加フォーム */}
      <AnimatePresence>
        {showProductForm && (
          <ProductForm
            onSubmit={(data) => createProductMutation.mutate(data)}
            onCancel={() => setShowProductForm(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB - 商品追加ボタン (POS画面用) */}
      {currentPage === 0 && (
        <motion.button
          onClick={() => setShowProductForm(true)}
          className="fixed right-4 bottom-28 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg flex items-center justify-center z-50"
          style={{
            boxShadow: "0 4px 14px 0 rgba(249, 115, 22, 0.4)",
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 6px 20px 0 rgba(249, 115, 22, 0.5)",
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}

import { motion } from "framer-motion";
import { X, Trash2, Plus, Minus, Check, ShoppingCart } from "lucide-react";
import { OrderItem } from "@/api/client";

interface CartPreviewProps {
  cart: OrderItem[];
  totalAmount: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onOrder: () => void;
  onClose: () => void;
  isOrdering: boolean;
}

export default function CartPreview({
  cart,
  totalAmount,
  onUpdateQuantity,
  onClearCart,
  onOrder,
  onClose,
  isOrdering,
}: CartPreviewProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrder = () => {
    onOrder();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-800">カート</h2>
            <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-2 py-0.5 rounded-full">
              {totalItems}点
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* カート内容 */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg">カートは空です</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {                return (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                  >
                    {/* 画像 */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* 商品情報 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.product_name}
                      </h3>
                      <p className="text-orange-600 font-bold">
                        ¥{((item.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    {/* 数量コントロール */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQuantity(item.product_id, -1)}
                        className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition active:scale-95"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-lg font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product_id, 1)}
                        className="w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition active:scale-95"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t p-4 space-y-3">
          {/* 合計 */}
          <div className="flex justify-between items-center">
            <span className="text-lg text-gray-600">合計</span>
            <span className="text-2xl font-bold text-gray-800">
              ¥{totalAmount.toLocaleString()}
            </span>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            {cart.length > 0 && (
              <button
                onClick={() => {
                  onClearCart();
                }}
                className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition active:scale-95 group"
              >
                <Trash2 className="w-6 h-6 text-gray-500 group-hover:text-red-500" />
              </button>
            )}
            <button
              onClick={handleOrder}
              disabled={cart.length === 0 || isOrdering}
              className={`flex-1 h-14 rounded-xl text-xl font-bold transition active:scale-[0.98] flex items-center justify-center gap-2 ${
                cart.length > 0
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isOrdering ? (
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
      </motion.div>
    </motion.div>
  );
}

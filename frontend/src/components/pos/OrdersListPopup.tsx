import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Clock,
  CheckCircle,
  ChefHat,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ordersApi, Order } from "@/api/client";

interface OrdersListPopupProps {
  onClose: () => void;
}

const statusConfig = {
  pending: {
    label: "受付中",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    bgColor: "bg-orange-50",
    icon: Clock,
  },
  preparing: {
    label: "調理中",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    bgColor: "bg-blue-50",
    icon: ChefHat,
  },
  completed: {
    label: "提供済み",
    color: "bg-green-100 text-green-700 border-green-300",
    bgColor: "bg-green-50",
    icon: CheckCircle,
  },
  cancelled: {
    label: "キャンセル",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    bgColor: "bg-gray-50",
    icon: XCircle,
  },
};

export default function OrdersListPopup({ onClose }: OrdersListPopupProps) {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list("-created_date", 50),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
      ordersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // 今日の注文のみフィルタリング
  const todaysOrders = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return orders.filter((o) => o.created_date?.startsWith(today));
  }, [orders]);

  const handleStatusChange = (order: Order, newStatus: Order["status"]) => {
    updateOrderMutation.mutate({
      id: order.id,
      data: { status: newStatus },
    });
  };

  const handleDelete = (order: Order) => {
    if (window.confirm(`注文 #${order.order_number} を削除しますか？`)) {
      deleteOrderMutation.mutate(order.id);
    }
  };

  // ステータスの次のアクションを取得
  const getNextAction = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return { label: "調理開始", status: "preparing" as const, icon: ChefHat };
      case "preparing":
        return { label: "提供完了", status: "completed" as const, icon: CheckCircle };
      default:
        return null;
    }
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
        className="bg-gray-100 rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-800">本日の注文</h2>
            <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-2 py-0.5 rounded-full">
              {todaysOrders.length}件
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 注文リスト */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-500">読み込み中...</p>
            </div>
          ) : todaysOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg">本日の注文はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysOrders.map((order) => {
                const config = statusConfig[order.status || "pending"];
                const StatusIcon = config.icon;
                const nextAction = getNextAction(order.status);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 ${
                      order.status === "pending" || order.status === "preparing"
                        ? "border-orange-200"
                        : "border-transparent"
                    }`}
                  >
                    {/* ヘッダー部分 */}
                    <div className={`px-4 py-3 ${config.bgColor}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-800">
                            #{order.order_number}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(
                              new Date(order.created_date),
                              "HH:mm",
                              { locale: ja }
                            )}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {config.label}
                        </div>
                      </div>
                    </div>

                    {/* 商品リスト */}
                    <div className="px-4 py-3">
                      <div className="text-sm text-gray-600 mb-3">
                        {order.items?.map((item, idx) => (
                          <span key={idx}>
                            {item.product_name} ×{item.quantity}
                            {idx < (order.items?.length || 0) - 1 && "、"}
                          </span>
                        ))}
                      </div>

                      {/* 金額表示 */}
                      {order.total_amount && (
                        <div className="text-right mb-3">
                          <span className="text-lg font-bold text-gray-800">
                            ¥{order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* アクションボタン */}
                      {(order.status === "pending" ||
                        order.status === "preparing") && (
                        <div className="flex gap-2">
                          {/* 削除ボタン */}
                          <button
                            onClick={() => handleDelete(order)}
                            className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition active:scale-95 group"
                          >
                            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                          </button>

                          {/* 次のステータスボタン */}
                          {nextAction && (
                            <button
                              onClick={() =>
                                handleStatusChange(order, nextAction.status)
                              }
                              disabled={updateOrderMutation.isPending}
                              className={`flex-1 h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                                nextAction.status === "preparing"
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : "bg-green-500 hover:bg-green-600"
                              }`}
                            >
                              <nextAction.icon className="w-5 h-5" />
                              {nextAction.label}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition active:scale-[0.98]"
          >
            閉じる
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

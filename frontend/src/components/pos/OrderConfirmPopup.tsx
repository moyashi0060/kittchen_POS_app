import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface OrderConfirmPopupProps {
  orderNumber: string;
  onClose: () => void;
}

export default function OrderConfirmPopup({
  orderNumber,
  onClose,
}: OrderConfirmPopupProps) {
  // 3秒後に自動で閉じる
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 成功アイコン */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
          className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-14 h-14 text-green-500" />
        </motion.div>

        {/* メッセージ */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-2">発注完了！</h2>
          <p className="text-gray-500 mb-4">注文を受け付けました</p>
        </motion.div>

        {/* 注文番号 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-4 px-6 mb-6"
        >
          <p className="text-sm text-orange-100 mb-1">注文番号</p>
          <p className="text-4xl font-bold">#{orderNumber}</p>
        </motion.div>

        {/* 閉じるボタン */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition active:scale-[0.98]"
        >
          閉じる
        </motion.button>

        {/* 自動で閉じるインジケーター */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 3, ease: "linear" }}
          className="h-1 bg-orange-400 rounded-full mt-4 origin-left"
        />
      </motion.div>
    </motion.div>
  );
}

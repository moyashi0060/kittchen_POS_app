import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, X, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, OrderItem } from "@/api/client";

interface NewOrderFormProps {
  products: Product[];
  onSubmit: (data: { items: OrderItem[]; notes: string }) => void;
  onCancel: () => void;
}

export default function NewOrderForm({ products, onSubmit, onCancel }: NewOrderFormProps) {
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");

  const addItem = (product: Product) => {
    const existing = selectedItems.find(item => item.product_id === product.id);
    if (existing) {
      setSelectedItems(selectedItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        product_id: product.id,
        product_name: product.name,
        image_url: product.image_url,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.product_id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter((item): item is OrderItem => item !== null));
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) return;
    onSubmit({ items: selectedItems, notes });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">新規注文</CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          {/* 商品選択 */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-700">商品を選択</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.filter(p => p.is_active).map(product => (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addItem(product)}
                  className="p-3 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all bg-white"
                >
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                  {product.price && (
                    <p className="text-xs text-gray-600">¥{product.price}</p>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 選択中の商品 */}
          {selectedItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                注文内容
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {selectedItems.map(item => (
                    <motion.div
                      key={item.product_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 bg-orange-50 rounded-lg p-3"
                    >
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.product_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.product_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* メモ */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-700">メモ・特記事項</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="アレルギー対応、カスタマイズなど..."
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>

        <div className="p-4 border-t bg-gray-50">
          <Button 
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg py-6"
          >
            注文を確定（{selectedItems.length}品目）
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

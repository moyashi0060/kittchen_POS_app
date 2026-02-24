import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { uploadApi, Product, CreateProductData, ProductCategory } from "@/api/client";

const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'food', label: 'フード', icon: '🍔' },
  { value: 'drink', label: 'ドリンク', icon: '🥤' },
  { value: 'set', label: 'セット', icon: '🍱' },
  { value: 'other', label: 'その他', icon: '📦' },
];

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductData) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductData>(product || {
    name: "",
    image_url: "",
    price: undefined,
    is_active: true,
    category: 'food',
    description: ""
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await uploadApi.uploadFile(file);
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      alert("画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex justify-between items-center">
            <CardTitle>{product ? "商品を編集" : "新規商品"}</CardTitle>
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

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">商品名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: ハンバーガー"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="price">価格（円）</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })}
                placeholder="500"
                className="mt-1"
              />
            </div>

            <div>
              <Label>カテゴリ *</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      formData.category === cat.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl">{cat.icon}</div>
                    <div className="text-xs mt-1">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>商品画像</Label>
              <div className="mt-2">
                {formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={formData.image_url} 
                      alt="商品画像"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <div className="text-gray-500">アップロード中...</div>
                      ) : (
                        <>
                          <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600">クリックして画像を選択</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {product ? "更新" : "追加"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

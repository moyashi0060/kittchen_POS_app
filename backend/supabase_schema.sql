-- Supabase SQLエディタで実行してください

-- 商品テーブル
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    price NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 注文テーブル
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL,
    items JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
    notes TEXT,
    total_amount NUMERIC,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- RLS (Row Level Security) を有効化
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 公開アクセス用のポリシー（認証なしでアクセス可能にする場合）
-- 本番環境では適切な認証を設定してください

CREATE POLICY "Allow public read access on products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on products" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on products" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on products" ON products
    FOR DELETE USING (true);

CREATE POLICY "Allow public read access on orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on orders" ON orders
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on orders" ON orders
    FOR DELETE USING (true);

-- Storage バケットの作成（Supabase Dashboardで手動で作成するか、以下のSQLを実行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

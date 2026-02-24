import os
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import uuid

# .envファイルを読み込み（スクリプトのディレクトリから）
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)

# Supabase設定
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

print(f"[DEBUG] SUPABASE_URL: {SUPABASE_URL[:30] if SUPABASE_URL else 'None'}...")
print(f"[DEBUG] SUPABASE_KEY: {'Set' if SUPABASE_KEY else 'None'}")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[DEBUG] Supabase client created successfully")
except Exception as e:
    print(f"[ERROR] Failed to create Supabase client: {e}")
    raise

# ファイルアップロード設定
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
UPLOAD_BUCKET = 'product_images'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# === 注文 API ===

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """注文一覧を取得"""
    try:
        sort = request.args.get('sort', '-created_date')
        limit = request.args.get('limit', 100, type=int)
        
        # ソート順を解析
        if sort.startswith('-'):
            order_column = sort[1:]
            ascending = False
        else:
            order_column = sort
            ascending = True
        
        response = supabase.table('orders') \
            .select('*') \
            .order(order_column, desc=not ascending) \
            .limit(limit) \
            .execute()
        
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders', methods=['POST'])
def create_order():
    """新規注文を作成"""
    try:
        data = request.get_json()
        
        # 必須フィールドの検証
        if not data.get('items'):
            return jsonify({'error': 'items is required'}), 400
        
        order_data = {
            'order_number': data.get('order_number', str(uuid.uuid4())[:8]),
            'items': data.get('items'),
            'status': data.get('status', 'pending'),
            'notes': data.get('notes', ''),
            'total_amount': data.get('total_amount'),
            'created_date': datetime.utcnow().isoformat()
        }
        
        response = supabase.table('orders').insert(order_data).execute()
        
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    """注文を更新"""
    try:
        data = request.get_json()
        
        response = supabase.table('orders') \
            .update(data) \
            .eq('id', order_id) \
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    """注文を削除"""
    try:
        response = supabase.table('orders') \
            .delete() \
            .eq('id', order_id) \
            .execute()
        
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === 商品 API ===

@app.route('/api/products', methods=['GET'])
def get_products():
    """商品一覧を取得"""
    try:
        response = supabase.table('products').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products', methods=['POST'])
def create_product():
    """新規商品を作成"""
    try:
        data = request.get_json()
        
        # 必須フィールドの検証
        if not data.get('name'):
            return jsonify({'error': 'name is required'}), 400
        if not data.get('category'):
            return jsonify({'error': 'category is required'}), 400
        
        product_data = {
            'name': data.get('name'),
            'image_url': data.get('image_url', ''),
            'price': data.get('price'),
            'is_active': data.get('is_active', True),
            'category': data.get('category'),
            'description': data.get('description', '')
        }
        
        response = supabase.table('products').insert(product_data).execute()
        
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    """商品を更新"""
    try:
        data = request.get_json()
        
        response = supabase.table('products') \
            .update(data) \
            .eq('id', product_id) \
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    """商品を削除"""
    try:
        response = supabase.table('products') \
            .delete() \
            .eq('id', product_id) \
            .execute()
        
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === ファイルアップロード API ===

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """ファイルをアップロード"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # ファイル名を安全な形式に変換
        filename = secure_filename(file.filename)
        # ユニークなファイル名を生成
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Supabase Storageにアップロード
        file_content = file.read()
        
        print(f"[DEBUG] Uploading file: {unique_filename}, size: {len(file_content)} bytes")
        print(f"[DEBUG] Content-Type: {file.content_type}")
        print(f"[DEBUG] Bucket: {UPLOAD_BUCKET}")
        
        try:
            response = supabase.storage.from_(UPLOAD_BUCKET).upload(
                unique_filename,
                file_content,
                file_options={"content-type": file.content_type}
            )
            print(f"[DEBUG] Upload response: {response}")
        except Exception as upload_error:
            print(f"[ERROR] Upload failed: {upload_error}")
            return jsonify({'error': f'Storage upload failed: {str(upload_error)}'}), 500
        
        # 公開URLを取得
        file_url = supabase.storage.from_(UPLOAD_BUCKET).get_public_url(unique_filename)
        print(f"[DEBUG] File URL: {file_url}")
        
        return jsonify({'file_url': file_url})
    except Exception as e:
        print(f"[ERROR] Upload error: {e}")
        return jsonify({'error': str(e)}), 500


# === ヘルスチェック ===

@app.route('/api/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})


# === 売上計算 API ===

@app.route('/api/sales/today', methods=['GET'])
def get_today_sales():
    """当日の売り上げを取得"""
    try:
        # 今日の日付範囲を計算（UTC）
        today = datetime.utcnow().date()
        start_of_day = datetime.combine(today, datetime.min.time()).isoformat()
        end_of_day = datetime.combine(today, datetime.max.time()).isoformat()
        
        # 今日の完了した注文を取得
        response = supabase.table('orders') \
            .select('*') \
            .gte('created_date', start_of_day) \
            .lte('created_date', end_of_day) \
            .eq('status', 'completed') \
            .execute()
        
        orders = response.data
        
        # 商品情報を取得（価格計算用）
        products_response = supabase.table('products').select('id, name, price').execute()
        products_map = {p['id']: p for p in products_response.data}
        
        # 売上計算
        total_sales = 0
        total_items = 0
        order_count = len(orders)
        
        for order in orders:
            items = order.get('items', [])
            for item in items:
                quantity = item.get('quantity', 0)
                product_id = item.get('product_id')
                
                # 商品価格を取得
                product = products_map.get(product_id, {})
                price = product.get('price', 0) or 0
                
                total_sales += price * quantity
                total_items += quantity
        
        return jsonify({
            'date': today.isoformat(),
            'total_sales': total_sales,
            'total_items': total_items,
            'order_count': order_count,
            'orders': orders
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

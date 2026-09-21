import json
import re

# Read color mapping
with open('insert_colors.sql', 'r', encoding='utf-8') as f:
    sql_colors = f.read()

color_map = {}
for line in sql_colors.split('\n'):
    line = line.strip()
    if line.startswith("('col_"):
        # e.g. ('col_a63...', 'Hitam'),
        match = re.search(r"\('([^']+)',\s*'([^']+)'\)", line)
        if match:
            col_id = match.group(1)
            col_name = match.group(2)
            color_map[col_name.strip().lower()] = col_id

with open('debug.json', 'r', encoding='utf-8') as f:
    json_str = f.read()

try:
    data = json.loads(json_str)
except Exception as e:
    json_str = re.sub(r',\s*]', ']', json_str)
    json_str = re.sub(r',\s*}', '}', json_str)
    data = json.loads(json_str)

sql_statements = []

sql_statements.append('-- Insert Products')
for prod in data:
    prod_id = prod['id']
    name = prod['name'].replace("'", "''")
    price = prod.get('price', 0)
    sql_statements.append(f"INSERT INTO public.product (product_code, nama, price) VALUES ('{prod_id}', '{name}', {price}) ON CONFLICT DO NOTHING;")

sql_statements.append('\n-- Insert Product Colors')
for prod in data:
    prod_id = prod['id']
    price = prod.get('price', 0)
    for var in prod['variants']:
        var_name = var['name'].strip()
        stock = var['stock']
        col_id = color_map.get(var_name.lower())
        if not col_id:
            sql_statements.append(f"-- WARNING: Color '{var_name}' not found in color_map for product {prod_id}")
            continue
        
        sql_statements.append(f"INSERT INTO public.product_color (product_id, color_id, harga, stok) VALUES ('{prod_id}', '{col_id}', {price}, {stock}) ON CONFLICT DO NOTHING;")

with open('insert_products.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f'Generated insert_products.sql with {len(color_map)} mapped colors')

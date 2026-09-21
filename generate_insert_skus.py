import json
import re

with open('debug.json', 'r', encoding='utf-8') as f:
    json_str = f.read()

try:
    data = json.loads(json_str)
except Exception as e:
    json_str = re.sub(r',\s*]', ']', json_str)
    json_str = re.sub(r',\s*}', '}', json_str)
    data = json.loads(json_str)

sql_statements = []
sql_statements.append('-- Insert SKUs')

count = 0
for prod in data:
    prod_id = prod['id']
    name = prod['name'].replace("'", "''")
    
    if 'skus' in prod and isinstance(prod['skus'], list):
        for sku_val in prod['skus']:
            sku_val = sku_val.strip().replace("'", "''")
            if sku_val:
                # name in sku table can be the product name for context
                sql = f"INSERT INTO public.sku (id_sku, product_code, name) VALUES ('{sku_val}', '{prod_id}', '{name}') ON CONFLICT (id_sku) DO NOTHING;"
                sql_statements.append(sql)
                count += 1

with open('insert_skus.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f'Generated insert_skus.sql with {count} SKUs')

import xml.etree.ElementTree as ET

tree = ET.parse('lzist (4).drawio')
root = tree.getroot()

tables = {}
current_table = None

for cell in root.iter('mxCell'):
    style = cell.get('style', '')
    value = cell.get('value', '').replace('&lt;', '<').replace('&gt;', '>')
    # remove html tags
    import re
    value = re.sub('<[^<]+>', '', value).strip()
    
    if 'shape=table;' in style or 'shape=table ' in style or (style.startswith('shape=table')):
        current_table = cell.get('id')
        tables[current_table] = {'name': value, 'columns': []}
    elif 'shape=partialRectangle' in style:
        # Check if this is a column name (usually it's the second partialRectangle in a tableRow)
        if 'align=left' in style:
            parent_id = cell.get('parent')
            for row in root.iter('mxCell'):
                if row.get('id') == parent_id:
                    table_id = row.get('parent')
                    if table_id in tables:
                        tables[table_id]['columns'].append(value)

for t_id, table in tables.items():
    print(f"Table: {table['name']}")
    for col in table['columns']:
        print(f"  - {col}")

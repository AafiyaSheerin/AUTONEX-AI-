import json
from pathlib import Path

CATALOG_PATH = Path(__file__).parent.parent / "data" / "catalog.json"

def load_catalog():
    with open(CATALOG_PATH, "r", encoding="utf-8") as file:
        return json.load(file)

def save_catalog(catalog):
    with open(CATALOG_PATH, "w", encoding="utf-8") as file:
        json.dump(catalog, file, indent=2)

def add_product(product_data):
    catalog = load_catalog()
    products = catalog.get("products", [])
    
    # Generate unique ID if missing
    if not product_data.get("id"):
        from uuid import uuid4
        product_data["id"] = f"prod_{uuid4().hex[:8]}"
        
    # Ensure default fields
    product_data["price"] = float(product_data.get("price", 10.0))
    product_data["stock"] = int(product_data.get("stock", 10))
    product_data["delivery_days"] = int(product_data.get("delivery_days", 3))
    product_data["quality"] = product_data.get("quality", "Premium")
    product_data["merchant"] = product_data.get("merchant", "Hermora Artisan Collective")
    product_data["color"] = product_data.get("color", "Classic")
    
    products.insert(0, product_data)
    catalog["products"] = products
    save_catalog(catalog)
    return product_data

def update_product(product_id, updates):
    catalog = load_catalog()
    products = catalog.get("products", [])
    found = None
    for idx, p in enumerate(products):
        if p.get("id") == product_id:
            products[idx].update(updates)
            found = products[idx]
            break
    if found:
        catalog["products"] = products
        save_catalog(catalog)
    return found

def delete_product(product_id):
    catalog = load_catalog()
    products = catalog.get("products", [])
    new_products = [p for p in products if p.get("id") != product_id]
    deleted = len(new_products) < len(products)
    if deleted:
        catalog["products"] = new_products
        save_catalog(catalog)
    return deleted

import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order API")

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,     
    allow_methods=["*"], 
    allow_headers=["*"],
)

@app.get("/items")
def get_items(search: str = None, db: Session = Depends(get_db)):
    try:
        # Build the initial query
        query = db.query(models.Product)
        
        # Apply search filter if provided
        if search:
            query = query.filter(models.Product.name.ilike(f"%{search}%"))
        
        # Execute query
        products = query.all()
        
        # Return structured data
        return [
            {
                "id": p.id, 
                "name": p.name, 
                "quantity": p.quantity_in_stock, 
                "price": float(p.price)
            } for p in products
        ]
        
    except Exception as e:
        # Log the error on the server side (in a real app, use a logging library)
        print(f"Error fetching items: {str(e)}")
        
        # Raise a proper HTTP 500 error to the frontend
        raise HTTPException(
            status_code=500, 
            detail="Database connection failed. Please try again later."
        )

@app.post("/items")
def create_item(payload: dict, db: Session = Depends(get_db)):
    # For SAFETY CHECKS
    if not payload.get("name") or str(payload.get("name")).strip() == "":
        raise HTTPException(status_code=400, detail="Item name cannot be empty.")
    
    try:
        price = float(payload.get("price", 0.0))
        quantity = int(payload.get("quantity", 0))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid data type for price or quantity.")

    if price < 0 or quantity < 0:
        raise HTTPException(status_code=400, detail="Price and quantity cannot be negative.")
    # SAFETY CHECKS END HERE
    try:
        product_name = payload.get("name", "ITEM").strip()
        clean_name = product_name.replace(" ", "-").upper()
        random_hash = uuid.uuid4().hex[:4].upper()
        generated_sku = f"SKU-{clean_name}-{random_hash}"

        new_product = models.Product(
            name=product_name,
            sku=generated_sku,  
            quantity_in_stock=int(payload.get("quantity", 0)),
            price=float(payload.get("price", 0.0))
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return {"id": new_product.id, "name": new_product.name, "quantity": new_product.quantity_in_stock, "price": float(new_product.price)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to add product to database.")

# PATCH Method: Inline Increment / Decrement
@app.patch("/items/{item_id}")
def update_item(item_id: int, payload: dict, db: Session = Depends(get_db)):
    # 1. Fetch item
    product = db.query(models.Product).filter(models.Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # 2. Update logic
        if "price" in payload:
            product.price = float(payload["price"])
            
        if "adjustment" in payload:
            adj = int(payload["adjustment"])
            if product.quantity_in_stock + adj < 0:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            product.quantity_in_stock += adj
            
        # 3. Commit the transaction
        db.commit()
        db.refresh(product)
        return {"id": product.id, "name": product.name, "quantity": product.quantity_in_stock, "price": float(product.price)}
        
    except ValueError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid data type provided.")
    except Exception as e:
        db.rollback()
        # Log the actual error 'e' here in a real production environment
        raise HTTPException(status_code=500, detail="Internal server error during update.")

@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        db.delete(product)
        db.commit()
        return {"message": "Item deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete item")

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == order_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.quantity_in_stock < order_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient inventory.")
    calculated_total = product.price * order_data.quantity
    try:
        product.quantity_in_stock -= order_data.quantity
        new_order = models.Order(customer_id=order_data.customer_id, product_id=order_data.product_id, quantity=order_data.quantity, total_amount=calculated_total)
        db.add(new_order)
        db.commit() 
        db.refresh(new_order)
        return new_order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Transaction failed, order cancelled.")

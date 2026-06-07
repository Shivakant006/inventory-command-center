from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# =====================================================================
# ITEM SCHEMAS
# =====================================================================
class ItemBase(BaseModel):
    name: str = Field(..., examples=["Wireless Mouse"])
    sku: str = Field(..., examples=["MS-WRLS-01"])
    quantity: int = Field(default=0, ge=0, examples=[50])
    price: float = Field(default=0.0, ge=0.0, examples=[29.99])
    description: Optional[str] = Field(None, examples=["Ergonomic 2.4Ghz mouse"])

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int

    class Config:
        from_attributes = True 

# =====================================================================
# ORDER SCHEMAS (Fixes the current crash! 🎯)
# =====================================================================
class OrderBase(BaseModel):
    item_id: int = Field(..., examples=[1])
    quantity: int = Field(..., ge=1, examples=[2])
    status: str = Field(default="pending", examples=["pending", "completed", "shipped"])

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
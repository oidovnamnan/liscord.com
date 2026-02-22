# 📦 LISCORD — НӨӨЦ УДИРДЛАГЫН МОДУЛЬ (Inventory)

> **Зарчим:** Бараа хаана, хэд үлдсэн, хэзээ захиалах — бүгд нэг дор.

---

## 1. БҮТЭЦ

```
Нөөц Удирдлага
├── 🏢 Нийлүүлэгч (Supplier)
├── 📋 Худалдан авалтын захиалга (PO)
├── 📥 Бараа хүлээн авалт (Receiving)
├── 📊 Нөөцийн хяналт (Stock Control)
├── 🔧 Нөөц тохируулга (Adjustment)
├── 🔄 Нөөц шилжүүлэг (Transfer)
├── 🏭 Агуулах (Warehouse/Location)
├── ⏰ Дуусах хугацаа (Expiry)
└── 📈 Тайлан (Reports)
```

---

## 2. НИЙЛҮҮЛЭГЧ

```javascript
// businesses/{bizId}/suppliers/{supplierId}
{
  id: "sup_abc",
  name: "Хятад худалдааны компани",
  contactPerson: "Wang Wei",
  phone: "+86 138 0000 1234",
  email: "wang@supplier.cn",
  address: "Guangzhou, China",
  country: "CN",
  categories: ["Гар утас", "Аксессуар"],
  paymentTerms: "30_days",
  currency: "CNY",
  totalOrders: 25,
  totalSpent: 150000000,
  lastOrderDate: Timestamp,
  rating: 4.5,
  deliveryReliability: 92,
  qualityScore: 88,
  notes: "",
  tags: ["main"],
  isActive: true,
  createdAt: Timestamp,
  createdBy: "user_xyz"
}
```

---

## 3. ХУДАЛДАН АВАЛТЫН ЗАХИАЛГА (PO)

```javascript
// businesses/{bizId}/purchaseOrders/{poId}
{
  id: "po_abc",
  poNumber: "PO-0001",
  supplierId: "sup_abc",
  supplierName: "Хятад худалдааны компани",
  
  items: [
    {
      productId: "prod_123",
      productName: "iPhone 15 Pro",
      sku: "IP15P-256",
      orderedQuantity: 50,
      receivedQuantity: 0,
      unitCost: 3800000,
      totalCost: 190000000,
    }
  ],
  
  subtotal: 190000000,
  shippingCost: 2000000,
  totalAmount: 192000000,
  currency: "MNT",
  
  status: "ordered",
  // "draft" | "ordered" | "partial" | "received" | "cancelled"
  
  orderDate: Timestamp,
  expectedDate: Timestamp,
  receivedDate: null,
  
  paymentStatus: "unpaid",
  paidAmount: 0,
  paymentTerms: "30_days",
  
  notes: "",
  createdBy: "user_xyz",
  createdAt: Timestamp,
}
```

### PO Статус Workflow
```
📝 Ноорог → 📤 Захиалсан → 📦 Хэсэгчлэн → ✅ Хүлээн авсан
                                              ❌ Цуцалсан
```

---

## 4. БАРАА ХҮЛЭЭН АВАЛТ

```javascript
// businesses/{bizId}/purchaseOrders/{poId}/receivings/{recId}
{
  id: "rec_abc",
  poId: "po_abc",
  receivedDate: Timestamp,
  items: [
    {
      productId: "prod_123",
      expectedQuantity: 50,
      receivedQuantity: 45,
      damagedQuantity: 2,
      acceptedQuantity: 43,
      batchNumber: "BATCH-2026-02",
      expiryDate: null,
      warehouseId: "wh_main",
      locationCode: "A-01-03",
    }
  ],
  notes: "2 ширхэг дэлгэц хагарсан",
  photos: ["url1"],
  receivedBy: "user_xyz",
  createdAt: Timestamp,
}
// → Cloud Function: stock += acceptedQuantity, costPrice шинэчлэх
```

---

## 5. НӨӨЦ ТОХИРУУЛГА

```javascript
// businesses/{bizId}/stockAdjustments/{adjId}
{
  id: "adj_abc",
  type: "adjustment",
  // "adjustment" | "damage" | "loss" | "return_to_supplier" | "gift" | "production"
  items: [
    {
      productId: "prod_123",
      previousQty: 15,
      newQty: 13,
      difference: -2,
      reason: "Тооллогоор 2 дутуу",
    }
  ],
  approvedBy: "user_owner",
  createdBy: "user_xyz",
  createdAt: Timestamp,
}
```

---

## 6. НӨӨЦИЙН ХӨДӨЛГӨӨН (Stock Movement Log)

```javascript
// businesses/{bizId}/stockMovements/{movId}
{
  productId: "prod_123",
  type: "in",  // "in" | "out"
  reason: "purchase_received",
  // IN:  "purchase_received" | "return_from_customer" | "adjustment_add" | "transfer_in"
  // OUT: "sold" | "return_to_supplier" | "adjustment_sub" | "damage" | "loss" | "transfer_out"
  quantity: 50,
  stockBefore: 15,
  stockAfter: 65,
  referenceType: "purchase_order",
  referenceId: "po_abc",
  warehouseId: "wh_main",
  createdBy: "user_xyz",
  createdAt: Timestamp,
}
```

---

## 7. АГУУЛАХ

```javascript
// businesses/{bizId}/warehouses/{whId}
{
  id: "wh_main",
  name: "Үндсэн агуулах",
  address: "УБ, БЗД",
  manager: "user_xyz",
  isMain: true,
  isActive: true,
  locations: [
    { code: "A-01-01", label: "A тавиур, 1-р мөр", capacity: 100 },
  ],
  createdAt: Timestamp,
}
```

---

## 8. ДУУСАХ ХУГАЦАА

```javascript
// products/{productId}.expiryTracking
{
  enabled: true,
  batches: [
    { batchNumber: "B-001", expiryDate: "2026-06-15", quantity: 20 },
  ],
  warningDays: 30,
}
// Scheduled Cloud Function: Өдөр бүр шалгаж мэдэгдэл илгээх
```

---

## 9. ТАЙЛАН

| # | Тайлан | Агуулга |
|---|--------|---------|
| 1 | Нөөцийн үлдэгдэл | Бүх барааны тоо, өртөг |
| 2 | Нөөц бага | Доод хязгаараас бага |
| 3 | Хөдөлгөөний түүх | Орсон-гарсан |
| 4 | Худалдан авалт | PO нэгтгэл |
| 5 | Нийлүүлэгч гүйцэтгэл | Хугацаа, чанар |
| 6 | Дуусах хугацаа | Удахгүй дуусах |
| 7 | ABC шинжилгээ | Топ/дунд/бага |
| 8 | Нөөцийн эргэлт | Хэдэн өдөрт эргэлддэг |

---

## 10. ЭРХҮҮД

| Permission ID | Нэр |
|---------------|------|
| `inventory.view_stock` | Нөөц харах |
| `inventory.adjust_stock` | Нөөц тохируулах |
| `inventory.manage_suppliers` | Нийлүүлэгч удирдах |
| `inventory.create_po` | PO үүсгэх |
| `inventory.receive_stock` | Бараа хүлээн авах |
| `inventory.transfer_stock` | Нөөц шилжүүлэх |
| `inventory.manage_warehouses` | Агуулах удирдах |
| `inventory.view_reports` | Тайлан |

---

*9 дэд модуль, 8 тайлан, 8 эрх.*

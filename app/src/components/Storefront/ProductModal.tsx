import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import type { Product } from '../../types';
import { useCartStore } from '../../store';
import './ProductModal.css';

interface ProductModalProps {
    product: Product;
    onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        useCartStore.getState().addItem({
            product,
            quantity,
            price: product.pricing?.salePrice || 0
        });
        onClose();
    };

    const extractBrand = (desc: string) => {
        if (!desc) return null;
        const brandMatch = desc.match(/(?:Брэнд|Brand):\s*([^\n|*]+)/i);
        if (brandMatch) return brandMatch[1].trim();
        return null;
    };

    const brand = extractBrand(product.description);

    return (
        <div className="sf-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="sf-modal-container animate-slide-up" onClick={e => e.stopPropagation()}>
                <button className="sf-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="sf-modal-content">
                    <div className="sf-modal-gallery">
                        {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="sf-modal-main-img" />
                        ) : (
                            <div className="sf-modal-img-placeholder">📦</div>
                        )}
                    </div>

                    <div className="sf-modal-info">
                        <span className="sf-modal-category">
                            {brand || product.categoryName}
                        </span>
                        <h2 className="sf-modal-title">{product.name}</h2>

                        <div className="sf-modal-price">
                            {(product.pricing?.salePrice || 0).toLocaleString()} ₮
                            {product.pricing?.comparePrice && product.pricing.comparePrice > (product.pricing.salePrice || 0) && (
                                <span className="sf-modal-compare-price">
                                    {product.pricing.comparePrice.toLocaleString()} ₮
                                </span>
                            )}
                        </div>

                        <div className="sf-modal-desc">
                            {product.description || 'Энэхүү бүтээгдэхүүний талаарх дэлгэрэнгүй мэдээллийг тун удахгүй оруулах болно.'}
                        </div>

                        <div className="sf-modal-actions">
                            <div className="sf-modal-qty">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></button>
                            </div>
                            <button
                                className="sf-modal-add-btn"
                                onClick={handleAddToCart}
                            >
                                Сагсанд нэмэх
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

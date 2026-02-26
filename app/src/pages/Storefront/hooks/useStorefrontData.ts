import { useState, useEffect, useMemo } from 'react';
import { productService } from '../../../services/db';
import type { Business, Product } from '../../../types';

export function useStorefrontData(business: Business | undefined) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        if (!business) return;
        setLoading(true);
        const unsubscribe = productService.subscribeProducts(business.id, (data) => {
            setProducts(data.filter(p => !p.isDeleted && p.isActive !== false));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business]);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach(p => {
            if (p.categoryName) cats.add(p.categoryName);
        });
        return ['all', ...Array.from(cats)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = activeCategory === 'all' || p.categoryName === activeCategory;
            return matchesSearch && matchesCat;
        });
    }, [products, searchQuery, activeCategory]);

    return {
        products, loading, searchQuery, setSearchQuery, activeCategory, setActiveCategory, categories, filteredProducts
    };
}

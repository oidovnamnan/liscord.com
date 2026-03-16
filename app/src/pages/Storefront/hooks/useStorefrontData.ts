import { useState, useEffect, useMemo } from 'react';
import { productService, categoryService } from '../../../services/db';
import { membershipService } from '../../../services/membershipService';
import type { Business, Product, Category } from '../../../types';

export interface StorefrontProduct extends Product {
    isExclusive?: boolean;
    isLocked?: boolean;
    exclusiveCategoryName?: string;
    exclusiveCategoryId?: string;
    membershipConfig?: Category['membershipConfig'];
}

export function useStorefrontData(business: Business | undefined) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [activeMemberships, setActiveMemberships] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Load products
    useEffect(() => {
        if (!business) return;
        setTimeout(() => setLoading(true), 0);
        const unsubscribe = productService.subscribeProducts(business.id, (data) => {
            setProducts(data.filter(p => !p.isDeleted && p.isActive !== false && !p.isHidden));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business]);

    // Load categories (for exclusive detection)
    useEffect(() => {
        if (!business) return;
        const unsub = categoryService.subscribeCategories(business.id, (cats) => {
            setCategoryList(cats);
        });
        return () => unsub();
    }, [business]);

    // Check membership from localStorage
    useEffect(() => {
        if (!business) return;
        const storedPhone = localStorage.getItem(`membership_phone_${business.id}`);
        if (storedPhone) {
            const normalized = storedPhone.replace(/[^\d]/g, '').replace(/^976/, '');
            membershipService.getCustomerMemberships(business.id, normalized)
                .then(ids => setActiveMemberships(ids))
                .catch(() => setActiveMemberships([]));
        }
    }, [business]);

    // Build reverse map: normalCategoryId → exclusiveCategory (from linkedCategoryIds)
    const linkedToExclusiveMap = useMemo(() => {
        const map: Record<string, Category> = {};
        categoryList.filter(c => c.categoryType === 'exclusive').forEach(exc => {
            // Direct: exclusive category itself
            map[exc.id] = exc;
            // Linked: normal categories linked to this exclusive
            if (exc.linkedCategoryIds) {
                exc.linkedCategoryIds.forEach(linkedId => {
                    map[linkedId] = exc;
                });
            }
        });
        return map;
    }, [categoryList]);

    // Categories for filter tabs — use categories collection (same as admin)
    // Only show categories that have at least one visible product
    const categories = useMemo(() => {
        const productCatIds = new Set<string>();
        products.forEach(p => {
            if (p.categoryId) productCatIds.add(p.categoryId);
        });
        const activeCats = categoryList
            .filter(c => productCatIds.has(c.id))
            .map(c => c.name);
        return ['all', ...activeCats];
    }, [products, categoryList]);

    // Enrich products with exclusive/locked flags
    const enrichedProducts: StorefrontProduct[] = useMemo(() => {
        return products.map(p => {
            const exclusiveCat = p.categoryId ? linkedToExclusiveMap[p.categoryId] : undefined;
            if (exclusiveCat) {
                const isLocked = !activeMemberships.includes(exclusiveCat.id);
                return {
                    ...p,
                    isExclusive: true,
                    isLocked,
                    exclusiveCategoryName: exclusiveCat.name,
                    exclusiveCategoryId: exclusiveCat.id,
                    membershipConfig: exclusiveCat.membershipConfig
                };
            }
            return p as StorefrontProduct;
        });
    }, [products, linkedToExclusiveMap, activeMemberships]);

    const filteredProducts = useMemo(() => {
        // Build name→id map for category filter matching
        const catNameToId: Record<string, string> = {};
        categoryList.forEach(c => { catNameToId[c.name] = c.id; });
        const activeCatId = activeCategory !== 'all' ? catNameToId[activeCategory] : null;

        return enrichedProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = activeCategory === 'all' || p.categoryId === activeCatId;
            return matchesSearch && matchesCat;
        });
    }, [enrichedProducts, searchQuery, activeCategory, categoryList]);

    // Membership verification function
    const verifyMembership = async (phone: string) => {
        if (!business) return false;
        localStorage.setItem(`membership_phone_${business.id}`, phone);
        const ids = await membershipService.getCustomerMemberships(business.id, phone);
        setActiveMemberships(ids);
        return ids.length > 0;
    };

    return {
        products: enrichedProducts,
        loading,
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        categories,
        filteredProducts,
        linkedToExclusiveMap,
        activeMemberships,
        verifyMembership,
    };
}

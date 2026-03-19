import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, MessageSquare, Send, Loader2, Search, Settings } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp, query, where, limit, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import type { Product, StockInquiry } from '../../types';
import { toast } from 'react-hot-toast';

interface CreateInquiryModalProps {
    product?: Product | null;
    fbUserId?: string;
    onClose: () => void;
}

export function CreateInquiryModal({ product: initialProduct, fbUserId, onClose }: CreateInquiryModalProps) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const employee = useBusinessStore(s => s.employee);
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
    const [searchQ, setSearchQ] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newTemplate, setNewTemplate] = useState('');
    
    const [latestInq, setLatestInq] = useState<StockInquiry | null>(null);
    const [isLoadingInq, setIsLoadingInq] = useState(false);

    const DEFAULT_NOTES = [
        "Бэлэн байна уу?",
        "Хэзээ ирэх вэ?",
        "Энэ үнэ хэвээрээ юу?",
        "Өнгө/размер сонголт бий юу?",
        "Захиалгаар авах уу?"
    ];
    const templates = business?.settings?.stockInquiryTemplates || DEFAULT_NOTES;

    const handleUpdateTemplates = async (newTpls: string[]) => {
        if (!business?.id) return;
        try {
            await updateDoc(doc(db, 'businesses', business.id), {
                'settings.stockInquiryTemplates': newTpls
            });
        } catch (e) {
            toast.error('Загвар хадгалахад алдаа гарлаа');
        }
    };

    useEffect(() => {
        if (selectedProduct || !searchQ || searchQ.length < 2 || !business?.id) {
            setSearchResults([]);
            return;
        }
        const fetchP = async () => {
            setIsSearching(true);
            try {
                const q = query(collection(db, `businesses/${business.id}/products`), where('isDeleted','==',false), limit(200));
                const snap = await getDocs(q);
                const all = snap.docs.map(d => ({id: d.id, ...d.data()} as Product));
                const filtered = all.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.sku?.toLowerCase().includes(searchQ.toLowerCase()));
                setSearchResults(filtered.slice(0, 6));
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };
        const timer = setTimeout(fetchP, 400);
        return () => clearTimeout(timer);
    }, [searchQ, business?.id, selectedProduct]);

    // Fetch latest inquiry for selected product
    useEffect(() => {
        if (!selectedProduct || !business?.id) {
            setLatestInq(null);
            return;
        }
        let isMounted = true;
        const fetchLatest = async () => {
            setIsLoadingInq(true);
            try {
                const q = query(
                    collection(db, `businesses/${business.id}/stockInquiries`),
                    where('productId', '==', selectedProduct.id),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const snap = await getDocs(q);
                if (isMounted && !snap.empty) {
                    setLatestInq({ id: snap.docs[0].id, ...snap.docs[0].data() } as StockInquiry);
                } else if (isMounted) {
                    setLatestInq(null);
                }
            } catch (err) {
                console.error('Failed fetching latest inquiry:', err);
            } finally {
                if (isMounted) setIsLoadingInq(false);
            }
        };
        fetchLatest();
        return () => { isMounted = false; };
    }, [selectedProduct?.id, business?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business?.id || !user?.uid || !selectedProduct) return;

        setIsSubmitting(true);
        try {
            const operatorName = employee?.name || user.displayName || 'Оператор';
            
            const newInquiry: Omit<StockInquiry, 'id'> = {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                productImage: selectedProduct.images?.[0] || null,
                currentPrice: selectedProduct.pricing?.salePrice || 0,
                customerPhone: fbUserId ? `FB:${fbUserId}` : 'Оператор',
                status: 'pending',
                timeoutSeconds: 300, // 5 minutes default expectation
                createdAt: Timestamp.now() as any,
                source: 'operator',
                operatorId: user.uid,
                operatorName,
                operatorNote: note,
                ...(fbUserId ? { fbUserId } : {})
            };

            await addDoc(collection(db, `businesses/${business.id}/stockInquiries`), newInquiry);
            
            toast.success('Лавлагаа амжилттай илгээгдлээ');
            onClose();
        } catch (error) {
            console.error('Error creating inquiry:', error);
            toast.error('Лавлагаа илгээх үед алдаа гарлаа');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
                            Барааны лавлагаа
                        </h2>
                        <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={isSubmitting}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: 24 }}>
                    {!selectedProduct ? (
                        <div style={{ marginBottom: 20 }}>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label className="input-label">Бараа сонгох <span className="required">*</span></label>
                                <div className="input-with">
                                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 38 }} />
                                    <input 
                                        className="input" 
                                        placeholder="Барааны нэр эсвэл код..." 
                                        value={searchQ}
                                        onChange={e => setSearchQ(e.target.value)}
                                        style={{ paddingLeft: 36 }}
                                        autoFocus
                                    />
                                    {isSearching && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 12, top: 38, color: 'var(--text-muted)' }} />}
                                </div>
                            </div>
                            {searchResults.length > 0 && (
                                <div style={{ 
                                    marginTop: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', 
                                    borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    {searchResults.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => setSelectedProduct(p)}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', 
                                                borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {p.images?.[0] ? (
                                                <img src={p.images[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                            ) : (
                                                <div style={{ width: 40, height: 40, background: 'var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Package size={16} color="var(--text-muted)" />
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku || 'SKU байхгүй'} • ₮{p.pricing?.salePrice?.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchQ.length >= 2 && !isSearching && searchResults.length === 0 && (
                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Бараа олдсонгүй
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'flex', gap: 16, padding: '16px', 
                            background: 'var(--bg-soft)', borderRadius: 12, marginBottom: 20,
                            position: 'relative'
                        }}>
                            {!initialProduct && (
                                <button 
                                    type="button" 
                                    style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                    onClick={() => { setSelectedProduct(null); setSearchQ(''); }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                            {selectedProduct.images?.[0] ? (
                                <img src={selectedProduct.images[0]} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                            ) : (
                                <div style={{ width: 60, height: 60, background: 'var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={24} color="var(--text-muted)" />
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{selectedProduct.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Агуулах / Дэлгүүрээс шалгуулах</div>
                            </div>
                        </div>
                    )}

                    {isLoadingInq ? (
                        <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Loader2 size={14} className="animate-spin" /> Өмнөх лавлагааг шалгаж байна...
                        </div>
                    ) : latestInq ? (
                        <div style={{ 
                            padding: 14, marginBottom: 20, borderRadius: 12, fontSize: '0.85rem',
                            background: ['pending', 'checking'].includes(latestInq.status) ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${['pending', 'checking'].includes(latestInq.status) ? '#fde68a' : '#bbf7d0'}`,
                        }}>
                            <div style={{ fontWeight: 600, color: ['pending', 'checking'].includes(latestInq.status) ? '#92400e' : '#166534', marginBottom: 4 }}>
                                {['pending', 'checking'].includes(latestInq.status) ? '⏳ Хүлээгдэж буй лавлагаа байна' : '✅ Сүүлд өгсөн хариу'}
                            </div>
                            <div style={{ color: ['pending', 'checking'].includes(latestInq.status) ? '#b45309' : '#15803d' }}>
                                <strong>Төлөв:</strong> {
                                    latestInq.status === 'pending' ? 'Хүлээж байна' :
                                    latestInq.status === 'checking' ? 'Шалгаж байна' :
                                    latestInq.status === 'updated' ? 'Үнэ, мэдээлэл шинэчлэгдсэн' :
                                    latestInq.status === 'no_change' ? 'Өөрчлөлтгүй бэлэн' :
                                    latestInq.status === 'inactive' ? 'Нөөц дууссан' : 'Хугацаа дууссан'
                                } <br/>
                                {latestInq.respondedByName && <><strong>Хариулсан:</strong> {latestInq.respondedByName} <br/></>}
                                <strong>Хэзээ:</strong> {latestInq.createdAt instanceof Timestamp ? latestInq.createdAt.toDate().toLocaleString('mn-MN') : 'Саяхан'}
                            </div>
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: 24 }}>
                            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Нэмэлт тайлбар (заавал биш)</span>
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditMode(!isEditMode)} 
                                    style={{ background: 'none', border: 'none', color: isEditMode ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                                >
                                    <Settings size={14} /> {isEditMode ? 'Болих' : 'Загвар засах'}
                                </button>
                            </label>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {templates.map((text, i) => (
                                    <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline btn-xs" 
                                            style={{ 
                                                fontSize: '0.75rem', padding: '4px 10px', borderRadius: 100, 
                                                borderColor: 'var(--border-primary)', color: 'var(--text-secondary)',
                                                paddingRight: isEditMode ? '24px' : '10px'
                                            }}
                                            onClick={() => !isEditMode && setNote(prev => prev ? `${prev} ${text}` : text)}
                                            disabled={isEditMode}
                                        >
                                            {!isEditMode && '+ '} {text}
                                        </button>
                                        {isEditMode && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const next = [...templates];
                                                    next.splice(i, 1);
                                                    handleUpdateTemplates(next);
                                                }}
                                                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isEditMode && (
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <input 
                                            value={newTemplate} 
                                            onChange={e => setNewTemplate(e.target.value)} 
                                            placeholder="Шинэ загвар..."
                                            className="input"
                                            style={{ height: 26, fontSize: '0.75rem', padding: '0 8px', width: 120, minHeight: 'unset' }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (newTemplate.trim()) {
                                                        handleUpdateTemplates([...templates, newTemplate.trim()]);
                                                        setNewTemplate('');
                                                    }
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-primary btn-xs" 
                                            style={{ padding: '0 8px', height: 26 }}
                                            onClick={() => {
                                                if (newTemplate.trim()) {
                                                    handleUpdateTemplates([...templates, newTemplate.trim()]);
                                                    setNewTemplate('');
                                                }
                                            }}
                                        >
                                            Нэмэх
                                        </button>
                                    </div>
                                )}
                            </div>

                            <textarea 
                                className="input" 
                                rows={3} 
                                placeholder="Жишээ: Цэнхэр өнгө нь бэлэн байгаа юу? Хялбархан шалгаад өгөөрэй."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                                Болих
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={isSubmitting || !selectedProduct || ['pending', 'checking'].includes(latestInq?.status || '')} 
                                style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {['pending', 'checking'].includes(latestInq?.status || '') ? 'Хариу хүлээж байна' : 'Илгээх'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}

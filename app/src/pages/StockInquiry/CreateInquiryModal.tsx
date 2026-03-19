import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, MessageSquare, Send, Loader2, Search } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp, query, where, limit, getDocs } from 'firebase/firestore';
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

    const QUICK_NOTES = [
        "Бэлэн байна уу?",
        "Хэзээ ирэх вэ?",
        "Энэ үнэ хэвээрээ юу?",
        "Өнгө/размер сонголт бий юу?",
        "Захиалгаар авах уу?"
    ];

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

                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: 24 }}>
                            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Нэмэлт тайлбар (заавал биш)</span>
                            </label>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {QUICK_NOTES.map((text, i) => (
                                    <button 
                                        key={i} 
                                        type="button" 
                                        className="btn btn-outline btn-xs" 
                                        style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 100, borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                        onClick={() => setNote(prev => prev ? `${prev} ${text}` : text)}
                                    >
                                        + {text}
                                    </button>
                                ))}
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
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedProduct} style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Илгээх
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}

import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Business, UserFeedPost, Product } from '../../types';
import { Heart, MessageCircle, Share2, ArrowLeft, MoreHorizontal, MessageSquare } from 'lucide-react';
import { useCartStore } from '../../store';
import { toast } from 'react-hot-toast';
import { ProductModal } from '../../components/Storefront/ProductModal';
import { businessService } from '../../services/db';
import './StoreCommunity.css';

export function StoreCommunity() {
    const { business } = useOutletContext<{ business: Business }>();
    const { slug } = useParams();
    const [posts, setPosts] = useState<(UserFeedPost & { product?: Product })[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        loadFeed();
    }, [business.id]);

    const loadFeed = async () => {
        if (!business.id) return;
        setLoading(true);
        try {
            const feedRef = collection(db, 'businesses', business.id, 'user_feeds');
            const q = query(
                feedRef,
                where('status', '==', 'approved'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const snap = await getDocs(q);
            
            const fetchedPosts: (UserFeedPost & { product?: Product })[] = [];
            for (const docSnap of snap.docs) {
                const data = docSnap.data() as UserFeedPost;
                
                // Fetch product info if exists
                let product: Product | undefined;
                if (data.productId) {
                    try {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const pDoc = await getDoc(doc(db, 'businesses', business.id, 'products', data.productId));
                        if (pDoc.exists()) {
                            const pData = pDoc.data();
                            if (!pData.isDeleted) {
                                product = { id: pDoc.id, ...pData } as Product;
                            }
                        }
                    } catch (e) {
                        console.error("Failed to load product for feed:", e);
                    }
                }

                fetchedPosts.push({
                    ...data,
                    id: docSnap.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    product
                });
            }
            
            setPosts(fetchedPosts);
        } catch (err) {
            console.error('Error loading community feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (e: React.MouseEvent, p: Product) => {
        e.preventDefault();
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: p,
            quantity: 1,
            price: p.pricing?.salePrice || 0
        });
        toast.success('Сагсанд нэмлээ', {
            duration: 2000,
            style: { background: '#1e293b', color: '#fff', fontSize: '0.88rem', fontWeight: 600 },
            icon: '🛒',
        });
    };

    const handleProductClick = (p: Product) => {
        setSelectedProduct(p);
    };

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="store-community-page">
            <header className="community-header">
                <a href={`/${slug}`} className="community-back">
                    <ArrowLeft size={20} />
                </a>
                <h1 className="community-title">{storeName} - Коммунити</h1>
            </header>

            <div className="community-feed">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <div className="spinner" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="community-empty">
                        <div className="empty-icon">🌟</div>
                        <h3>Пост алга байна</h3>
                        <p>Хамгийн түрүүнд барааны зургаа хуваалцаад урамшуулал аваарай!</p>
                        <a href={`/${slug}`} className="empty-btn">Дэлгүүр рүү буцах</a>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="feed-post animate-fade-in">
                            {/* User Header */}
                            <div className="post-header">
                                <div className="post-avatar">
                                    {post.customerAvatar ? (
                                        <img src={post.customerAvatar} alt={post.customerName} />
                                    ) : (
                                        <div className="avatar-placeholder">{post.customerName.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="post-user-info">
                                    <div className="post-username">{post.customerName}</div>
                                    <div className="post-date">
                                        {post.createdAt.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <button className="post-more-btn"><MoreHorizontal size={20} /></button>
                            </div>

                            {/* Images Carousel */}
                            {post.images && post.images.length > 0 && (
                                <div className="post-images">
                                    {post.images.length === 1 ? (
                                        <img src={post.images[0]} alt="Post" className="single-image" loading="lazy" />
                                    ) : (
                                        <div className="image-carousel custom-scrollbar">
                                            {post.images.map((img, idx) => (
                                                <img key={idx} src={img} alt={`Post ${idx}`} loading="lazy" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions & Likes */}
                            <div className="post-actions-bar">
                                <div className="post-action-buttons">
                                    <button className="action-btn like"><Heart size={22} /><span className="action-count">{post.likesCount || 0}</span></button>
                                    <button className="action-btn comment"><MessageCircle size={22} /></button>
                                    <button className="action-btn share"><Share2 size={22} /></button>
                                </div>
                            </div>

                            {/* Content Text */}
                            {post.content && (
                                <div className="post-content">
                                    <strong>{post.customerName}</strong> {post.content}
                                </div>
                            )}

                            {/* Linked Product Card - Interactive */}
                            {post.product && (
                                <div className="post-product-link" onClick={() => handleProductClick(post.product!)}>
                                    <div className="pp-image">
                                        {post.product.images?.[0] ? (
                                            <img src={post.product.images[0]} alt={post.product.name} />
                                        ) : (
                                            <div className="pp-placeholder">🛒</div>
                                        )}
                                    </div>
                                    <div className="pp-info">
                                        <div className="pp-name">{post.product.name}</div>
                                        <div className="pp-price">{(post.product.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    </div>
                                    <button className="pp-add-btn" onClick={(e) => handleAddToCart(e, post.product!)}>
                                        Авах
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    businessId={business.id}
                />
            )}
        </div>
    );
}

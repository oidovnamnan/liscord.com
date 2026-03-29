import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Check, X, ShieldAlert, Star, Trash2, ExternalLink } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { toast } from 'react-hot-toast';

export function FeedModeration() {
    const { business: currentBusiness } = useBusinessStore();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentBusiness?.id) return;
        const q = query(
            collection(db, 'businesses', currentBusiness.id, 'user_feeds'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(data);
            setLoading(false);
        }, (err) => {
            console.error("Feed loading error:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [currentBusiness?.id]);

    const handleStatusChange = async (postId: string, newStatus: 'approved' | 'rejected') => {
        if (!currentBusiness?.id) return;
        try {
            await updateDoc(doc(db, 'businesses', currentBusiness.id, 'user_feeds', postId), {
                status: newStatus
            });
            toast.success(`Пост ${newStatus === 'approved' ? 'зөвшөөрөгдлөө' : 'татгалзлаа'}`);
        } catch (err) {
            console.error('Update status:', err);
            toast.error('Алдаа гарлаа');
        }
    };

    const toggleFeatured = async (postId: string, currentFeatured: boolean) => {
        if (!currentBusiness?.id) return;
        try {
            await updateDoc(doc(db, 'businesses', currentBusiness.id, 'user_feeds', postId), {
                featured: !currentFeatured
            });
            toast.success(`Пост ${!currentFeatured ? 'онцлох боллоо' : 'онцлохоос хасагдлаа'}`);
        } catch (err) {
            console.error('Toggle featured:', err);
            toast.error('Алдаа гарлаа');
        }
    };

    const handleDelete = async (postId: string) => {
        if (!currentBusiness?.id) return;
        if (!confirm('Энэ постыг устгах уу? Урамшууллын гүйлгээнд нөлөөлөхгүйг анхаарна уу.')) return;
        try {
            await deleteDoc(doc(db, 'businesses', currentBusiness.id, 'user_feeds', postId));
            toast.success('Пост устгагдлаа');
        } catch (err) {
            console.error('Delete post:', err);
            toast.error('Алдаа гарлаа');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Уншиж байна...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="text-blue-500" />
                        Feed Модераци
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Хэрэглэгчдийн оруулсан постуудыг шалгаж зөвшөөрөх, онцлох үйлдлүүд хийх.
                    </p>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                    Одоогоор пост байхгүй байна
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            {/* Image Header */}
                            {post.images?.[0] && (
                                <div className="w-full h-48 bg-gray-100 relative group">
                                    <img src={post.images[0]} alt="Post" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <a href={post.images[0]} target="_blank" rel="noreferrer" className="bg-white/90 p-2 rounded-full text-gray-900 hover:bg-white transition-colors" title="Томоор үзэх">
                                            <ExternalLink size={20} />
                                        </a>
                                    </div>
                                    {post.featured && (
                                        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                            <Star size={12} fill="currentColor" /> Онцлох
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info body */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">{post.customerName}</div>
                                        <div className="text-xs text-gray-500">
                                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Саяхан'}
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                                        post.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        post.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {post.status === 'approved' ? 'Зөвшөөрсөн' : post.status === 'rejected' ? 'Татгалзсан' : 'Хүлээгдэж буй'}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{post.content}</p>

                                {/* Actions */}
                                <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                                    {post.status !== 'approved' && (
                                        <button onClick={() => handleStatusChange(post.id, 'approved')} className="col-span-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors">
                                            <Check size={16} /> Зөвшөөрөх
                                        </button>
                                    )}
                                    {post.status !== 'rejected' && (
                                        <button onClick={() => handleStatusChange(post.id, 'rejected')} className="col-span-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors">
                                            <X size={16} /> Татгалзах
                                        </button>
                                    )}
                                </div>
                                
                                <div className="pt-2 flex gap-2">
                                    <button 
                                        onClick={() => toggleFeatured(post.id, post.featured)} 
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-colors border ${
                                            post.featured ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Star size={16} className={post.featured ? 'fill-current' : ''} /> {post.featured ? 'Онцлохоос хасах' : 'Онцлох'}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(post.id)}
                                        className="w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors"
                                        title="Устгах"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

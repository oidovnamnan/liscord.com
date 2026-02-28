import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Barcode as BarcodeIcon, Search, Printer, Loader2, Download, Tag } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { productService } from '../../services/db';
import { toast } from 'react-hot-toast';

interface ProductData {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    stock?: { quantity: number };
}

export function BarcodesPage() {
    const { business } = useBusinessStore();
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        const unsubscribe = productService.subscribeProducts(business.id, (data) => {
            setProducts(data as ProductData[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePrintSelected = () => {
        if (!selectedProductId) {
            toast.error('Эхлээд бараа сонгоно уу');
            return;
        }
        toast.success('Хэвлэх модуль бэлтгэгдэж байна...');
    };

    return (
        <>
            <Header title="Баркод & Шошго" />
            <div className="page">
                <div className="page-header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Барааны нэр эсвэл SKU-аар хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary gradient-btn" onClick={handlePrintSelected}>
                        <Printer size={18} /> Багцаар хэвлэх
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                    <div className="card" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="flex-center" style={{ height: '300px' }}>
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Барааны нэр</th>
                                        <th>SKU</th>
                                        <th>Баркод</th>
                                        <th>Үлдэгдэл</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr
                                            key={product.id}
                                            className={selectedProductId === product.id ? 'active-row' : ''}
                                            onClick={() => setSelectedProductId(product.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ fontWeight: 600 }}>{product.name}</td>
                                            <td>{product.sku || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <BarcodeIcon size={14} color="var(--text-muted)" />
                                                    {product.barcode || 'Кодгүй'}
                                                </div>
                                            </td>
                                            <td>{product.stock?.quantity || 0} ш</td>
                                            <td>
                                                <button className="btn-icon">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="card">
                        <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Tag size={18} color="var(--primary)" /> Шошгоны тохиргоо
                            </h3>
                        </div>

                        {selectedProductId ? (
                            <div className="settings-form">
                                <div className="input-group">
                                    <label className="input-label">Шошгоны төрөл</label>
                                    <select className="input">
                                        <option>40mm x 30mm (Standart)</option>
                                        <option>50mm x 40mm (Large)</option>
                                        <option>A4-д олноор (24 lables)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Хэвлэх тоо</label>
                                    <input className="input" type="number" defaultValue={1} />
                                </div>
                                <div className="toggle-group" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Үнэ харуулах</span>
                                        <input type="checkbox" defaultChecked />
                                    </label>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Нэр харуулах</span>
                                        <input type="checkbox" defaultChecked />
                                    </label>
                                </div>

                                <div style={{
                                    marginTop: '24px',
                                    padding: '24px',
                                    background: '#fff',
                                    border: '1px dashed #ccc',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>LISCORD TECH</div>
                                    <div style={{ height: '40px', width: '140px', background: 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 4px)', opacity: 0.8 }} />
                                    <div style={{ fontSize: '0.6rem', letterSpacing: '4px' }}>{products.find(p => p.id === selectedProductId)?.sku?.slice(0, 10).toUpperCase() || 'BARCODE'}</div>
                                    <div style={{ fontWeight: 800 }}>₮ 120,000</div>
                                </div>

                                <button
                                    className="btn btn-primary gradient-btn"
                                    style={{ width: '100%', marginTop: '24px' }}
                                    onClick={() => toast.success('Принтер рүү илгээлээ')}
                                >
                                    <Printer size={18} /> Сонгосныг хэвлэх
                                </button>
                            </div>
                        ) : (
                            <div className="flex-center" style={{ height: '200px', flexDirection: 'column', color: 'var(--text-muted)', textAlign: 'center' }}>
                                <BarcodeIcon size={48} color="#eee" style={{ marginBottom: 12 }} />
                                <p style={{ fontSize: '0.85rem' }}>Бараа сонгож шошгыг нь харна уу</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

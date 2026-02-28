import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Layers,
    Search,
    Zap,
    ArrowRight,
    Filter,
    Layout,
    CheckCircle2,
    Clock,
    Database,
    Activity,
    AlertCircle,
    Smartphone
} from 'lucide-react';

interface ProductVariant {
    id: string;
    sku: string;
    productName: string;
    attributes: string;
    stock: number;
    price: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const MOCK_VARIANTS: ProductVariant[] = [
    {
        id: 'VAR-001',
        sku: 'TSHIRT-BLUE-L',
        productName: 'Classic T-Shirt',
        attributes: 'Color: Blue, Size: L',
        stock: 45,
        price: 25000,
        status: 'in-stock'
    },
    {
        id: 'VAR-002',
        sku: 'TSHIRT-RED-M',
        productName: 'Classic T-Shirt',
        attributes: 'Color: Red, Size: M',
        stock: 5,
        price: 25000,
        status: 'low-stock'
    },
    {
        id: 'VAR-003',
        sku: 'TSHIRT-BLACK-S',
        productName: 'Classic T-Shirt',
        attributes: 'Color: Black, Size: S',
        stock: 0,
        price: 25000,
        status: 'out-of-stock'
    }
];

export function ProductVariantsPage() {
    const [variants] = useState<ProductVariant[]>(MOCK_VARIANTS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Барааны Хувилбарууд (Variants)"
                    subtitle="Барааны өнгө, хэмжээ, материал болон бусад үзүүлэлтээр хувилбар үүсгэх, SKU хянах"
                    action={{
                        label: "Хувилбар үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт хувилбар</h4>
                                <div className="text-3xl font-black text-primary">124</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Layers size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Үлдэгдэл бага</h4>
                                <div className="text-3xl font-black text-warning">18</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><AlertCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж үнэ</h4>
                                <div className="text-3xl font-black text-secondary">₮28k</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Bulk Management</h4>
                                <div className="text-xl font-black text-white">SKU GENERATOR ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="SKU, барааны нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төлөв</button>
                    </div>

                    {/* Variants Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">SKU & Нэр</th>
                                    <th>Үзүүлэлтүүд (Attributes)</th>
                                    <th>Үлдэгдэл</th>
                                    <th>Нэгж үнэ (₮)</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map(v => (
                                    <tr key={v.id} className="hover:bg-surface-2 transition-all group border-b border-border-color/5">
                                        <td className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10">
                                                    <Layout size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm tracking-tight">{v.sku}</div>
                                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">{v.productName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-[10px] font-black text-muted uppercase tracking-widest bg-surface-2 px-2 py-1 rounded-lg border border-border-color/10 inline-block">
                                                {v.attributes}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <div className={`text-sm font-black ${v.stock <= 5 ? 'text-danger' : 'text-primary'}`}>{v.stock} ширхэг</div>
                                                <div className="h-1 w-16 bg-surface-2 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full rounded-full ${v.stock > 10 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${Math.min(v.stock * 5, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-slate-700 tracking-tighter">₮{v.price.toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${v.status === 'in-stock' ? 'success' :
                                                v.status === 'low-stock' ? 'warning' : 'danger'
                                                }`}>
                                                {v.status === 'in-stock' ? 'ҮЛДЭГДЭЛТЭЙ' :
                                                    v.status === 'low-stock' ? 'БАГА ҮЛДЭГДЭЛ' : 'ДУУССАН'}
                                            </span>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2 text-muted">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors hover:bg-surface-3"><Clock size={16} /></button>
                                                <button className="btn btn-primary p-2 h-10 w-10 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Variant Strategy Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Product Matrix Optimizer</h3>
                                <p className="text-sm text-muted">Барааны хувилбаруудыг автоматаар үүсгэх, SKU матриц тохируулах болон олон төрөлт барааг нэгдсэн системд бүртгэх.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">МАТРИЦ ҮҮСГЭХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Smartphone size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}

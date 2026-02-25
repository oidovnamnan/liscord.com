const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'src', 'pages', 'Settings', 'SettingsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the inputs block
const inputsBlockOld = `<div className="input-group">
                                            <label className="input-label">Дэлгүүрийн холбоос (Slug) <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*жилд 1 удаа</span></label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{window.location.origin}/s/</span>
                                                <input className="input" name="slug" value={storefrontSlug} onChange={(e) => { setStorefrontSlug(e.target.value.toLowerCase()); setIsDirty(true); }} placeholder="zara-mongolia" required pattern="[a-z0-9-]+" title="Зөвхөн жижиг англи үсэг, тоо болон зураас ашиглана уу" style={{ flex: 1 }} disabled={!!business?.slug || !!pendingRequest} />
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Зөвхөн жижиг англи үсэг, тоо болон дундуур зураас орж болно.</p>
                                        </div>`;

const inputsBlockNew = `<div className="input-group">
                                            <label className="input-label">Дэлгүүрийн холбоос (Slug) <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*жилд 1 удаа</span></label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{window.location.origin}/s/</span>
                                                <input className="input" name="slug" value={storefrontSlug} onChange={(e) => { setStorefrontSlug(e.target.value.toLowerCase()); setIsDirty(true); }} placeholder="zara-mongolia" required pattern="[a-z0-9-]+" title="Зөвхөн жижиг англи үсэг, тоо болон зураас ашиглана уу" style={{ flex: 1 }} disabled={!!business?.slug || !!pendingRequest} />
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Зөвхөн жижиг англи үсэг, тоо болон дундуур зураас орж болно.</p>
                                        </div>

                                        {!!business?.slug && !pendingRequest && !isStorefrontLocked && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12, marginBottom: 16 }}>
                                                <button type="button" className="btn btn-outline" onClick={() => {
                                                    setRequestedChanges({ name: business?.settings?.storefront?.name || '', slug: business?.slug });
                                                    setShowRequestModal(true);
                                                }}>
                                                    Түгжээ гаргах / Өөрчлөх хүсэлт илгээх
                                                </button>
                                            </div>
                                        )}`;

content = content.replace(inputsBlockOld, inputsBlockNew);

// Replace handleUpdateStorefront guard logic
const logicOld = `            if (slugChanged || nameChanged) {
                // If they changed and we locked, user shouldn't be here, but just in case
                if (isStorefrontLocked || pendingRequest) {
                    toast.error('Одоогоор өөрчлөх боломжгүй байна.');
                    setLoading(false);
                    return;
                }

                // Verify slug uniqueness first
                if (slugChanged && slug) {
                    const existing = await businessService.getBusinessBySlug(slug);
                    if (existing) {
                        toast.error('Энэ дэлгүүрийн холбоос давхардсан байна. Өөр үг сонгоно уу.');
                        setLoading(false);
                        return;
                    }
                }

                // Prepare changes and open modal
                setRequestedChanges({
                    ...(slugChanged ? { slug } : {}),
                    ...(nameChanged ? { name: storefrontName } : {})
                });
                setShowRequestModal(true);
                setLoading(false);
                return;
            }`;

const logicNew = `            if (slugChanged || nameChanged) {
                // If it's the very first setup (no previous slug), we allow it to be saved directly
                if (!business.slug) {
                    // Verify slug uniqueness first
                    if (slug) {
                        const existing = await businessService.getBusinessBySlug(slug);
                        if (existing) {
                            toast.error('Энэ дэлгүүрийн холбоос давхардсан байна. Өөр үг сонгоно уу.');
                            setLoading(false);
                            return;
                        }
                    }
                } else {
                    // Otherwise, user shouldn't be able to edit directly here. The inputs are disabled.
                    // This block is just a fallback guard.
                    toast.error('Шууд өөрчлөх боломжгүй. Хүсэлт илгээж өөрчилнө үү.');
                    setLoading(false);
                    return;
                }
            }`;

content = content.replace(logicOld, logicNew);

// Replace Modal content
const modalOld = `                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                Дэлгүүрийн нэр болон холбоосыг <strong>жилд нэг л удаа</strong> өөрчилдөг тул Супер Админы зөвшөөрөл шаардлагатай. Та доорх хэсэгт ямар шалтгаанаар өөрчилж байгаагаа тодорхой бичиж үлдээнэ үү.
                            </p>
                            <textarea 
                                className="input" 
                                style={{ height: '100px', resize: 'vertical' }} 
                                placeholder="Шалтгаанаа тодорхой бичнэ үү..." 
                                value={requestReason}
                                onChange={e => setRequestReason(e.target.value)}
                                required 
                                minLength={10}
                            />
                            <div className="modal-footer" style={{ marginTop: 24 }}>`;

const modalNew = `                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                Дэлгүүрийн нэр болон холбоосыг <strong>жилд нэг л удаа</strong> өөрчилдөг тул Супер Админы зөвшөөрөл шаардлагатай.
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Шинэ дэлгүүрийн нэр</label>
                                    <input className="input" value={requestedChanges?.name || ''} onChange={e => setRequestedChanges(p => ({ ...p, name: e.target.value }))} placeholder="NamShop" required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Шинэ холбоос (уншихад амархан)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{window.location.origin}/s/</span>
                                        <input className="input" style={{ flex: 1 }} value={requestedChanges?.slug || ''} onChange={e => setRequestedChanges(p => ({ ...p, slug: e.target.value.toLowerCase() }))} placeholder="zara-mongolia" required pattern="[a-z0-9-]+" title="Зөвхөн жижиг англи үсэг, тоо болон дундуур зураас ашиглана уу" />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Өөрчлөх шалтгаан</label>
                                    <textarea 
                                        className="input" 
                                        style={{ height: '80px', resize: 'vertical' }} 
                                        placeholder="Шалтгаанаа тодорхой бичнэ үү..." 
                                        value={requestReason}
                                        onChange={e => setRequestReason(e.target.value)}
                                        required 
                                        minLength={10}
                                    />
                                </div>
                            </div>
                            
                            <div className="modal-footer" style={{ marginTop: 24 }}>`;

content = content.replace(modalOld, modalNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SettingsPage.tsx updated successfully.');

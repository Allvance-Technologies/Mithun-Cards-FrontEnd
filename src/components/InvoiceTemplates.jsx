import React from 'react';

const getCurrencySymbol = (settings) => {
    if (settings?.currency === 'INR') return '₹';
    if (settings?.currency === 'USD') return '$';
    return settings?.currency || '₹';
};

export const GstInvoice = ({ order, settings, currentSubcategory, title }) => {
    const symbol = getCurrencySymbol(settings);

    // Calculate individual GST components (assuming 18% total GST as common in India, or using settings)
    const totalTax = order.tax || 0;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    return (
        <div id="invoice-content" style={{
            padding: '20px',
            backgroundColor: '#fff',
            color: '#000',
            fontFamily: "'Courier New', Courier, monospace",
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            border: '2px solid #000',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>GSTIN : {settings?.gstNumber || '33BVRPM1511M1ZE'}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>TAX INVOICE</span>
                    <span>Off : 9150464242</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>CASH / CREDIT BILL</div>
                <h1 style={{ margin: '5px 0', fontSize: '28px', color: '#000080' }}>MITHUN CARDS & PAPERS</h1>
                <p style={{ margin: 0, fontSize: '14px' }}>14/2, Victoria Press Road, Near P.R. Papers, Nagercoil - 1.</p>
            </div>

            {/* Info Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', borderBottom: '1px solid #000' }}>
                <div style={{ borderRight: '1px solid #000', padding: '5px' }}>
                    <div style={{ marginBottom: '5px' }}>No. B: <span style={{ fontWeight: 'bold' }}>{order.id}</span></div>
                    <div style={{ display: 'flex' }}>
                        <span style={{ marginRight: '5px' }}>M/s</span>
                        <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.customer}</div>
                    </div>
                    <div style={{ height: '20px', borderBottom: '1px dotted #000', marginTop: '5px' }}></div>
                    <div style={{ display: 'flex', marginTop: '10px' }}>
                        <span style={{ marginRight: '5px' }}>Buyer's GSTIN</span>
                        <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.buyerGSTIN || ''}</div>
                    </div>
                </div>
                <div style={{ padding: '5px' }}>
                    <div style={{ textAlign: 'right', marginBottom: '5px' }}>Date : <span style={{ fontWeight: 'bold' }}>{order.date}</span></div>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', marginBottom: '3px' }}>
                            <span style={{ width: '150px' }}>Goods Despatched Through</span>
                            <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.despatch?.through || ''}</div>
                        </div>
                        <div style={{ display: 'flex', marginBottom: '3px' }}>
                            <span style={{ width: '40px' }}>From</span>
                            <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.despatch?.from || 'NAGERCOIL'}</div>
                        </div>
                        <div style={{ display: 'flex', marginBottom: '3px' }}>
                            <span style={{ width: '20px' }}>To</span>
                            <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.despatch?.to || ''}</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ width: '110px' }}>Number of Artics</span>
                            <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.despatch?.artics || ''}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ minHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                            <th style={{ borderRight: '1px solid #000', padding: '5px', width: '40px' }}>S. No.</th>
                            <th style={{ borderRight: '1px solid #000', padding: '5px' }}>DESCRIPTION</th>
                            <th style={{ borderRight: '1px solid #000', padding: '5px', width: '80px' }}>HSN/SAC</th>
                            <th style={{ borderRight: '1px solid #000', padding: '5px', width: '50px' }}>Qty</th>
                            <th style={{ borderRight: '1px solid #000', padding: '5px', width: '80px' }}>Rate</th>
                            <th style={{ padding: '5px', width: '100px' }} colSpan="2">AMOUNT<br /><span style={{ fontSize: '10px' }}>Rs. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; P.</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(order.items || []).map((item, index) => {
                            const amount = (parseFloat(item.price) * item.quantity).toFixed(2);
                            const [rs, p] = amount.split('.');
                            return (
                                <tr key={index} style={{ height: '30px' }}>
                                    <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ borderRight: '1px solid #000', padding: '5px' }}>{item.title}</td>
                                    <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'center' }}></td>
                                    <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right' }}>{parseFloat(item.price).toFixed(2)}</td>
                                    <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', width: '70px' }}>{rs}</td>
                                    <td style={{ padding: '5px', textAlign: 'center', width: '30px' }}>{p}</td>
                                </tr>
                            );
                        })}
                        {/* Empty rows to fill space */}
                        {Array.from({ length: Math.max(0, 10 - (order.items?.length || 0)) }).map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '30px' }}>
                                <td style={{ borderRight: '1px solid #000' }}></td>
                                <td style={{ borderRight: '1px solid #000' }}></td>
                                <td style={{ borderRight: '1px solid #000' }}></td>
                                <td style={{ borderRight: '1px solid #000' }}></td>
                                <td style={{ borderRight: '1px solid #000' }}></td>
                                <td style={{ borderRight: '1px solid #000' }}></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderTop: '1px solid #000' }}>
                <div style={{ borderRight: '1px solid #000', padding: '10px' }}>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', marginBottom: '5px' }}>
                            <span style={{ width: '120px', fontWeight: 'bold' }}>Bank Name</span>: TAMILNAD MERCANTILE BANK
                        </div>
                        <div style={{ display: 'flex', marginBottom: '5px' }}>
                            <span style={{ width: '120px', fontWeight: 'bold' }}>Branch</span>: NAGERCOIL
                        </div>
                        <div style={{ display: 'flex', marginBottom: '5px' }}>
                            <span style={{ width: '120px', fontWeight: 'bold' }}>Currant Account No</span>: 005150050800835
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ width: '120px', fontWeight: 'bold' }}>IFSC Code No.</span>: TMBL0000005
                        </div>
                    </div>
                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <p style={{ margin: 0 }}>For <span style={{ fontWeight: 'bold' }}>MITHUN CARDS & PAPERS</span></p>
                        <div style={{ height: '50px' }}></div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Authorised Signature</p>
                    </div>
                </div>
                <div style={{ padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>TOTAL :</td>
                                <td style={{ padding: '8px', textAlign: 'right', width: '100px' }}>{order.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right' }}>Forwarding</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>0.00</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right' }}>CGST ..........%</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{cgst.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right' }}>SGST ..........%</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{sgst.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right' }}>Round off</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>0.00</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>GROSS TOTAL</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{order.amount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const NonGstInvoice = ({ order, settings, currentSubcategory, title }) => {
    const symbol = getCurrencySymbol(settings);

    return (
        <div id="invoice-content" style={{
            padding: '20px',
            backgroundColor: '#fff',
            color: '#000',
            fontFamily: "'Courier New', Courier, monospace",
            width: '148mm', // A5 size often used for non-gst
            minHeight: '210mm',
            margin: '0 auto',
            border: '1px solid #000',
            boxSizing: 'border-box'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline' }}>INVOICE</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', marginBottom: '10px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#000080' }}>Mithun Cards and Papers</h2>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>14/2, Victoria Press Road, Nagercoil - 629 001.</p>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>E-Mail : mithuncardsandpapers@gmail.com</p>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>Mobile : 9150464242</p>
                </div>
                <div style={{ border: '1px solid #000', padding: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px' }}>Invoice No.:</span>
                        <span style={{ color: 'red', fontWeight: 'bold' }}>{String(order.id).padStart(3, '0')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px' }}>Date :</span>
                        <span style={{ fontWeight: 'bold' }}>{order.date}</span>
                    </div>
                </div>
            </div>

            <div style={{ border: '1px solid #000', padding: '5px', marginBottom: '10px' }}>
                <div style={{ display: 'flex' }}>
                    <span style={{ fontSize: '12px', width: '50px' }}>Buyer</span>
                    <div style={{ borderBottom: '1px dotted #000', flex: 1, fontWeight: 'bold' }}>{order.customer}</div>
                </div>
                <div style={{ height: '15px', borderBottom: '1px dotted #000', marginTop: '5px' }}></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ borderRight: '1px solid #000', padding: '5px', width: '40px', fontSize: '12px' }}>S.No</th>
                        <th style={{ borderRight: '1px solid #000', padding: '5px', fontSize: '12px' }}>Description of Goods</th>
                        <th style={{ borderRight: '1px solid #000', padding: '5px', width: '70px', fontSize: '12px' }}>Quantity</th>
                        <th style={{ padding: '5px', width: '80px', fontSize: '12px' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(order.items || []).map((item, index) => (
                        <tr key={index} style={{ height: '25px' }}>
                            <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '12px' }}>{index + 1}</td>
                            <td style={{ borderRight: '1px solid #000', padding: '5px', fontSize: '12px' }}>{item.title}</td>
                            <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '12px' }}>{item.quantity}</td>
                            <td style={{ padding: '5px', textAlign: 'right', fontSize: '12px' }}>{parseFloat(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                    {/* Filling the blank space */}
                    {Array.from({ length: Math.max(0, 15 - (order.items?.length || 0)) }).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '25px' }}>
                            <td style={{ borderRight: '1px solid #000' }}></td>
                            <td style={{ borderRight: '1px solid #000' }}></td>
                            <td style={{ borderRight: '1px solid #000' }}></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ borderTop: '1px solid #000' }}>
                        <td colSpan="3" style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>Total</td>
                        <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>{order.amount.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #000' }}>
                        <td colSpan="3" style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>Cash</td>
                        <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>{order.advance_paid.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #000' }}>
                        <td colSpan="3" style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>Balance</td>
                        <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>{order.balance_due.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Thank You</div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '10px' }}>For Mithun Cards and Papers</p>
                    <div style={{ height: '30px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '5px', minWidth: '120px' }}>Authorised Signatory</p>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatedModal } from '../common/AnimatedModal';
import { BrandLogo } from '../common/BrandLogo';
import { X, Download, Printer, CheckCircle2, FileText, Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface DigitalInvoiceModalProps {
  bookingId: string;
  onClose: () => void;
}

export const DigitalInvoiceModal: React.FC<DigitalInvoiceModalProps> = ({
  bookingId,
  onClose,
}) => {
  const { bookings, showToast, getPreviousTitle } = useApp();
  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];

  const handleDownload = () => {
    showToast(`Invoice ${booking.invoiceNumber} downloaded as PDF.`);
  };

  return (
    <AnimatedModal
      isOpen={Boolean(bookingId)}
      onClose={onClose}
      variant="dialog"
      maxWidth="max-w-lg"
      className="p-5 sm:p-6 overflow-y-auto max-h-[88vh]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center gap-1.5"
            title={getPreviousTitle()}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Back</span>
          </button>
          <BrandLogo size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="min-h-[44px] px-3.5 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition"
            title="Download Tax Invoice"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

        {/* Invoice Metadata */}
        <div className="mt-4 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Tax Invoice
            </span>
            <h3 className="font-mono font-black text-sm text-[#12222E]">
              {booking.invoiceNumber}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Date: {booking.date}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Payment Status
            </span>
            <div className="mt-0.5">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  booking.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {booking.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Partner Info */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Billed To</span>
            <div className="font-bold text-gray-900 mt-0.5">{booking.customerName}</div>
            <div className="text-[11px] text-gray-600 line-clamp-2">
              {booking.customerAddress.flat}, {booking.customerAddress.street},{' '}
              {booking.customerAddress.locality} - {booking.customerAddress.pincode}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Service Executive</span>
            <div className="font-bold text-gray-900 mt-0.5">{booking.workerName || 'Partner'}</div>
            <div className="text-[11px] text-gray-500">ChakaChak Mumbai Fleet Pro</div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="text-left py-2">Item Description</th>
                <th className="text-right py-2">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="py-2.5">
                  <div className="font-bold text-[#12222E]">{booking.serviceTitle}</div>
                  <div className="text-[11px] text-gray-500">{booking.configurationSummary}</div>
                </td>
                <td className="py-2.5 text-right font-extrabold text-[#12222E]">
                  ₹{booking.baseAmount.toLocaleString('en-IN')}
                </td>
              </tr>

              {booking.selectedAddons.map((addon) => (
                <tr key={addon.id}>
                  <td className="py-2 text-gray-600 pl-2 text-[11px]">
                    + {addon.name}
                  </td>
                  <td className="py-2 text-right font-semibold">
                    ₹{addon.price.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {booking.urgentFee > 0 && (
                <tr>
                  <td className="py-2 text-amber-800 font-semibold pl-2 text-[11px]">
                    + Urgent 90-Min Dispatch
                  </td>
                  <td className="py-2 text-right font-semibold text-amber-800">
                    ₹{booking.urgentFee.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {/* Attached Extra Purchased Products / Materials with Photo Proof */}
              {booking.attachedExpenses.map((exp, idx) => (
                <tr key={idx} className="bg-amber-50/50">
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                      <span>+ Purchased Material: {exp.title}</span>
                      <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded-sm">
                        Verified Receipt
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <ImageIcon className="w-3 h-3 text-gray-400" />
                      <span>Receipt photo verified by dispatch at {exp.addedAt}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-bold text-amber-900">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {booking.discountAmount > 0 && (
                <tr>
                  <td className="py-2 text-emerald-600 font-bold pl-2 text-[11px]">
                    Promotional Discount
                  </td>
                  <td className="py-2 text-right font-bold text-emerald-600">
                    -₹{booking.discountAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              <tr>
                <td className="py-2 text-gray-500 pl-2 text-[11px]">SGST (2.5%) + CGST (2.5%)</td>
                <td className="py-2 text-right font-semibold text-gray-600">
                  ₹{booking.taxes.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="mt-3 pt-3 border-t-2 border-gray-200 space-y-1.5 text-xs">
            <div className="flex justify-between font-extrabold text-sm text-[#12222E]">
              <span>Total Invoice Value</span>
              <span className="text-base font-black">
                ₹{booking.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 text-[11px]">
              <span>Amount Paid ({booking.paymentMethod})</span>
              <span className="font-bold text-emerald-700">
                ₹{booking.amountPaid.toLocaleString('en-IN')}
              </span>
            </div>
            {booking.balanceDue > 0 && (
              <div className="flex justify-between text-amber-800 font-bold text-[11px]">
                <span>Balance Due upon Handover</span>
                <span>₹{booking.balanceDue.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* GSTIN and Footer */}
        <div className="mt-5 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center leading-relaxed">
          <p>ChakaChak Home Solutions Pvt Ltd · GSTIN: 27AABCC9921D1ZB</p>
          <p>Bandra West Fulfillment Hub, Mumbai 400050 · support@chakachak.in</p>
        </div>
    </AnimatedModal>
  );
};

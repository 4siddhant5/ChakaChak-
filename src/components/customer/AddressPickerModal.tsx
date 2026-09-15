import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatedModal } from '../common/AnimatedModal';
import { MapPin, Check, Plus, AlertCircle, Sparkles, X, ChevronRight, Compass, ArrowLeft } from 'lucide-react';
import { SERVICEABLE_MUMBAI_ZONES } from '../../data/mockData';

export const AddressPickerModal: React.FC = () => {
  const {
    addressPickerOpen,
    setAddressPickerOpen,
    customer,
    selectedAddressId,
    setSelectedAddressId,
    showToast,
    goBack,
    pushNav,
    getPreviousTitle,
  } = useApp();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPincode, setNewPincode] = useState('');
  const [newLocality, setNewLocality] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newLabel, setNewLabel] = useState('Home');
  const [outsideZoneDetected, setOutsideZoneDetected] = useState(false);
  const [notifiedEmail, setNotifiedEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  const handleClose = () => {
    setIsAddingNew(false);
    setOutsideZoneDetected(false);
    goBack();
  };

  const handleBack = () => {
    if (isAddingNew) {
      setIsAddingNew(false);
      setOutsideZoneDetected(false);
      goBack();
    } else {
      handleClose();
    }
  };

  const handleStartAddNew = () => {
    setIsAddingNew(true);
    pushNav('address_picker_add', 'step', 'Add New Address');
  };

  useEffect(() => {
    const handleSubStepClosed = () => {
      setIsAddingNew(false);
      setOutsideZoneDetected(false);
    };
    window.addEventListener('close-address-add-substep', handleSubStepClosed);
    return () => window.removeEventListener('close-address-add-substep', handleSubStepClosed);
  }, []);

  useEffect(() => {
    if (!addressPickerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addressPickerOpen, isAddingNew]);

  if (!addressPickerOpen) return null;

  // Check if pincode is Mumbai
  const checkPincodeServiceability = (pin: string) => {
    setNewPincode(pin);
    if (pin.length === 6) {
      const allPincodes = SERVICEABLE_MUMBAI_ZONES.flatMap((z) => z.pincodes);
      // Valid if starts with 400 or in list
      const isMumbai = pin.startsWith('400') || allPincodes.includes(pin);
      if (!isMumbai) {
        setOutsideZoneDetected(true);
      } else {
        setOutsideZoneDetected(false);
      }
    } else {
      setOutsideZoneDetected(false);
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    const addr = customer.savedAddresses.find((a) => a.id === id);
    showToast(`Address switched to: ${addr?.locality || 'Selected'}`);
    goBack();
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (outsideZoneDetected) return;

    if (!newBuilding || !newLocality || !newPincode) {
      showToast('Please fill in building, locality, and 6-digit pincode');
      return;
    }

    const newId = `addr-${Date.now()}`;
    const newAddr = {
      id: newId,
      label: newLabel,
      address: `${newBuilding}, ${newLocality}`,
      locality: newLocality,
      zone: (newLocality.toLowerCase().includes('worli') || newLocality.toLowerCase().includes('colaba')
        ? 'South Mumbai'
        : newLocality.toLowerCase().includes('powai')
        ? 'Central Line'
        : newLocality.toLowerCase().includes('vashi')
        ? 'Navi Mumbai'
        : 'Western Line') as any,
      pincode: newPincode,
      isDefault: false,
    };

    customer.savedAddresses.push(newAddr);
    setSelectedAddressId(newId);
    showToast(`New address added: ${newLocality}`);
    setIsAddingNew(false);
    goBack();
  };

  return (
    <AnimatedModal
      isOpen={addressPickerOpen}
      onClose={handleClose}
      variant="sheet"
      maxWidth="max-w-md"
      className="p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="w-11 h-11 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center justify-center shrink-0"
            title={isAddingNew ? 'Back to Saved Addresses' : 'Close Address Picker'}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-[14px] bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">
              {isAddingNew ? 'Add Mumbai Address' : 'Select Delivery Address'}
            </h3>
            <p className="text-xs text-gray-500">Service available across Mumbai Metro</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-11 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition flex items-center justify-center shrink-0"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Existing Addresses List */}
      {!isAddingNew ? (
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[60vh] pr-0.5">
          <div className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            Saved Mumbai Locations
          </div>

          {customer.savedAddresses.map((addr) => {
            const isSelected = addr.id === selectedAddressId;
            return (
              <div
                key={addr.id}
                onClick={() => handleSelectAddress(addr.id)}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer flex items-start justify-between gap-3 shadow-sm ${
                  isSelected
                    ? 'border-[#FF5A5F] bg-[#FFF5F6] shadow-[#FF5A5F]/10'
                    : 'border-gray-200/90 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#FF5A5F] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">{addr.label}</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {addr.zone}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {addr.address} · {addr.pincode}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#FF5A5F] text-white flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Address Button */}
          <button
            type="button"
            onClick={handleStartAddNew}
            className="w-full mt-2 min-h-[44px] py-3 px-4 rounded-[20px] border-2 border-dashed border-gray-200 hover:border-[#FF5A5F] hover:bg-[#FFF5F6] text-gray-700 hover:text-[#FF5A5F] text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Mumbai Address</span>
          </button>

          {/* Service Area Info */}
          <div className="mt-4 p-3.5 rounded-[20px] bg-gray-50 border border-gray-100 text-xs text-gray-500 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-700">Currently serving:</span> Western Line
              (Bandra to Borivali), South Mumbai, Central Line (Dadar to Thane), and Navi Mumbai.
            </div>
          </div>
        </div>
      ) : (
        /* Add New Address Form */
        <form onSubmit={handleSaveNewAddress} className="mt-4 space-y-3.5 overflow-y-auto max-h-[60vh] pr-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase">New Address Details</span>
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-[#FF5A5F] font-bold hover:underline min-h-[44px] px-2 flex items-center"
            >
              Back to saved
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Address Tag</label>
            <div className="flex flex-wrap gap-2">
              {['Home', 'Office', "Parent's Home", 'Other'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewLabel(tag)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                    newLabel === tag
                      ? 'bg-[#12222E] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Flat, Floor & Building Name
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 802, Oberoi Sky City"
              value={newBuilding}
              onChange={(e) => setNewBuilding(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F] shadow-2xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Locality / Area / Street
            </label>
            <input
              type="text"
              placeholder="e.g. Carter Road, Bandra West"
              value={newLocality}
              onChange={(e) => setNewLocality(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F] shadow-2xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Mumbai Pincode (6 digits)
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 400050 (or test 411001 for out-of-zone alert)"
              value={newPincode}
              onChange={(e) => checkPincodeServiceability(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] border border-gray-200 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F] shadow-2xs"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Tip: Try pincode 400050 for Bandra, or 411001 to test outside-zone validation.
            </p>
          </div>

          {/* Out of service area screen / alert */}
          {outsideZoneDetected && (
            <div className="p-4 rounded-[20px] bg-amber-50 border border-amber-200 text-amber-900 animate-fadeIn space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-amber-900">
                    ChakaChak isn't available in this area yet!
                  </h5>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    We currently service Mumbai Metro exclusively (South Mumbai, Western Line, Central Line, Navi Mumbai). We're expanding rapidly!
                  </p>
                </div>
              </div>

              {!notifySuccess ? (
                <div className="pt-2 border-t border-amber-200/80">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Notify me when ChakaChak launches here:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={notifiedEmail}
                      onChange={(e) => setNotifiedEmail(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (notifiedEmail) setNotifySuccess(true);
                      }}
                      className="min-h-[44px] px-4 py-2 bg-[#FF5A5F] text-white text-xs font-bold rounded-xl hover:bg-[#E8355C]"
                    >
                      Notify Me
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>You're on the priority waitlist! We'll email you the moment we launch.</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={outsideZoneDetected}
            className={`w-full min-h-[44px] py-3 rounded-[20px] text-sm font-bold text-white transition shadow-md ${
              outsideZoneDetected
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 shadow-[#FF5A5F]/30 active:scale-98'
            }`}
          >
            Save & Use This Address
          </button>
        </form>
      )}
    </AnimatedModal>
  );
};

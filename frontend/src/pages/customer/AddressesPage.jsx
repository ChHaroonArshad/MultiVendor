// frontend/src/pages/customer/AddressesPage.jsx
import { useState } from "react";
import { mockAddresses } from "../../data/customerMockData";

export function AddressesPage() {
  const [addresses, setAddresses] = useState(mockAddresses);
  const setDefault = (id) => setAddresses((list) => list.map((a) => ({ ...a, isDefault: a.id === id })));
  const remove = (id) => setAddresses((list) => list.filter((a) => a.id !== id));

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Saved Addresses</h1>
          <p className="text-sm text-[#6B6B6B]">Manage where your orders are delivered.</p>
        </div>
        <button className="text-xs font-medium bg-[#111111] text-white px-4 py-2.5 rounded-full hover:opacity-90 transition-all shrink-0">Add New Address</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <div key={address.id} className="border border-[#E5E5E5] rounded-2xl p-5 bg-white relative">
            {address.isDefault && <span className="absolute top-4 right-4 text-[10px] uppercase bg-[#FBF6E9] text-[#8a6f14] border border-[#C9A227]/40 px-2 py-1 rounded-full">Default</span>}
            <p className="text-sm font-medium text-[#111111]">{address.name}</p>
            <p className="text-xs text-[#6B6B6B] mt-1">{address.phone}</p>
            <p className="text-xs text-[#6B6B6B] mt-2 leading-relaxed">{address.line}, {address.city}, {address.province} {address.postal}<br />{address.country}</p>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <button className="text-[#111111] hover:text-[#C9A227] transition-colors">Edit</button>
              {!address.isDefault && <button onClick={() => setDefault(address.id)} className="text-[#111111] hover:text-[#C9A227] transition-colors">Set as default</button>}
              <button onClick={() => remove(address.id)} className="text-red-500 hover:text-red-600 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
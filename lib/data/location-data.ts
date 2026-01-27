// Indian states with Maharashtra districts structure
export const indianStates = [
  { value: 'andhra_pradesh', label: 'Andhra Pradesh' },
  { value: 'arunachal_pradesh', label: 'Arunachal Pradesh' },
  { value: 'assam', label: 'Assam' },
  { value: 'bihar', label: 'Bihar' },
  { value: 'chhattisgarh', label: 'Chhattisgarh' },
  { value: 'goa', label: 'Goa' },
  { value: 'gujarat', label: 'Gujarat' },
  { value: 'haryana', label: 'Haryana' },
  { value: 'himachal_pradesh', label: 'Himachal Pradesh' },
  { value: 'jharkhand', label: 'Jharkhand' },
  { value: 'karnataka', label: 'Karnataka' },
  { value: 'kerala', label: 'Kerala' },
  { value: 'madhya_pradesh', label: 'Madhya Pradesh' },
  { value: 'maharashtra', label: 'Maharashtra' },
  { value: 'manipur', label: 'Manipur' },
  { value: 'meghalaya', label: 'Meghalaya' },
  { value: 'mizoram', label: 'Mizoram' },
  { value: 'nagaland', label: 'Nagaland' },
  { value: 'odisha', label: 'Odisha' },
  { value: 'punjab', label: 'Punjab' },
  { value: 'rajasthan', label: 'Rajasthan' },
  { value: 'sikkim', label: 'Sikkim' },
  { value: 'tamil_nadu', label: 'Tamil Nadu' },
  { value: 'telangana', label: 'Telangana' },
  { value: 'tripura', label: 'Tripura' },
  { value: 'uttar_pradesh', label: 'Uttar Pradesh' },
  { value: 'uttarakhand', label: 'Uttarakhand' },
  { value: 'west_bengal', label: 'West Bengal' },
  { value: 'delhi', label: 'Delhi (NCT)' },
  { value: 'jammu_kashmir', label: 'Jammu & Kashmir' },
  { value: 'ladakh', label: 'Ladakh' },
  { value: 'puducherry', label: 'Puducherry' },
  { value: 'chandigarh', label: 'Chandigarh' },
  { value: 'andaman_nicobar', label: 'Andaman & Nicobar Islands' },
  { value: 'dadra_nagar_haveli', label: 'Dadra & Nagar Haveli and Daman & Diu' },
  { value: 'lakshadweep', label: 'Lakshadweep' },
]

// Maharashtra districts for district-level structure
export const maharashtraDistricts = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'mumbai_suburban', label: 'Mumbai Suburban' },
  { value: 'pune', label: 'Pune' },
  { value: 'nagpur', label: 'Nagpur' },
  { value: 'thane', label: 'Thane' },
  { value: 'nashik', label: 'Nashik' },
  { value: 'aurangabad', label: 'Aurangabad' },
  { value: 'solapur', label: 'Solapur' },
  { value: 'kolhapur', label: 'Kolhapur' },
  { value: 'sangli', label: 'Sangli' },
  { value: 'satara', label: 'Satara' },
  { value: 'ratnagiri', label: 'Ratnagiri' },
  { value: 'sindhudurg', label: 'Sindhudurg' },
  { value: 'ahmednagar', label: 'Ahmednagar' },
  { value: 'jalgaon', label: 'Jalgaon' },
  { value: 'dhule', label: 'Dhule' },
  { value: 'nandurbar', label: 'Nandurbar' },
  { value: 'latur', label: 'Latur' },
  { value: 'osmanabad', label: 'Osmanabad' },
  { value: 'beed', label: 'Beed' },
  { value: 'nanded', label: 'Nanded' },
  { value: 'parbhani', label: 'Parbhani' },
  { value: 'hingoli', label: 'Hingoli' },
  { value: 'jalna', label: 'Jalna' },
  { value: 'buldhana', label: 'Buldhana' },
  { value: 'akola', label: 'Akola' },
  { value: 'washim', label: 'Washim' },
  { value: 'amravati', label: 'Amravati' },
  { value: 'yavatmal', label: 'Yavatmal' },
  { value: 'wardha', label: 'Wardha' },
  { value: 'chandrapur', label: 'Chandrapur' },
  { value: 'gadchiroli', label: 'Gadchiroli' },
  { value: 'bhandara', label: 'Bhandara' },
  { value: 'gondia', label: 'Gondia' },
  { value: 'raigad', label: 'Raigad' },
  { value: 'palghar', label: 'Palghar' },
]

// Helper to get state label from value
export const getStateLabel = (value: string): string => {
  const state = indianStates.find(s => s.value === value)
  return state?.label || value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Helper to get district label from value
export const getDistrictLabel = (value: string): string => {
  const district = maharashtraDistricts.find(d => d.value === value)
  return district?.label || value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}


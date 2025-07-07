// Position mapping object
export const positionMapping: Record<string, string> = {
  'transportation_general': 'Transportation - General',
  'city_cab-dispatch': 'Transportation Dispatcher',
  'city_cab-driver': 'Taxi Driver',
  'city_cab-admin_assistant': 'Administrative Assistant',
  'ggmt-csr': 'Customer Service Representative',
  'ggmt-driver': 'NEMT Driver',
  'al_general': 'Assisted Living - General',
  'acf-qmap': 'QMAP',
  'acf-pcp': 'PCP',
  'ms_general': 'Medical Supply - General',
  'medical_supply-dme_specialist': 'DME Specialist',
  'medical_supply-deliver_tech': 'Delivery Technician',
  'medical_supply-inventory_tech': 'Inventory Technician',
  'gs_general': 'Gas Station - General',
  'gas_station-manager': 'Gas Station Manager',
  'gas_station-assistant_manager': 'Gas Station Assistant Manager',
  'gas_station-attendant': 'Gas Station Attendant',
  'general': 'General Application'
};

// Helper functions
export const getPositionLabel = (value: string): string => {
  return positionMapping[value] || value;
};

export const getPositionValue = (label: string): string => {
  const entry = Object.entries(positionMapping).find(([_, displayLabel]) => displayLabel === label);
  return entry ? entry[0] : label;
};
// Define valid blood groups
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Compatibility maps
// Who can a patient RECEIVE from?
export const receiveFromMap: Record<BloodGroup, BloodGroup[]> = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'], // Universal donor, but can only receive O-
};

// Who can a donor GIVE to?
export const giveToMap: Record<BloodGroup, BloodGroup[]> = {
  'A+':  ['A+', 'AB+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
  'O+':  ['A+', 'B+', 'AB+', 'O+'],
  'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal donor
};

/**
 * Returns a list of compatible donor blood groups for a given patient blood group.
 * @param patientGroup The blood group of the person receiving blood
 * @returns Array of compatible blood groups they can receive from
 */
export function getCompatibleDonors(patientGroup: BloodGroup): BloodGroup[] {
  return receiveFromMap[patientGroup] || [];
}

/**
 * Returns a list of blood groups that can receive from a given donor blood group.
 * @param donorGroup The blood group of the person donating blood
 * @returns Array of blood groups they can give to
 */
export function getCompatibleReceivers(donorGroup: BloodGroup): BloodGroup[] {
  return giveToMap[donorGroup] || [];
}

/**
 * Checks if a specific donation is compatible.
 * @param donorGroup The blood group of the donor
 * @param receiverGroup The blood group of the receiver
 * @returns Boolean indicating compatibility
 */
export function isCompatible(donorGroup: BloodGroup, receiverGroup: BloodGroup): boolean {
  return receiveFromMap[receiverGroup]?.includes(donorGroup) || false;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export type AddressField = keyof Address;
export type AddressErrors = Partial<Record<AddressField, string>>;

export const EMPTY_ADDRESS: Address = { street: "", city: "", region: "", postalCode: "", country: "" };

export const isAddressEmpty = (address: Address) => Object.values(address).every((part) => !part.trim());

/** Client-side validation with deliberately loose rules: postal formats vary far too much by country to enforce one. */
export function validateAddress(address: Address): AddressErrors {
  const errors: AddressErrors = {};
  if (address.street.trim().length < 3) errors.street = "Enter your street address.";
  if (!address.city.trim()) errors.city = "Enter your city or town.";
  if (!address.region.trim()) errors.region = "Enter your state or region.";
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(address.postalCode.trim())) errors.postalCode = "Enter a valid postal code.";
  if (!address.country.trim()) errors.country = "Enter your country.";
  return errors;
}

export function addressLines(address: Address): string[] {
  const cityLine = [address.city, address.region, address.postalCode].map((part) => part.trim()).filter(Boolean).join(", ");
  return [address.street.trim(), cityLine, address.country.trim()].filter(Boolean);
}

export const formatAddress = (address: Address) => addressLines(address).join(", ");

export const mapsSearchUrl = (address: Address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(address))}`;

/** Keyless embeddable map used for the optional preview. */
export const mapsEmbedUrl = (address: Address) => `https://maps.google.com/maps?q=${encodeURIComponent(formatAddress(address))}&output=embed`;

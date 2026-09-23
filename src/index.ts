/**
 * masker — lightweight, type-safe data masking for Node.js / Bun / browsers.
 *
 * @packageDocumentation
 */

// Primitive maskers
export { maskEmail } from './mask/email.js';
export { maskPhone } from './mask/phone.js';
export { maskName } from './mask/name.js';
export { maskAddress } from './mask/address.js';
export { maskCreditCard, isLuhnValid } from './mask/credit-card.js';
export { maskIdCard } from './mask/id-card.js';
export { maskBankAccount } from './mask/bank-account.js';
export { maskMac } from './mask/mac.js';
export { maskVehicle, maskVin, maskLicensePlate } from './mask/vehicle.js';
export { maskJwt } from './mask/jwt.js';
export { maskIp } from './mask/ip.js';
export { maskUrl } from './mask/url.js';
export { maskGeneric } from './mask/generic.js';

// Object / schema / logger
export { maskObject, maskFields, maskLog, createMasker } from './object/mask-object.js';

// Types
export type {
  BaseMaskOptions,
  SliceMaskOptions,
  EmailMaskOptions,
  PhoneMaskOptions,
  NameMaskOptions,
  AddressMaskOptions,
  CreditCardMaskOptions,
  IdCardMaskOptions,
  BankAccountMaskOptions,
  MacMaskOptions,
  VehicleKind,
  VehicleMaskOptions,
  JwtMaskOptions,
  JwtPartVisibility,
  Ipv4MaskOptions,
  Ipv6MaskOptions,
  IpMaskOptions,
  UrlMaskOptions,
  ValueMasker,
  PresetName,
  MaskFieldConfig,
  SchemaMasker,
  ObjectSchema,
  FieldMap,
  MaskLogOptions,
  CreateMaskerOptions,
  Masker,
} from './types.js';

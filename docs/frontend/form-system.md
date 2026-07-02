# VaanForge Form System

VaanForge forms use shared field wrappers in `frontend/src/app/components/forms/VaanForgeFields.tsx`.

## Components

- `TextInput`
- `TextareaInput`
- `SelectInput`
- `Combobox`
- `CheckboxInput`
- `RadioInput`
- `SwitchInput`
- `DatePicker`
- `FileUpload`
- `SearchInput`
- `PasswordInput`
- `OTPInput`
- `PaymentFieldWrapper`

## Field states

Every field must support default, hover, focus, blur, filled, dirty, touched, validating, valid, invalid, disabled, read-only, and loading states.

## Field content

Each field should expose a label, helper text, error text, success text, required marker, optional marker, and character count where useful.

## Validation rule

Frontend validation improves UX, but backend validation remains the source of truth for billing, plan access, permissions, tenant ownership, uploads, and webhooks.

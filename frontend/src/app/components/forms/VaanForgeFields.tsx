import * as React from "react";
import { Eye, EyeOff, Search, UploadCloud } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";

export type FieldState = "default" | "hover" | "focus" | "blur" | "filled" | "dirty" | "touched" | "validating" | "valid" | "invalid" | "disabled" | "read-only" | "loading";

type FieldFrameProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  helperText?: string;
  errorText?: string;
  successText?: string;
  characterCount?: number;
  maxLength?: number;
  children: React.ReactNode;
};

function FieldFrame({ id, label, required, optional, helperText, errorText, successText, characterCount, maxLength, children }: FieldFrameProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  return (
    <div className="grid gap-2" data-field-state={errorText ? "invalid" : successText ? "valid" : "default"}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? <span aria-label="required" className="ml-1 text-destructive">*</span> : null}
          {optional ? <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span> : null}
        </Label>
        {typeof characterCount === "number" ? <span className="text-xs text-muted-foreground">{characterCount}{maxLength ? `/${maxLength}` : ""}</span> : null}
      </div>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            "aria-describedby": [helperText ? helpId : "", errorText ? errorId : ""].filter(Boolean).join(" ") || undefined,
            "aria-invalid": Boolean(errorText)
          })
        : children}
      {helperText && !errorText ? <p id={helpId} className="text-xs text-muted-foreground">{helperText}</p> : null}
      {successText && !errorText ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{successText}</p> : null}
      {errorText ? <p id={errorId} role="alert" className="text-xs text-destructive">{errorText}</p> : null}
    </div>
  );
}

export type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & Omit<FieldFrameProps, "children" | "id" | "characterCount"> & { id?: string };

export function TextInput({ id: providedId, label, required, optional, helperText, errorText, successText, maxLength, value, ...props }: TextFieldProps) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} required={required} optional={optional} helperText={helperText} errorText={errorText} successText={successText} characterCount={typeof value === "string" ? value.length : undefined} maxLength={maxLength}>
      <Input id={id} maxLength={maxLength} value={value} {...props} />
    </FieldFrame>
  );
}

export function SearchInput({ className, ...props }: TextFieldProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <TextInput className={cn("pl-9", className)} {...props} />
    </div>
  );
}

export function PasswordInput({ id: providedId, label, required, optional, helperText, errorText, successText, value, ...props }: TextFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} required={required} optional={optional} helperText={helperText} errorText={errorText} successText={successText}>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} value={value} className="pr-10" {...props} />
        <Button type="button" variant="ghost" size="icon" aria-label={visible ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </Button>
      </div>
    </FieldFrame>
  );
}

export type TextareaFieldProps = Omit<React.ComponentProps<typeof Textarea>, "id"> & Omit<FieldFrameProps, "children" | "id" | "characterCount"> & { id?: string };

export function TextareaInput({ id: providedId, label, required, optional, helperText, errorText, successText, maxLength, value, ...props }: TextareaFieldProps) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} required={required} optional={optional} helperText={helperText} errorText={errorText} successText={successText} characterCount={typeof value === "string" ? value.length : undefined} maxLength={maxLength}>
      <Textarea id={id} maxLength={maxLength} value={value} {...props} />
    </FieldFrame>
  );
}

export function SelectInput({ id: providedId, label, required, optional, helperText, errorText, successText, value, onValueChange, options, placeholder = "Select" }: Omit<FieldFrameProps, "children" | "id"> & { id?: string; value?: string; onValueChange?: (value: string) => void; options: Array<{ label: string; value: string; disabled?: boolean }>; placeholder?: string }) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} required={required} optional={optional} helperText={helperText} errorText={errorText} successText={successText}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </FieldFrame>
  );
}

export function CheckboxInput({ id: providedId, label, helperText, errorText, checked, onCheckedChange, disabled }: { id?: string; label: string; helperText?: string; errorText?: string; checked?: boolean; onCheckedChange?: (checked: boolean) => void; disabled?: boolean }) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} helperText={helperText} errorText={errorText}>
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(value: boolean | "indeterminate") => onCheckedChange?.(Boolean(value))} />
    </FieldFrame>
  );
}

export function SwitchInput({ id: providedId, label, helperText, errorText, checked, onCheckedChange, disabled }: { id?: string; label: string; helperText?: string; errorText?: string; checked?: boolean; onCheckedChange?: (checked: boolean) => void; disabled?: boolean }) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} helperText={helperText} errorText={errorText}>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </FieldFrame>
  );
}

export function RadioInput({ id: providedId, label, helperText, errorText, value, onValueChange, options }: Omit<FieldFrameProps, "children" | "id"> & { id?: string; value?: string; onValueChange?: (value: string) => void; options: Array<{ label: string; value: string; disabled?: boolean }> }) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} helperText={helperText} errorText={errorText}>
      <RadioGroup value={value} onValueChange={onValueChange} className="grid gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <RadioGroupItem value={option.value} disabled={option.disabled} />
            {option.label}
          </label>
        ))}
      </RadioGroup>
    </FieldFrame>
  );
}

export function FileUpload({ id: providedId, label, helperText, errorText, accept, disabled, onChange }: { id?: string; label: string; helperText?: string; errorText?: string; accept?: string; disabled?: boolean; onChange?: React.ChangeEventHandler<HTMLInputElement> }) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <FieldFrame id={id} label={label} helperText={helperText} errorText={errorText}>
      <label htmlFor={id} className={cn("flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-5 text-center text-sm transition hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring", disabled && "cursor-not-allowed opacity-60")}>
        <UploadCloud className="mb-2 size-5 text-muted-foreground" />
        <span className="font-medium">Choose file</span>
        <span className="text-xs text-muted-foreground">{accept || "Allowed files depend on this workflow."}</span>
        <input id={id} type="file" accept={accept} disabled={disabled} onChange={onChange} className="sr-only" />
      </label>
    </FieldFrame>
  );
}

export const Combobox = SelectInput;
export const DatePicker = TextInput;
export const OTPInput = TextInput;
export const PaymentFieldWrapper = FieldFrame;

import { useState } from 'react';
import { validateFields, type Validator } from '../logic/validation';

/**
 * Controlled form state with validation on submit and error clearing on edit.
 *
 * Errors surface when the shopper submits, not while they are mid-word —
 * validating a half-typed email is how forms end up shouting at people.
 */
export function useForm<T extends Record<string, string>>(
  initial: T,
  rules: Partial<Record<keyof T, Validator>>
) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  return {
    values,
    errors,
    setField: (field: keyof T, value: string) => {
      setValues((v) => ({ ...v, [field]: value }));
      setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
    },
    validate: (): boolean => {
      const found = validateFields(values, rules as Record<string, Validator>);
      setErrors(found as Partial<Record<keyof T, string>>);
      return Object.keys(found).length === 0;
    },
    reset: () => {
      setValues(initial);
      setErrors({});
    },
  };
}

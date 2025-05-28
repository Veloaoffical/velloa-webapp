import React, { useEffect, useState } from 'react';
import { AddressAutofill } from '@mapbox/search-js-react';
import { Input } from '@/components/ui/input';

interface AddressAutofillInputProps extends React.ComponentProps<typeof Input> {
  accessToken: string;
}

export const AddressAutofillInput: React.FC<AddressAutofillInputProps> = ({ accessToken, ...inputProps }) => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Autofill = AddressAutofill as any;

  return (
    <Autofill accessToken={accessToken}>
      <Input {...inputProps} />
    </Autofill>
  );
}; 
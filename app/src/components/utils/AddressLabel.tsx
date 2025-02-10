import { FC } from 'react';

interface AddressLabelProps {
  label: string;
  address?: string;
}

export const AddressLabel: FC<AddressLabelProps> = ({ label, address }) => {
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address}`;
  };

  return (
    <div className="address-label">
      <span className="body-text">{label}:</span>
      <span className="code-text">{shortenAddress(address || '')}</span>
    </div>
  );
}; 
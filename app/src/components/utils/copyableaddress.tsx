import { FC, useState } from 'react';
import { shortenAddress } from '../../utils/string';
import '../../style/Typography.css';

interface CopyableAddressProps {
  address: string;
  shortened?: boolean;
}

export const CopyableAddress: FC<CopyableAddressProps> = ({ 
  address = '',
  shortened = true 
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="copyable-address">
      <span className="code-text" title={address}>
        {shortened ? shortenAddress(address) : address}
      </span>
      <button 
        className="secondary-button" 
        onClick={handleCopy} 
        title={copySuccess ? "Copied!" : "Copy address"}
      >
        <div className={`copy-icon ${copySuccess ? 'copied' : ''}`} />
      </button>
    </div>
  );
};
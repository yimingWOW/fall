import { FC, useState } from 'react';
import '../../style/button.css';

interface PriceDisplayProps {
  aToB: number;
  bToA: number;
  tokenASymbol?: string;
  tokenBSymbol?: string;
}

export const PriceDisplay: FC<PriceDisplayProps> = ({ 
  aToB, 
  bToA, 
  tokenASymbol = 'A', 
  tokenBSymbol = 'B' 
}) => {
  const [isPriceReversed, setIsPriceReversed] = useState(false);

  return (
    <div className="combine-text">
      <span className="body-text">Price:</span>
      {!isPriceReversed ? (
        <span className="code-text">
          1 {tokenASymbol} = {aToB.toFixed(6)} {tokenBSymbol}
        </span>
      ) : (
        <span className="code-text">
          1 {tokenBSymbol} = {bToA.toFixed(6)} {tokenASymbol}
        </span>
      )}
      <button 
        className="swap-direction-toggle" 
        onClick={() => setIsPriceReversed(!isPriceReversed)}
      />
    </div>
  );
}; 
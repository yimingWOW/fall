import { PoolStatusInfo } from '../../utils/getPoolDetail';

export const shouldInitializePool = (status: PoolStatusInfo | null) => {
    if (!status) return true;
    return !(
      status.createPool1 &&
      status.createPool2 &&
      status.initLendingPool1 &&
      status.initLendingPool2 &&
      status.initLendingPool3
    );
  };
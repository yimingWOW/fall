import { RouteConfig } from './types';
import Dashboard from '../components/Dashboard';
import { Guide } from '../components/Guide/Guide';
import { SwapForm } from '../components/Swap/SwapForm';
import { LenderPoolList } from '../components/Lend/LendPoolList';
import { BorrowerPoolList } from '../components/Borrow/BorrowPoolList';
import { LiquidateForm } from '../components/Liquidate/LiquidateForm';
import { AmmList } from '../components/Amm/AmmList';
import { FarmForm } from '../components/Farm/FarmForm';
import { LenderPoolItem } from '../components/Lend/LendPoolItem';
import { BorrowerPoolItem } from '../components/Borrow/BorrowPoolItem';
import { PoolItem } from '../components/Farm/PoolItem';
import { CreatePoolForm } from '../components/Farm/CreatePoolForm';
import { Introduction } from '../components/Introduction/introduction';
export const routes: RouteConfig[] = [
  {
    path: '/',
    component: Dashboard,
    children: [
      {
        path: '',
        component: Guide,
      },
      {
        path: 'introduction',
        component: Introduction,
        meta: { title: 'Introduction' }
      },
      {
        path: 'guide',
        component: Guide,
        meta: { title: 'Guide' }
      },
      {
        path: 'amm',
        component: AmmList,
        meta: { title: 'AMM' }
      },
      {
        path: 'swap',
        component: SwapForm,
        meta: { title: 'Swap', requiresWallet: true }
      },
      {
        path: 'farm',
        component: FarmForm,
        meta: { title: 'Farm' },
      },
      {
        path: 'farm/create',
        component: CreatePoolForm,
        meta: { title: 'Create Farm Pool' }
      },
      {
        path: 'farm/:poolAddress',
        component: PoolItem,
        meta: { title: 'Farm Pool Item' }
      },
      {
        path: 'lend',
        component: LenderPoolList,
        meta: { title: 'Lender Pool' },
      },
      {
        path: 'lend/:poolAddress',
        component: LenderPoolItem,
      },
      {
        path: 'borrow',
        component: BorrowerPoolList,
        meta: { title: 'Borrower Pool' },
      },
      {
        path: 'borrow/:poolAddress',
        component: BorrowerPoolItem,
      },
      {
        path: 'liquidate',
        component: LiquidateForm,
        meta: { title: 'Liquidate' }
      },
      {
        path: 'liquidate/:poolAddress',
        component: LiquidateForm,
        meta: { title: 'Liquidate' }
      },
    ]
  }
]; 
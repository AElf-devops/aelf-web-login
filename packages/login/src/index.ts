import WebLoginProvider, { useWebLogin, WebLoginContext } from './context';
import useLoginState from './hooks/useLoginState';
import useWebLoginEvent from './hooks/useWebLoginEvent';
import useMultiWallets from './hooks/useMultiWallets';
import useCallContract from './hooks/useCallContract';
import usePortkeyLock from './hooks/usePortkeyLock';
import useGetAccount from './hooks/useGetAccount';

import getContractBasicAsync from './utils/getContractBasicAsync';
import detectDiscoverProvider from './wallets/discover/detectProvider';
import detectNightElf from './wallets/elf/detectNightElf';

export * from './utils/pluginPages';
export * from './wallets/types';
export * from './types';
export * from './constants';
export * from './config';
export * from './errors';
export * from './hooks/useMultiWallets';
export * from './hooks/useCallContract';
export * from './context';
export type { ConfirmLogoutDialogProps } from './components/CofirmLogoutDialog';

export {
  WebLoginContext,
  WebLoginProvider,
  useWebLogin,
  useLoginState,
  useWebLoginEvent,
  useMultiWallets,
  useCallContract,
  usePortkeyLock,
  useGetAccount,
  getContractBasicAsync,
  detectDiscoverProvider,
  detectNightElf,
};

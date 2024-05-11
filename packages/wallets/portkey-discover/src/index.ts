import {
  BaseWalletAdapter,
  LoginStateEnum,
  makeError,
  ERR_CODE,
  TWalletInfo,
  WalletName,
  TSignatureParams,
  ConnectedWallet,
  TWalletError,
} from '@aelf-web-login/wallet-adapter-base';
import {
  Accounts,
  IPortkeyProvider,
  NetworkType,
  ProviderError,
  ChainIds,
  DappEvents,
} from '@portkey/provider-types';
import { ChainId } from '@portkey/types';
import detectDiscoverProvider from './detectProvider';
import checkSignatureParams from './signatureParams';
import zeroFill from './zeroFill';

type TDiscoverEventsKeys = Array<Exclude<DappEvents, 'connected' | 'message' | 'error'>>;

export type TPluginNotFoundCallback = (openPluginStorePage: () => void) => void;
export type TOnClickCryptoWallet = (continueDefaultBehaviour: () => void) => void;
export interface PortkeyDiscoverWalletAdapterConfig {
  networkType: NetworkType;
  chainId: ChainId;
  autoRequestAccount: boolean;
  autoLogoutOnDisconnected: boolean;
  autoLogoutOnNetworkMismatch: boolean;
  autoLogoutOnAccountMismatch: boolean;
  autoLogoutOnChainMismatch: boolean;
  onClick?: TOnClickCryptoWallet;
  onPluginNotFound?: TPluginNotFoundCallback;
}

// autoRequestAccount: true,
// autoLogoutOnAccountMismatch: true,
// autoLogoutOnChainMismatch: true,
// autoLogoutOnDisconnected: true,
// autoLogoutOnNetworkMismatch: true,
// onClick: continueDefaultBehaviour => {
//   continueDefaultBehaviour();
// },
// onPluginNotFound: openStore => {
//   console.log(234);
//   openStore();
// }

export const PortkeyDiscoverName = 'PortkeyDiscover' as WalletName<'PortkeyDiscover'>;

export class PortkeyDiscoverWallet extends BaseWalletAdapter {
  name = PortkeyDiscoverName;
  icon =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCAxMDgwIDEwODAiPjxkZWZzPjxzdHlsZT4ua3tmaWxsOiNmZmY7fS5se2ZpbGw6dXJsKCNjKTt9Lm17aXNvbGF0aW9uOmlzb2xhdGU7fS5ue2ZpbGw6dXJsKCNqKTtvcGFjaXR5Oi42Nzt9Lm4sLm97bWl4LWJsZW5kLW1vZGU6bXVsdGlwbHk7fS5ve2ZpbGw6dXJsKCNpKTtvcGFjaXR5Oi40MTt9LnB7ZmlsbDp1cmwoI2YpO30ucXtmaWxsOiMwMGNlN2M7fS5ye2ZpbGw6IzJhN2RlMTt9LnN7ZmlsbDp1cmwoI2cpO30udHtmaWxsOnVybCgjYik7fS51e2ZpbGw6dXJsKCNoKTt9LnZ7ZmlsbDp1cmwoI2QpO30ud3tmaWxsOnVybCgjZSk7fTwvc3R5bGU+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iNjYzLjIyIiB5MT0iMTAuNTIyIiB4Mj0iMzIzLjIwMiIgeTI9IjM1OS4zNzIiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgMCwgMCkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMyNGNlN2IiLz48c3RvcCBvZmZzZXQ9Ii44MjgiIHN0b3AtY29sb3I9IiMyNTdjZTEiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYyIgeDE9IjMzNi4zNjgiIHkxPSItOTguMjg5IiB4Mj0iODQzLjk1OSIgeTI9IjI4MC41OCIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAxLCAwLCAwKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjQ3NiIgc3RvcC1jb2xvcj0iIzI0Y2U3YiIvPjxzdG9wIG9mZnNldD0iLjgyOCIgc3RvcC1jb2xvcj0iIzI1N2NlMSIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJkIiB4MT0iMTk2LjU2NCIgeTE9IjIzMS44OTQiIHgyPSI5MzIuODIyIiB5Mj0iMjMxLjg5NCIgeGxpbms6aHJlZj0iI2MiLz48bGluZWFyR3JhZGllbnQgaWQ9ImUiIHgxPSIyMTQuODczIiB5MT0iMjk5LjIwNyIgeDI9IjgwMy44OCIgeTI9IjI5OS4yMDciIHhsaW5rOmhyZWY9IiNjIi8+PGxpbmVhckdyYWRpZW50IGlkPSJmIiB4MT0iMjA2LjM4NiIgeTE9IjkzNi4yMDIiIHgyPSI3ODUuNjY0IiB5Mj0iNjMzLjA3IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEsIDAsIDAsIDEsIDAsIDApIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIuMzY3IiBzdG9wLWNvbG9yPSIjMjU3Y2UxIi8+PHN0b3Agb2Zmc2V0PSIuODUiIHN0b3AtY29sb3I9IiMyNGNlN2IiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjIwNC42MTEiIHkxPSI5NTcuMDQzIiB4Mj0iODEyLjQzNiIgeTI9IjYzOC45NzMiIHhsaW5rOmhyZWY9IiNjIi8+PGxpbmVhckdyYWRpZW50IGlkPSJoIiB4MT0iNTc0LjY4NCIgeTE9IjY3NS43MjMiIHgyPSI1NzkuMDU1IiB5Mj0iNjczLjQzNSIgeGxpbms6aHJlZj0iI2MiLz48bGluZWFyR3JhZGllbnQgaWQ9ImkiIHgxPSIxMDQyLjA3IiB5MT0iMTMwOC4zMyIgeDI9IjgzOC43NzciIHkyPSIxNzQ1LjYzIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKC01NDAuMTUxIC02MzEuNDg1KSByb3RhdGUoLjM5KSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmZiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJqIiB4MT0iMjEzOTcuNjU1IiB5MT0iMTE2MC4zOTIiIHgyPSIyMTE5MS4xNjMiIHkyPSIxNjA0LjU3MyIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyMTk3My43NjggLTYzMS40ODUpIHJvdGF0ZSgxNzkuNjEpIHNjYWxlKDEgLTEpIiB4bGluazpocmVmPSIjaSIvPjwvZGVmcz48ZyBjbGFzcz0ibSI+PGcgaWQ9ImEiPjxnPjxnPjxwYXRoIGNsYXNzPSJxIiBkPSJNNTY5LjYyMSw1NDAuMTMxYzQ3LjkzNiwxMDQuNTE0LDk1Ljg3MywyMDkuMDI4LDE0My44MDksMzEzLjU0M2wtMjAyLjcxOSwuMjU4YzE1LjExNCwzNC4xNzUsMzAuMjI5LDY4LjM1LDQ1LjM0MywxMDIuNTI0bDMxNS4zNzIsLjM5OWMtNjYuNDg4LTE0Ni40NTMtMTMyLjk3NS0yOTIuOTA2LTE5OS40NjMtNDM5LjM2LS4wMjEtNjUuOTI5LS4wNDMtMTMxLjg1Ny0uMDY0LTE5Ny43ODYtMzQuMTM2LDE0LjQ0NS02OC4yNzIsMjguODkxLTEwMi40MDgsNDMuMzM2LC4wNDMsNTkuMDI4LC4wODYsMTE4LjA1NywuMTI5LDE3Ny4wODVaIi8+PHBhdGggY2xhc3M9ImsiIGQ9Ik0zNTQuODc0LDg1My41NDVjNDIuMTMyLTEwNC44NTgsODQuMjY1LTIwOS43MTYsMTI2LjM5Ny0zMTQuNTc0LS4wODYtNTguNjQyLS4xNzItMTE3LjI4My0uMjU4LTE3NS45MjQtMzQuMTc5LTE0LjY4Mi02OC4zNTgtMjkuMzY0LTEwMi41MzctNDQuMDQ2LC40Myw2Ni4wNTgsLjg2LDEzMi4xMTUsMS4yOSwxOTguMTczbC0xNzkuNDA3LDQzOS42ODJjMTE4LjU3My0uMTI5LDIzNy4xNDUtLjI1OCwzNTUuNzE4LS4zODctMTUuMDQ3LTM0LjE3OS0zMC4wOTUtNjguMzU4LTQ1LjE0Mi0xMDIuNTM3LTUyLjAyMS0uMTI5LTEwNC4wNDEtLjI1OC0xNTYuMDYyLS4zODdaIi8+PGNpcmNsZSBjbGFzcz0idCIgY3g9IjUyMS40NTgiIGN5PSIxNTUuOTY2IiByPSIzOC43NzIiLz48Y2lyY2xlIGNsYXNzPSJsIiBjeD0iNjU1LjM2NCIgY3k9IjEzOS44MTEiIHI9IjYxLjkyNyIvPjxjaXJjbGUgY2xhc3M9InYiIGN4PSI1ODEuNTkiIGN5PSIyMzEuODk0IiByPSIyOS42MTciLz48Y2lyY2xlIGNsYXNzPSJ3IiBjeD0iNTIyLjg5NCIgY3k9IjI5OS4yMDciIHI9IjIzLjY5NCIvPjxwYXRoIGNsYXNzPSJwIiBkPSJNNTc2LjYxOSw3MzcuNzgxYy0uMzM2LS41OTktMy4zNTctNi4wOS04LjEyNy0xMy4yMTQtMS40MzEtMi4xMzctMy4wNDktNC40NDItNC45MjEtNi45NTItOC43OC0xMS43NjgtNDAuOTY4LTU0LjkxNC02OS45ODctNTEuMDA3LTIuNzY2LC4zNzItNC43MjksLjk3LTYuMzMzLDEuNDgxLTIzLjc1MSw3LjU3Mi0zNC4yNCwzNC41MTUtNDEuMDYsNTEuNTc0LTExLjg0MSwyOS42MTYtMjUuNTM5LDYxLjczMy00Mi4xMzYsMTAwLjMwNSw4NS4zMjcsLjIyOCwxNzAuNjUzLC40NTYsMjU1Ljk4LC42ODQtNTkuOTkzLTU1Ljk4MS04MC4xNTktNzcuMDY1LTgzLjQxNS04Mi44NzFaIi8+PHBhdGggY2xhc3M9InMiIGQ9Ik01MDUuNzc3LDcxNC4zNzljLTEzLjc0Nyw3Ljk5Mi0yNi44OTEsMTEuODU4LTMzLjcwMiwxMy42ODktMTIuNDM0LDMuMzQyLTIzLjIzNCw0LjQ5NC0zMS4wNDUsNC44ODRsLTM2Ljc5Niw4Ny4yNTJjODUuMjY2LC4wNjUsMTcwLjUzMiwuMTI5LDI1NS43OTksLjE5NC0xNC42Ni0zNS45ODQtMjkuMzIxLTcxLjk2OS00My45ODEtMTA3Ljk1NC0xMC41OTgtMjAuNzAyLTIwLjE4NC0zMi4zMTgtMjguNDg4LTM4LjU4NS02LjI4MS00Ljc0LTExLjgyOC02LjQyLTE2LjUyNi02LjY1Ni0uMzQ4LS4wMTgtLjY5Mi0uMDI3LTEuMDMtLjAzLTIwLjc4MS0uMTQ1LTI5LjUwNiwyNy4wMTgtNjQuMjMsNDcuMjA1WiIvPjxwYXRoIGNsYXNzPSJyIiBkPSJNNTM4LjkyNCw5NjguMTgxYzEuNDYzLDAsMS40NjUtMi4yNzMsMC0yLjI3M3MtMS40NjUsMi4yNzMsMCwyLjI3M2gwWiIvPjxsaW5lIGNsYXNzPSJ1IiB4MT0iNTc4LjAwNCIgeTE9IjY3NC42NTQiIHgyPSI1NzUuOTQxIiB5Mj0iNjc0LjM5NiIvPjwvZz48cGF0aCBjbGFzcz0ibyIgZD0iTTM3OS44MzEsNTE3LjEwOWMzMy44MzUsNy4yODcsNjcuNjcsMTQuNTc0LDEwMS41MDUsMjEuODYybC0xMjYuNDUsMzE0LjU2MiwxNTYuMDY2LC4zOTljMTUuMDQ2LDM0LjE3OSwzMC4wOTIsNjguMzU4LDQ1LjEzOCwxMDIuNTM3LTExOC41NzcsLjE1LTIzNy4xNTMsLjMwMS0zNTUuNzMsLjQ1MSw1OS44MjQtMTQ2LjYwNCwxMTkuNjQ4LTI5My4yMDcsMTc5LjQ3MS00MzkuODExWiIvPjxwYXRoIGNsYXNzPSJuIiBkPSJNNjcxLjkyOCw1MTcuNTMyYy0zNC4xMTQsNy41MjktNjguMjI5LDE1LjA1OC0xMDIuMzQzLDIyLjU4Nyw0Ny45NDcsMTA0LjUxNiw5NS44OTQsMjA5LjAzMSwxNDMuODQxLDMxMy41NDctNjcuNDk2LC4wODktMTM0Ljk5MSwuMTc3LTIwMi40ODcsLjI2NiwxNS4wNDksMzQuMTgzLDMwLjA5OSw2OC4zNjcsNDUuMTQ4LDEwMi41NSwxMDUuMTE1LC4xMjYsMjEwLjIzLC4yNTMsMzE1LjM0NSwuMzc5LTY2LjUwMi0xNDYuNDQzLTEzMy4wMDMtMjkyLjg4Ni0xOTkuNTA1LTQzOS4zMjlaIi8+PC9nPjwvZz48L2c+PC9zdmc+';

  private _loginState: LoginStateEnum;
  private _wallet: TWalletInfo | null;
  private _detectProvider: IPortkeyProvider | null;
  private _chainId: ChainId;
  private _config: PortkeyDiscoverWalletAdapterConfig;

  constructor(config: PortkeyDiscoverWalletAdapterConfig) {
    super();
    this._loginState = LoginStateEnum.INITIAL;
    this._wallet = null;
    this._detectProvider = null;
    this._chainId = config.chainId;
    this._config = config;
    this.detect().then(() => {
      this.autoRequestAccountHandler();
    });
  }

  get loginState() {
    return this._loginState;
  }

  get wallet() {
    return this._wallet as TWalletInfo;
  }

  async autoRequestAccountHandler() {
    const canLoginEargly = localStorage.getItem(ConnectedWallet);
    if (canLoginEargly !== this.name) {
      return;
    }
    if (!this._config.autoRequestAccount) {
      return;
    }
    console.log('this._config.autoRequestAccount', this._config.autoRequestAccount);
    await this.loginEagerly();
  }

  // private executeOnce<T extends (...args: any) => any>(fn: T) {
  //   if (typeof fn !== 'function') {
  //     throw new Error('please pass a function');
  //   }
  //   let result: ReturnType<T>;
  //   return (...rest: any) => {
  //     if (fn) {
  //       result = fn.apply(this, rest);
  //       fn = null as any;
  //     }
  //     return result;
  //   };
  // }

  private async detect(): Promise<IPortkeyProvider> {
    if (this._detectProvider?.isConnected()) {
      return this._detectProvider;
    }
    this._detectProvider = await detectDiscoverProvider();
    if (this._detectProvider) {
      if (!this._detectProvider.isPortkey) {
        throw makeError(ERR_CODE.NOT_PORTKEY);
      }
      this.listenProviderEvents();
      return this._detectProvider;
    } else {
      throw makeError(ERR_CODE.WITHOUT_DETECT_PROVIDER);
    }
  }

  private async onAccountsSuccess(
    provider: IPortkeyProvider,
    accounts: Accounts,
  ): Promise<TWalletInfo> {
    let nickName = 'Wallet 01';
    const address = accounts[this._chainId]![0].split('_')[1];
    try {
      nickName = await provider.request({ method: 'wallet_getWalletName' });
    } catch (error) {
      console.warn(error);
    }
    this._wallet = {
      address,
      extraInfo: {
        accounts,
        nickName,
        provider,
      },
    };
    console.log('_wallet', this._wallet);
    this._loginState = LoginStateEnum.CONNECTED;
    localStorage.setItem(ConnectedWallet, this.name);
    this.emit('connected', this._wallet);
    return this._wallet;
  }

  private onAccountsFail(err: TWalletError) {
    throw err;
  }

  async login(): Promise<TWalletInfo> {
    try {
      if (!this._detectProvider) {
        throw makeError(ERR_CODE.WITHOUT_DETECT_PROVIDER);
      }

      const provider = this._detectProvider;
      const chainId = this._chainId;

      this._loginState = LoginStateEnum.CONNECTING;

      const network = await provider.request({ method: 'network' });
      console.log('network', network);
      if (network !== this._config.networkType) {
        this.onAccountsFail(makeError(ERR_CODE.NETWORK_TYPE_NOT_MATCH));
        return;
      }

      let accounts = await provider.request({ method: 'accounts' });
      if (accounts[chainId] && accounts[chainId]!.length > 0) {
        return await this.onAccountsSuccess(provider, accounts);
      }
      accounts = await provider.request({ method: 'requestAccounts' });
      if (accounts[chainId] && accounts[chainId]!.length > 0) {
        return await this.onAccountsSuccess(provider, accounts);
      } else {
        this.onAccountsFail(makeError(ERR_CODE.ACCOUNTS_IS_EMPTY));
        return;
      }
    } catch (error) {
      this._loginState = LoginStateEnum.INITIAL;
      this.emit('error', makeError(ERR_CODE.UNKNOWN, error));
      return;
    }
  }

  async loginEagerly() {
    try {
      if (!this._detectProvider) {
        throw makeError(ERR_CODE.WITHOUT_DETECT_PROVIDER);
      }

      const provider = this._detectProvider;
      const chainId = this._chainId;

      this._loginState = LoginStateEnum.CONNECTING;

      const { isUnlocked } = await provider.request({ method: 'wallet_getWalletState' });

      console.log('isUnlocked', isUnlocked);
      if (!isUnlocked) {
        this._loginState = LoginStateEnum.INITIAL;
        return;
      }

      const network = await provider.request({ method: 'network' });
      if (network !== this._config.networkType) {
        this.onAccountsFail(makeError(ERR_CODE.NETWORK_TYPE_NOT_MATCH));
        return;
      }

      const accounts = await provider.request({ method: 'accounts' });
      if (accounts[chainId] && accounts[chainId]!.length > 0) {
        await this.onAccountsSuccess(provider, accounts);
      } else {
        this.onAccountsFail(makeError(ERR_CODE.DISCOVER_LOGIN_EAGERLY_FAIL));
      }
    } catch (error) {
      this.emit('error', makeError(ERR_CODE.UNKNOWN, error));
    }
  }

  async logout() {
    this._wallet = null;
    this._loginState = LoginStateEnum.INITIAL;
    localStorage.removeItem(ConnectedWallet);
    this.emit('disconnected');
  }

  async getSignature(params: TSignatureParams): Promise<{
    error: number;
    errorMessage: string;
    signature: string;
    from: string;
  }> {
    checkSignatureParams(params);
    if (!this._wallet) {
      throw makeError(ERR_CODE.DISCOVER_NOT_CONNECTED);
    }
    if (!this._detectProvider) {
      throw makeError(ERR_CODE.WITHOUT_DETECT_PROVIDER);
    }

    const signInfo = params.signInfo;
    const signedMsgObject = await this._detectProvider.request({
      method: 'wallet_getSignature',
      payload: {
        data: signInfo || params.hexToBeSign,
      },
    });
    const signedMsgString = [
      zeroFill(signedMsgObject.r),
      zeroFill(signedMsgObject.s),
      `0${signedMsgObject.recoveryParam!.toString()}`,
    ].join('');
    return {
      error: 0,
      errorMessage: '',
      signature: signedMsgString,
      from: 'discover',
    };
  }

  private listenProviderEvents() {
    if (!this._detectProvider) {
      return;
    }
    const onDisconnected = (error: ProviderError) => {
      console.log('onDisconnected', error);
      if (!this._wallet) return;
      if (this._config.autoLogoutOnDisconnected) {
        this.logout();
      }
    };
    const onNetworkChanged = (networkType: NetworkType) => {
      if (networkType !== this._config.networkType) {
        if (this._config.autoLogoutOnNetworkMismatch) {
          this.logout();
        }
      }
    };
    const onAccountsChanged = (accounts: Accounts) => {
      if (!this._wallet) return;
      const chainId = this._chainId;
      if (
        !accounts[chainId] ||
        accounts[chainId]!.length === 0 ||
        accounts[chainId]!.find((addr) => addr !== this._wallet!.address)
      ) {
        if (this._config.autoLogoutOnAccountMismatch) {
          this.logout();
        }
      }
    };
    const onChainChanged = (chainIds: ChainIds) => {
      if (chainIds.find((id) => id === this._chainId)) {
        if (this._config.autoLogoutOnChainMismatch) {
          this.logout();
        }
      }
    };

    const discoverEventsMap = {
      disconnected: onDisconnected,
      networkChanged: onNetworkChanged,
      accountsChanged: onAccountsChanged,
      chainChanged: onChainChanged,
    };
    (Object.keys(discoverEventsMap) as TDiscoverEventsKeys).forEach((ele) => {
      this._detectProvider?.on(ele, discoverEventsMap[ele]);
    });
  }
}
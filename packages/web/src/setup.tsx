import React, { useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { PortkeySDKProvider } from 'aelf-web-login';

function SDKRoot() {
  return (
    <PortkeySDKProvider networkType="TESTNET" chainType="aelf">
      <></>
    </PortkeySDKProvider>
  );
}

export default function setup() {
  const container = document.createElement('div');
  container.id = 'aelf-web-login-root';
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SDKRoot />
    </React.StrictMode>,
  );
}
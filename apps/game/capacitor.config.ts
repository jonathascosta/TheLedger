import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.jonathas.theledger',
  appName: 'The Ledger',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#F4EDDC',
  },
  plugins: {
    StatusBar: { style: 'LIGHT', overlaysWebView: true },
  },
};

export default config;

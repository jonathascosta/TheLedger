/** Build-time settings (`VITE_*`); see docs/STORE.md. */
interface ImportMetaEnv {
  /** The owner's AdMob rewarded unit; Google's test unit when unset. */
  readonly VITE_ADMOB_REWARDED_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

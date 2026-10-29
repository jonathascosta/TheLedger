# The App Store and AdMob: what the owner sets up

What the code cannot do for itself. [ARCHITECTURE.md](ARCHITECTURE.md) says how the pieces fit.

## AdMob (sponsors)

Until these steps are done the app shows Google's test ads, which never pay.

1. In [AdMob](https://admob.google.com), add the app (iOS, The Ledger) and note its **app id**
   (`ca-app-pub-…~…`).
2. Create one **rewarded** ad unit and note its id (`ca-app-pub-…/…`).
3. Privacy & messaging: create the **GDPR** message (and the US states message if wanted) for
   the app. The app shows it before the first ad where the law asks for it, then Apple's tracking
   prompt.
4. Give the build the two ids:
   - the app id as the `ADMOB_APP_ID` build setting of the Xcode project (it replaces Google's
     test app id in `apps/game/ios/App/App.xcodeproj`);
   - the rewarded unit as `VITE_ADMOB_REWARDED_ID` when building the web part
     (`VITE_ADMOB_REWARDED_ID=ca-app-pub-…/… pnpm ios:sync`).
5. In App Store Connect, App Privacy: declare the data the Google Mobile Ads SDK collects
   (identifiers, usage data, diagnostics; used for third-party advertising), and that the app
   asks for tracking permission.

The website shows no sponsors until its AdSense account is approved (docs/PRODUCT.md, Sponsors).

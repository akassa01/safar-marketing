import { NextResponse } from "next/server";

// Apple Universal Links association file. iOS fetches this to learn which paths
// on getsafar.ca open the Safar app instead of Safari.
// App ID = <TeamID>.<BundleID> = FGW6Q324TL.com.armankassam.Safar
// Served at https://getsafar.ca/.well-known/apple-app-site-association as JSON.
const AASA = {
  applinks: {
    details: [
      {
        appIDs: ["FGW6Q324TL.com.armankassam.Safar"],
        components: [
          { "/": "/u/*/city/*", comment: "Shared city — opens the sharer's trip" },
        ],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(AASA, {
    headers: { "Content-Type": "application/json" },
  });
}

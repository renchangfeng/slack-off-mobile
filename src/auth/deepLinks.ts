import * as Linking from "expo-linking";
import { readAuthParams } from "./deepLinkParams";

export const authRedirectUrl = Linking.createURL("auth/callback");
export { readAuthParams };

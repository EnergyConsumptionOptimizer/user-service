import { AccessToken } from "@domain/AccessToken";
import { AccessTokenPayload } from "@domain/AccessTokenPayload";

export interface RefreshResponse {
  tokens: AccessToken;
  user: AccessTokenPayload;
}

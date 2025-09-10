import { AccessTokensDTO } from "./AccessTokensDTO";
import { AccessToken } from "../domain/AccessToken";

export const AccessTokenMapper = {
  toDTO(token: AccessToken): AccessTokensDTO {
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      type: "Bearer",
    };
  },
};

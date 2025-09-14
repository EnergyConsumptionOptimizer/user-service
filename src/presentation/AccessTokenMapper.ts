import { AccessTokenDTO } from "./AccessTokenDTO";
import { AccessToken } from "../domain/AccessToken";

export const AccessTokenMapper = {
  toDTO(token: AccessToken): AccessTokenDTO {
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      type: "Bearer",
    };
  },
};

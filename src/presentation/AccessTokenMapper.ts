import { AccessToken } from "@domain/AccessToken";
import { AccessTokenDTO } from "./AccessTokenDTO";

export const AccessTokenMapper = {
  toDTO(token: AccessToken): AccessTokenDTO {
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      type: "Bearer",
    };
  },
};

package org.slitherlinkgame.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record RegistrationRequest(@NotEmpty String username,
                                  @NotEmpty @Email String email,
                                  @NotEmpty String password,
                                  @NotEmpty String userRole) {
}

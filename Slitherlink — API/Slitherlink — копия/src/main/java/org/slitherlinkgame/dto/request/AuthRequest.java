package org.slitherlinkgame.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record AuthRequest(@NotEmpty @Email String email,
                          @NotEmpty String password) {
}

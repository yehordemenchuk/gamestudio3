package org.slitherlinkgame.dto.response;

public record AuthResponse(String accessToken,
                           String refreshToken) {
}

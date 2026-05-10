package org.slitherlinkgame.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.AuthRequest;
import org.slitherlinkgame.dto.request.RefreshRequest;
import org.slitherlinkgame.dto.response.AuthResponse;
import org.slitherlinkgame.service.JwtService;
import org.slitherlinkgame.service.RefreshTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshService;

    @PostMapping("login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        String access = jwtService.generateAccessToken(request.email());
        String refresh = refreshService.create(request.email());

        return new AuthResponse(access, refresh);
    }

    @PostMapping("refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        String username = refreshService.verify(request.refreshToken());

        String newAccess = jwtService.generateAccessToken(username);

        return new AuthResponse(newAccess, request.refreshToken());
    }

    @PostMapping("logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        refreshService.delete(request.refreshToken());

        return ResponseEntity.ok().build();
    }
}

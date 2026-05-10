package org.slitherlinkgame.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.RegistrationRequest;
import org.slitherlinkgame.dto.response.UserResponse;
import org.slitherlinkgame.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users/")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody RegistrationRequest registrationRequest) throws JsonProcessingException {
        UserResponse userResponse = userService.registerUser(registrationRequest);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(userResponse.id())
                .toUri();

        return ResponseEntity.created(location).body(userResponse);
    }

    @GetMapping
    public List<ResponseEntity<UserResponse>> findAllUsers() {
        return userService.getAllUsers().stream().map(ResponseEntity::ok).toList();
    }

    @GetMapping("{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }
}

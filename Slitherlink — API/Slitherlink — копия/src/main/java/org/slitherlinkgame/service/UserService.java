package org.slitherlinkgame.service;

import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.RegistrationRequest;
import org.slitherlinkgame.dto.response.UserResponse;
import org.slitherlinkgame.entity.UserEntity;
import org.slitherlinkgame.mapper.UserEntityMapper;
import org.slitherlinkgame.repository.UserEntityJpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserEntityJpaRepository userEntityJpaRepository;
    private final UserEntityMapper userEntityMapper;

    @Transactional
    public UserResponse registerUser(RegistrationRequest registrationRequest) throws EntityExistsException {
        if (userEntityJpaRepository.existsByEmailOrUsername(registrationRequest.email(), registrationRequest.username())) {
            throw new EntityExistsException();
        }

        UserEntity userEntity = userEntityMapper.fromRegistrationRequest(registrationRequest);

        userEntityJpaRepository.save(userEntity);

        return userEntityMapper.toResponse(userEntity);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) throws EntityNotFoundException {
        return userEntityMapper.toResponse(userEntityJpaRepository.findByEmail(email)
                .orElseThrow(EntityNotFoundException::new));
    }

    public List<UserResponse> getAllUsers() {
        return userEntityJpaRepository.findAll()
                .stream().map(userEntityMapper::toResponse)
                .toList();
    }
}

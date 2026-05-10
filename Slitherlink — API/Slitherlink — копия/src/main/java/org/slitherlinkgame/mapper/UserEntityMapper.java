package org.slitherlinkgame.mapper;

import org.mapstruct.Mapper;
import org.slitherlinkgame.dto.request.RegistrationRequest;
import org.slitherlinkgame.dto.response.UserResponse;
import org.slitherlinkgame.entity.UserEntity;

@Mapper(componentModel = "spring")
public interface UserEntityMapper {
    UserEntity fromRegistrationRequest(RegistrationRequest registrationRequest);

    UserResponse toResponse(UserEntity userEntity);
}

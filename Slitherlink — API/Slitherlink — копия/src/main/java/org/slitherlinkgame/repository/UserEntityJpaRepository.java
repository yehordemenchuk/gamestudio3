package org.slitherlinkgame.repository;

import lombok.NonNull;
import org.slitherlinkgame.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserEntityJpaRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmailOrUsername(@NonNull String email, @NonNull String username);
}

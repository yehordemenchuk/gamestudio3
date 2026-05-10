package org.slitherlinkgame.repository;

import org.slitherlinkgame.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;



@Repository
public interface RatingJpaRepository extends JpaRepository<Rating, Long> {
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.game = :game")
    Double getAverageRatingByGame(@Param("game") String game);

    Rating findRatingByGameAndPlayer(String game, String player);
}

package org.slitherlinkgame.repository;

import org.slitherlinkgame.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreJpaRepository extends JpaRepository<Score, Long> {
    List<Score>  findTop5ByGameOrderByPointsDesc(String game);
}

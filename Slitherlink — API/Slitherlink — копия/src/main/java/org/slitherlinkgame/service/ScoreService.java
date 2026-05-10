package org.slitherlinkgame.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.ScoreRequest;
import org.slitherlinkgame.dto.response.ScoreResponse;
import org.slitherlinkgame.entity.Score;
import org.slitherlinkgame.mapper.ScoreMapper;
import org.slitherlinkgame.repository.ScoreJpaRepository;
import org.springframework.cache.annotation.CacheEvict;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreService {
    private final ScoreMapper scoreMapper;
    private final ScoreJpaRepository scoreRepository;

    @Caching(evict = {
            @CacheEvict(value = "topScores"),
            @CacheEvict(value = "scores", allEntries = true)
    })
    public ScoreResponse createScore(ScoreRequest request) {
        Score score = scoreMapper.fromRequest(request);
        return scoreMapper.toResponse(scoreRepository.save(score));
    }

    @Cacheable(value = "score")
    public ScoreResponse findScoreById(long id) {
        return scoreMapper.toResponse(findScoreEntityById(id));
    }

    @Cacheable(value = "scores")
    public List<ScoreResponse> findAll() {
        return scoreRepository.findAll().stream()
                .map(scoreMapper::toResponse)
                .toList();
    }


    @Cacheable(value = "topScores")
    public List<ScoreResponse> findTopByGame(String game) {
        return scoreRepository.findTop5ByGameOrderByPointsDesc(game).stream()
                .map(scoreMapper::toResponse)
                .toList();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "score"),
            @CacheEvict(value = "topScores"),
            @CacheEvict(value = "scores", allEntries = true)
    })
    public ScoreResponse updateScore(long id, ScoreRequest scoreRequest) throws EntityNotFoundException {
        Score score = findScoreEntityById(id);
        scoreMapper.updateScoreFromRequest(scoreRequest, score);

        return scoreMapper.toResponse(score);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "score"),
            @CacheEvict(value = "topScores", allEntries = true),
            @CacheEvict(value = "scores", allEntries = true)
    })
    public void deleteScoreById(long id) {
        Score score = findScoreEntityById(id);
        scoreRepository.delete(score);
    }

    private Score findScoreEntityById(long id) {
        return scoreRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Score with id " + id + " not found"));
    }
}
package org.slitherlinkgame.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.RatingRequest;
import org.slitherlinkgame.dto.response.AverageRatingResponse;
import org.slitherlinkgame.dto.response.RatingResponse;
import org.slitherlinkgame.entity.Rating;
import org.slitherlinkgame.mapper.RatingMapper;
import org.slitherlinkgame.repository.RatingJpaRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingService {
    private final RatingMapper ratingMapper;
    private final RatingJpaRepository ratingJpaRepository;

    @Caching(evict = {
            @CacheEvict(value = "avgRatings", key = "#request.game()"),
            @CacheEvict(value = "ratings", allEntries = true)
    })
    public RatingResponse saveRating(RatingRequest request) {
        Rating rating = ratingMapper.fromRequest(request);
        return ratingMapper.toResponse(ratingJpaRepository.save(rating));
    }

    @Cacheable(value = "rating")
    public RatingResponse findRatingById(long id) {
        return ratingMapper.toResponse(getRatingOrThrow(id));
    }

    @Cacheable(value = "playerRating")
    public RatingResponse findRatingByGameAndPlayer(String game, String player) {
        Rating rating = ratingJpaRepository.findRatingByGameAndPlayer(game, player);
        return ratingMapper.toResponse(rating);
    }

    @Cacheable(value = "avgRatings")
    public AverageRatingResponse getAverageRatingByGame(String game) {
        Double avg = ratingJpaRepository.getAverageRatingByGame(game);
        return new AverageRatingResponse(avg != null ? avg : 0.0);
    }

    @Cacheable(value = "ratings")
    public List<RatingResponse> findAllRatings() {
        return ratingJpaRepository.findAll().stream()
                .map(ratingMapper::toResponse)
                .toList();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "rating"),
            @CacheEvict(value = "avgRatings", allEntries = true),
            @CacheEvict(value = "ratings", allEntries = true),
            @CacheEvict(value = "playerRating", allEntries = true)
    })
    public void deleteRatingById(long id) {
        Rating rating = getRatingOrThrow(id);
        ratingJpaRepository.delete(rating);
    }

    private Rating getRatingOrThrow(long id) {
        return ratingJpaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rating with id " + id + " not found"));
    }
}
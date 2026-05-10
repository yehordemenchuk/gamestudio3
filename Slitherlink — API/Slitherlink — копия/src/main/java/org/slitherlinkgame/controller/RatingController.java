package org.slitherlinkgame.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.RatingRequest;
import org.slitherlinkgame.dto.response.AverageRatingResponse;
import org.slitherlinkgame.dto.response.RatingResponse;
import org.slitherlinkgame.service.RatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ratings/")
@RequiredArgsConstructor
public class RatingController {
    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<RatingResponse> saveRating(@RequestBody @Valid RatingRequest request) {
        RatingResponse response = ratingService.saveRating(request);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<RatingResponse> getRatingById(@PathVariable long id) {
        return ResponseEntity.ok(ratingService.findRatingById(id));
    }

    @GetMapping("/player")
    public ResponseEntity<RatingResponse> getRatingByPlayer(@RequestParam String game,
                                                            @RequestParam String player) {
        return ResponseEntity.ok(ratingService.findRatingByGameAndPlayer(game, player));
    }

    @GetMapping("/avg/{game}")
    public ResponseEntity<AverageRatingResponse> getAverageRating(@PathVariable String game) {
        return ResponseEntity.ok(ratingService.getAverageRatingByGame(game));
    }

    @GetMapping
    public ResponseEntity<List<RatingResponse>> getAllRatings() {
        return ResponseEntity.ok(ratingService.findAllRatings());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable long id) {
        ratingService.deleteRatingById(id);
        return ResponseEntity.noContent().build();
    }
}
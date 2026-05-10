package org.slitherlinkgame.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.ScoreRequest;
import org.slitherlinkgame.dto.response.ScoreResponse;
import org.slitherlinkgame.service.ScoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/scores")
@RequiredArgsConstructor
public class ScoreController {
    private final ScoreService scoreService;

    @PostMapping
    public ResponseEntity<ScoreResponse> createScore(@RequestBody @Valid ScoreRequest request) {
        ScoreResponse response = scoreService.createScore(request);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ScoreResponse> getScoreById(@PathVariable long id) {
        return ResponseEntity.ok(scoreService.findScoreById(id));
    }

    @GetMapping("/top/{game}")
    public ResponseEntity<List<ScoreResponse>> getTopScoresByGame(@PathVariable String game) {
        return ResponseEntity.ok(scoreService.findTopByGame(game));
    }

    @GetMapping
    public ResponseEntity<List<ScoreResponse>> getAllScores() {
        return ResponseEntity.ok(scoreService.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoreResponse> updateScore(@PathVariable long id,
                                                     @RequestBody @Valid ScoreRequest request) {
        return ResponseEntity.ok(scoreService.updateScore(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScore(@PathVariable long id) {
        scoreService.deleteScoreById(id);
        return ResponseEntity.noContent().build();
    }
}
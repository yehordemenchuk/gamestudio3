package org.slitherlinkgame.controller;


import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.CommentRequest;
import org.slitherlinkgame.dto.response.CommentResponse;
import org.slitherlinkgame.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;


@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(@RequestBody @Valid CommentRequest commentRequest) {
        CommentResponse commentResponse = commentService.createComment(commentRequest);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(commentResponse.id())
                .toUri();

        return ResponseEntity.created(location).body(commentResponse);
    }

    @GetMapping("{id}")
    public ResponseEntity<CommentResponse> findByIdComment(@PathVariable long id) throws EntityNotFoundException {
        return ResponseEntity.ok(commentService.findCommentById(id));
    }

    @GetMapping("{game}")
    public ResponseEntity<List<CommentResponse>> findAllCommentsByGame(@PathVariable String game) {
        return ResponseEntity.ok(commentService.findCommentsByGame(game));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> findAllComments() {
        return ResponseEntity.ok(commentService.findAllComments());
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteCommentById(@PathVariable long id) throws EntityNotFoundException {
        commentService.deleteCommentById(id);

        return ResponseEntity.noContent().build();
    }
}


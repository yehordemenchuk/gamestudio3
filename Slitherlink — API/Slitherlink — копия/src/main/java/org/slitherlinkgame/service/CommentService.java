package org.slitherlinkgame.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slitherlinkgame.dto.request.CommentRequest;
import org.slitherlinkgame.dto.response.CommentResponse;
import org.slitherlinkgame.entity.Comment;
import org.slitherlinkgame.mapper.CommentMapper;
import org.slitherlinkgame.repository.CommentJpaRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentMapper commentMapper;
    private final CommentJpaRepository commentRepository;

    @Caching(evict = {
            @CacheEvict(value = "comments", allEntries = true),
            @CacheEvict(value = "commentsByGame", allEntries = true)
    })
    public CommentResponse createComment(CommentRequest request) {
        System.out.println("Creating comment: " + request);

        Comment comment = commentMapper.fromRequest(request);
        return commentMapper.toResponse(commentRepository.save(comment));
    }


    @Cacheable(value = "comment")
    public CommentResponse findCommentById(long id) {
        return commentMapper.toResponse(getCommentOrThrow(id));
    }

    @Cacheable(value = "comments")
    public List<CommentResponse> findAllComments() {
        return commentRepository.findAll().stream()
                .map(commentMapper::toResponse)
                .toList();
    }


    @Cacheable(value = "commentsByGame")
    public List<CommentResponse> findCommentsByGame(String game) {
        return commentRepository.findCommentsByGame(game).stream()
                .map(commentMapper::toResponse)
                .toList();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "comment"),
            @CacheEvict(value = "comments", allEntries = true),
            @CacheEvict(value = "commentsByGame", allEntries = true)
    })
    public void deleteCommentById(long id) {
        Comment comment = getCommentOrThrow(id);
        commentRepository.delete(comment);
    }

    private Comment getCommentOrThrow(long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comment with id " + id + " not found"));
    }
}
package org.slitherlinkgame.mapper;

import org.mapstruct.Mapper;
import org.slitherlinkgame.dto.request.CommentRequest;
import org.slitherlinkgame.dto.response.CommentResponse;
import org.slitherlinkgame.entity.Comment;

@Mapper(componentModel = "spring")

public interface CommentMapper {
    Comment fromRequest(CommentRequest commentRequest);

    CommentResponse toResponse(Comment comment);
}

package org.slitherlinkgame.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.slitherlinkgame.dto.request.ScoreRequest;
import org.slitherlinkgame.dto.response.ScoreResponse;
import org.slitherlinkgame.entity.Score;

@Mapper(componentModel = "spring")
public interface ScoreMapper {
    Score fromRequest(ScoreRequest scoreRequest);

    ScoreResponse toResponse(Score score);

    void updateScoreFromRequest(ScoreRequest request,
                                @MappingTarget Score score);
}


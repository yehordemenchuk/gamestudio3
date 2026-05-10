package org.slitherlinkgame.mapper;

import org.mapstruct.Mapper;
import org.slitherlinkgame.dto.request.RatingRequest;
import org.slitherlinkgame.dto.response.RatingResponse;
import org.slitherlinkgame.entity.Rating;

@Mapper(componentModel = "spring")
public interface RatingMapper {
    Rating fromRequest(RatingRequest ratingRequest);
    RatingResponse toResponse(Rating rating);
}

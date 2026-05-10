package org.slitherlinkgame.repository;


import org.slitherlinkgame.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentJpaRepository extends JpaRepository<Comment, Long> {

    List<Comment> findCommentsByGame(String game);

}

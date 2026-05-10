package org.slitherlinkgame.entity;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

import java.util.Date;

@Entity
@NoArgsConstructor
@RequiredArgsConstructor
@Setter
@Getter
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NonNull
    private String game;

    @NonNull
    private Integer points;

    @NonNull
    private String player;

    @NonNull
    private Date datedOn;

}

//написать мапперы + репозиторий + дто

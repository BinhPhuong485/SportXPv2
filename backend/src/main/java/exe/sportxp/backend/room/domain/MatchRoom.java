package exe.sportxp.backend.room.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "match_rooms")
public class MatchRoom {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @ColumnDefault("'Kèo giao lưu 2v2'")
    @Column(name = "title", length = Integer.MAX_VALUE)
    private String title;

    @NotNull
    @Column(name = "play_time", nullable = false)
    private OffsetDateTime playTime;

    @NotNull
    @ColumnDefault("4")
    @Column(name = "max_slots", nullable = false)
    private Integer maxSlots;

    @ColumnDefault("'{}'")
    @Column(name = "current_players")
    private List<UUID> currentPlayers;

    @ColumnDefault("1000")
    @Column(name = "min_elo")
    private Integer minElo;

    @ColumnDefault("1600")
    @Column(name = "max_elo")
    private Integer maxElo;

    @ColumnDefault("40000")
    @Column(name = "fee_per_person")
    private Integer feePerPerson;

    @ColumnDefault("'OPEN'")
    @Column(name = "status", length = Integer.MAX_VALUE)
    private String status;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @NotNull
    @ColumnDefault("1")
    @Column(name = "room_version", nullable = false)
    private Short roomVersion;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @NotNull
    @ColumnDefault("'PUBLIC'")
    @Column(name = "visibility", nullable = false, length = Integer.MAX_VALUE)
    private String visibility;

    @NotNull
    @ColumnDefault("true")
    @Column(name = "host_plays", nullable = false)
    private Boolean hostPlays;

    @Column(name = "cancellation_deadline")
    private OffsetDateTime cancellationDeadline;

    @NotNull
    @ColumnDefault("1")
    @Column(name = "schedule_revision", nullable = false)
    private Integer scheduleRevision;

    @NotNull
    @ColumnDefault("''")
    @Column(name = "notes", nullable = false, length = Integer.MAX_VALUE)
    private String notes;

    @NotNull
    @ColumnDefault("''")
    @Column(name = "court_label", nullable = false, length = Integer.MAX_VALUE)
    private String courtLabel;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "ended_at")
    private OffsetDateTime endedAt;

    @Column(name = "cancellation_reason", length = Integer.MAX_VALUE)
    private String cancellationReason;

    @NotNull
    @ColumnDefault("'PUBLIC_RECRUIT'")
    @Column(name = "room_type", nullable = false, length = Integer.MAX_VALUE)
    private String roomType;

    @Column(name = "join_code", length = Integer.MAX_VALUE)
    private String joinCode;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_rated", nullable = false)
    private Boolean isRated;

    @Column(name = "zalo_group_link", length = Integer.MAX_VALUE)
    private String zaloGroupLink;


}
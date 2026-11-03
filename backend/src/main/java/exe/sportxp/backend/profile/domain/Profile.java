package exe.sportxp.backend.profile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "profiles")
public class Profile {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "display_name", nullable = false, length = Integer.MAX_VALUE)
    private String displayName;

    @Column(name = "avatar_url", length = Integer.MAX_VALUE)
    private String avatarUrl;

    @Column(name = "elo_rating")
    private Integer eloRating;

    @Column(name = "tier_name", length = Integer.MAX_VALUE)
    private String tierName;

    @NotNull
    @ColumnDefault("100")
    @Column(name = "trust_score", nullable = false)
    private Integer trustScore;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "win_streak", nullable = false)
    private Integer winStreak;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "onboarding_step", nullable = false)
    private Integer onboardingStep;

    @NotNull
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "public_id", nullable = false)
    private UUID publicId;

    @NotNull
    @ColumnDefault("'public'")
    @Column(name = "social_visibility", nullable = false, length = Integer.MAX_VALUE)
    private String socialVisibility;

    @Column(name = "district", length = Integer.MAX_VALUE)
    private String district;

    @ColumnDefault("'TP. Hồ Chí Minh'")
    @Column(name = "city", length = Integer.MAX_VALUE)
    private String city;

    @Column(name = "area_code", length = Integer.MAX_VALUE)
    private String areaCode;

    @Column(name = "zalo_phone", length = Integer.MAX_VALUE)
    private String zaloPhone;

    @Column(name = "zalo_link", length = Integer.MAX_VALUE)
    private String zaloLink;

    @Column(name = "facebook_link", length = Integer.MAX_VALUE)
    private String facebookLink;

    @Column(name = "bio", length = Integer.MAX_VALUE)
    private String bio;


}
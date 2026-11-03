package exe.sportxp.backend.court.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "courts")
public class Court {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "name", nullable = false, length = Integer.MAX_VALUE)
    private String name;

    @NotNull
    @Column(name = "address", nullable = false, length = Integer.MAX_VALUE)
    private String address;

    @ColumnDefault("1.8")
    @Column(name = "distance_km", precision = 4, scale = 1)
    private BigDecimal distanceKm;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "district", length = Integer.MAX_VALUE)
    private String district;

    @ColumnDefault("'TP. Hồ Chí Minh'")
    @Column(name = "city", length = Integer.MAX_VALUE)
    private String city;

    @Column(name = "area_code", length = Integer.MAX_VALUE)
    private String areaCode;

    @ColumnDefault("5.0")
    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating;

    @ColumnDefault("0")
    @Column(name = "review_count")
    private Integer reviewCount;

    @ColumnDefault("'[]'")
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "amenities")
    private Map<String, Object> amenities;


}
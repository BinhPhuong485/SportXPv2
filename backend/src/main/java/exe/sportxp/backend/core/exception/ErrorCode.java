package exe.sportxp.backend.core.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên yêu cầu"),
    SCHEDULE_CONFLICT(HttpStatus.CONFLICT, "Host hoặc VĐV đã có lịch thi đấu trùng khung giờ này"),
    ROOM_FULL(HttpStatus.CONFLICT, "Phòng đã đủ chỗ, hệ thống đã chuyển bạn vào danh sách chờ"),
    INVALID_JOIN_CODE(HttpStatus.BAD_REQUEST, "Mã phòng không chính xác hoặc phòng không tồn tại"),
    NOT_ROOM_MEMBER(HttpStatus.FORBIDDEN, "Bạn chưa phải là thành viên chính thức của buổi chơi này"),
    ALREADY_REGISTERED(HttpStatus.BAD_REQUEST, "Bạn đã đăng ký tham gia buổi chơi này trước đó"),
    MATCH_ALREADY_CONFIRMED(HttpStatus.BAD_REQUEST, "Trận đấu này đã được xác nhận kết quả trước đó"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ"),
    H2H_LIMIT_EXCEEDED(HttpStatus.OK, "Đã vượt trần 2 trận đối đầu/ngày, trận đấu chuyển sang Unrated"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra trong quá trình xử lý hệ thống");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}

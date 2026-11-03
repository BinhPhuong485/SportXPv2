export interface SportNotice {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  readAt?: Date | null;
  roomId?: string | null;
  kind?: string;
  isRead: boolean;
}

export const parseSportNotice = (json: Record<string, unknown>): SportNotice => {
  const kindStr = (json.kind as string) || 'GENERAL';
  let genTitle = 'Thông báo hệ thống';
  let genContent = 'Bạn có cập nhật mới từ SportXP.';

  switch (kindStr) {
    case 'PROMOTED':
      genTitle = 'Lên danh sách thi đấu chính thức';
      genContent = 'Bạn đã được chuyển từ danh sách chờ vào phòng chơi thành công!';
      break;
    case 'MEMBER_LEFT':
      genTitle = 'Thành viên rời phòng';
      genContent = 'Một thành viên vừa rời phòng đấu của bạn. Slot đã được mở lại.';
      break;
    case 'ROOM_UPDATED':
      genTitle = 'Điều kiện phòng thay đổi';
      genContent = 'Chủ phòng vừa cập nhật giờ hoặc sân đấu. Vui lòng xác nhận lại.';
      break;
    case 'ROOM_CANCELED':
      genTitle = 'Kèo đấu đã bị hủy';
      genContent = 'Chủ phòng đã hủy buổi chơi này.';
      break;
    case 'FRIEND_REQUEST':
      genTitle = 'Lời mời kết bạn mới';
      genContent = (json.content as string) || 'Có người chơi vừa gửi lời mời kết bạn.';
      break;
    default:
      genTitle = (json.title as string) || 'Thông báo';
      genContent = (json.content as string) || 'Bạn có tin nhắn mới.';
  }

  const createdAt = json.created_at ? new Date(json.created_at as string) : new Date();
  const readAt = json.read_at ? new Date(json.read_at as string) : null;

  return {
    id: json.id ? String(json.id) : Date.now().toString(),
    title: genTitle,
    content: genContent,
    roomId: (json.room_id as string) || null,
    kind: kindStr,
    createdAt,
    readAt,
    isRead: readAt !== null,
  };
};


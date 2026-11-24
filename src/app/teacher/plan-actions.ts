export async function saveTeachingPlanAction(
  _value: unknown,
): Promise<{ error?: string; message?: string }> {
  return {
    message: "Đã lưu kế hoạch bài dạy trực tiếp trên trình duyệt (xuất tệp Word/JSON để chia sẻ).",
  };
}

export async function applyTeachingPlanAction(
  _planId: string,
  _lessonId: string,
): Promise<{ error?: string; message?: string }> {
  return {
    error: "Chức năng giao trực tiếp vào tài khoản lớp học dùng trên máy chủ nội bộ của trường.",
  };
}

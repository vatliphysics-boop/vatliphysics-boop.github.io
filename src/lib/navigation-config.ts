/**
 * Cấu hình điều hướng website — mô hình 3 giai đoạn (Flipped Classroom)
 *
 * CHẶNG 1: TÁI THIẾT MENU.
 * - Mỗi mục menu phải trỏ tới một route có thật, HOẶC được đánh dấu
 *   `status: "planned"` để giao diện hiển thị nhãn "Đang xây dựng".
 * - Không tạo URL chứa tham số mà trang đích không xử lý.
 *
 * Route hiện có (đã kiểm tra):
 *   /hoc-lieu                       — kho học liệu công khai
 *   /hoc-lieu/phong-hat-nhan        — thí nghiệm 3D + video (có ?bai=B21..B25)
 *   /hoc-lieu/truc-quan             — phòng trực quan, mô phỏng 3D (có ?bai=)
 *   /hoc-lieu/thi-nghiem-ban-ra     — thí nghiệm bán rã, xử lý số liệu
 *   /hoc-lieu/lop-hoc-dao-nguoc     — hướng dẫn ba giai đoạn
 *   /hoc-lieu/ai                    — trợ lí học tập AI
 *   /hoc-lieu/chuong-trinh          — chương trình Vật lí 12
 *   /hoc-lieu/soan-ke-hoach         — soạn kế hoạch dạy học
 *   /hoc-lieu/ai-giao-vien          — studio công cụ giáo viên
 *   /demo-lesson                    — bài mẫu đủ 3 giai đoạn (có infographic
 *                                     lịch sử, bản đồ tư duy, trò chơi ôn tập)
 *   /gioi-thieu                     — giới thiệu dự án (có lịch sử nhà khoa học)
 *
 * Kho học liệu (/hoc-lieu và các trang materials) chỉ lọc theo
 * `type` | `bai` | `q` | `page`. KHÔNG có bộ lọc `phase`, nên menu
 * không dùng tham số `?phase=`.
 */

export type NavigationLinkStatus = "available" | "planned";

export interface NavigationLink {
  href: string;
  label: string;
  description?: string;
  /** "planned" → giao diện hiện nhãn "Đang xây dựng" và không cho điều hướng. */
  status?: NavigationLinkStatus;
}

export interface NavigationGroup {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  links: NavigationLink[];
}

/** Lối vào trung tâm, độc lập với ba giai đoạn. */
export const MATERIALS_HUB_LINK: NavigationLink = {
  href: "/hoc-lieu",
  label: "Kho học liệu",
  description: "Tất cả học liệu B21–B25",
  status: "available",
};

/** GIAI ĐOẠN 1 — TRƯỚC GIỜ HỌC */
export const PHASE_1_BEFORE_CLASS: NavigationGroup = {
  id: "phase-1-before",
  label: "Giai đoạn 1 — Trước giờ học",
  shortLabel: "Giai đoạn 1",
  description: "Chuẩn bị kiến thức tại nhà",
  links: [
    {
      href: "/hoc-lieu/phong-hat-nhan",
      label: "Video hoạt hình khoa học ngắn",
      description: "Mô hình hạt nhân 3D và video minh họa B21–B25",
      status: "available",
    },
    {
      href: "/hoc-lieu/truc-quan",
      label: "Mô phỏng tương tác trực tuyến",
      description: "Phòng trực quan, mô phỏng 3D từng bài",
      status: "available",
    },
    {
      href: "/demo-lesson?giai-doan=1",
      label: "Infographic tương tác & Sơ đồ lịch sử",
      description: "Dòng thời gian và chân dung nhà khoa học",
      status: "available",
    },
    {
      href: "/hoc-lieu?type=document",
      label: "Phiếu học tập số",
      description: "PDF và tài liệu chuẩn bị",
      status: "available",
    },
    {
      href: "/hoc-lieu?type=lecture_video",
      label: "Video từng bài giảng",
      description: "Bài giảng ghi hình theo từng bài",
      status: "available",
    },
  ],
};

/** GIAI ĐOẠN 2 — TRONG GIỜ HỌC */
export const PHASE_2_IN_CLASS: NavigationGroup = {
  id: "phase-2-during",
  label: "Giai đoạn 2 — Trong giờ học",
  shortLabel: "Giai đoạn 2",
  description: "Hoạt động trên lớp",
  links: [
    {
      href: "/hoc-lieu/thi-nghiem-ban-ra",
      label: "Dữ liệu thí nghiệm ảo & xử lý số liệu",
      description: "Đo đạc, dựng bảng số liệu, rút ra quy luật",
      status: "available",
    },
    {
      href: "/demo-lesson?giai-doan=2#mindmap",
      label: "Bản đồ tư duy cộng tác nhóm",
      description: "Cùng dựng sơ đồ trên một thiết bị",
      status: "available",
    },
    {
      href: "/demo-lesson?giai-doan=2#roleplay",
      label: "Trò chơi đóng vai & tình huống giả định",
      description: "Tình huống ứng dụng trong thực tiễn",
      status: "available",
    },
    {
      href: "/demo-lesson?giai-doan=2",
      label: "Trò chơi ôn tập cạnh tranh",
      description: "Chưa có chế độ thi đấu riêng; hiện chỉ có bài luyện tập nhanh trong bài mẫu",
      status: "planned",
    },
  ],
};

/** GIAI ĐOẠN 3 — SAU GIỜ HỌC */
export const PHASE_3_AFTER_CLASS: NavigationGroup = {
  id: "phase-3-after",
  label: "Giai đoạn 3 — Sau giờ học",
  shortLabel: "Giai đoạn 3",
  description: "Ôn tập và vận dụng",
  links: [
    {
      href: "/hoc-lieu?type=assessment",
      label: "Ôn tập & tự kiểm tra",
      description: "Đề kiểm tra và trắc nghiệm",
      status: "available",
    },
    {
      href: "/demo-lesson?giai-doan=3",
      label: "Phản hồi & tự điều chỉnh",
      description: "Tự đánh giá năng lực tự học và viết phản tư (bài mẫu)",
      status: "available",
    },
    {
      href: "/hoc-lieu/truc-quan",
      label: "Vận dụng & mở rộng",
      description: "Chưa có hoạt động vận dụng riêng; hiện mở phòng trực quan",
      status: "planned",
    },
  ],
};

/** Công cụ học sinh */
export const STUDENT_TOOLS: NavigationGroup = {
  id: "student-tools",
  label: "Dành cho học sinh",
  shortLabel: "Học sinh",
  description: "Tự học theo ba giai đoạn",
  links: [
    {
      href: "/hoc-lieu/lop-hoc-dao-nguoc",
      label: "Hướng dẫn ba giai đoạn",
      description: "Cách học theo mô hình lớp học đảo ngược",
      status: "available",
    },
    {
      href: "/demo-lesson",
      label: "Bài học mẫu tương tác",
      description: "Trải nghiệm đầy đủ một bài",
      status: "available",
    },
    {
      href: "/hoc-lieu/ai",
      label: "Trợ lí học tập AI",
      description: "Hỏi đáp về Vật lí hạt nhân",
      status: "available",
    },
  ],
};

/** Công cụ giáo viên */
export const TEACHER_TOOLS: NavigationGroup = {
  id: "teacher-tools",
  label: "Dành cho giáo viên",
  shortLabel: "Giáo viên",
  description: "Soạn giảng và quản lý lớp",
  links: [
    {
      href: "/hoc-lieu/chuong-trinh",
      label: "Chương trình Vật lí 12",
      description: "Cấu trúc chương 4 — Vật lí hạt nhân",
      status: "available",
    },
    {
      href: "/hoc-lieu/soan-ke-hoach",
      label: "Soạn kế hoạch dạy học",
      description: "Thiết kế bài dạy cho ba giai đoạn",
      status: "available",
    },
    {
      href: "/hoc-lieu/ai-giao-vien",
      label: "Công cụ giáo viên",
      description: "Studio soạn học liệu và đánh giá",
      status: "available",
    },
  ],
};

/** Thông tin dự án */
export const PROJECT_INFO: NavigationGroup = {
  id: "project-info",
  label: "Về dự án",
  shortLabel: "Dự án",
  description: "Nghiên cứu và phương pháp",
  links: [
    {
      href: "/gioi-thieu",
      label: "Giới thiệu học liệu & lịch sử khoa học",
      description: "Mục tiêu, phương pháp và tư liệu lịch sử",
      status: "available",
    },
  ],
};

/** Toàn bộ nhóm cho menu "Công cụ". */
export const PUBLIC_TOOL_GROUPS: NavigationGroup[] = [
  STUDENT_TOOLS,
  TEACHER_TOOLS,
  PROJECT_INFO,
];

/** Ba giai đoạn, dùng cho menu công khai và trang tổng quan. */
export const LEARNING_PHASE_GROUPS: NavigationGroup[] = [
  PHASE_1_BEFORE_CLASS,
  PHASE_2_IN_CLASS,
  PHASE_3_AFTER_CLASS,
];

/** Phẳng hoá mọi link công cụ/lộ trình (để xác định mục đang mở). */
export const PUBLIC_TOOL_LINKS = PUBLIC_TOOL_GROUPS.flatMap((g) => g.links);
export const LEARNING_PATH_LINKS = LEARNING_PHASE_GROUPS.flatMap((g) => g.links);

/* ------------------------------------------------------------------ */
/* Portal (giáo viên / học sinh đã đăng nhập)                          */
/* ------------------------------------------------------------------ */

export interface PortalNavItem {
  section: string;
  label: string;
  href: string;
}

export const TEACHER_NAVIGATION: PortalNavItem[] = [
  { section: "overview", label: "Tổng quan", href: "/teacher" },
  { section: "classes", label: "Lớp học", href: "/teacher/classes" },
  { section: "lessons", label: "Quản lý bài học", href: "/teacher/lessons" },
  {
    section: "materials",
    label: "Học liệu 3 giai đoạn",
    href: "/teacher/materials",
  },
  {
    section: "curriculum",
    label: "Chương trình Vật lí 12",
    href: "/teacher/curriculum",
  },
  { section: "plans", label: "Kế hoạch dạy học", href: "/teacher/plans" },
  { section: "students", label: "Kết quả học sinh", href: "/teacher/students" },
  { section: "tutor", label: "Công cụ giáo viên", href: "/teacher/ai" },
];

export const STUDENT_NAVIGATION: PortalNavItem[] = [
  { section: "overview", label: "Tổng quan", href: "/student" },
  {
    section: "materials",
    label: "Học liệu 3 giai đoạn",
    href: "/student/materials",
  },
  { section: "classes", label: "Lớp học của em", href: "/student/classes" },
  {
    section: "curriculum",
    label: "Chương trình Vật lí 12",
    href: "/student/curriculum",
  },
  {
    section: "assignments",
    label: "Bài tập đã giao",
    href: "/student/assignments",
  },
  { section: "journal", label: "Nhật kí học tập", href: "/student/journal" },
  { section: "tutor", label: "Trợ lí học tập AI", href: "/student/ai" },
];

/**
 * Submenu cho mục "Học liệu 3 giai đoạn" trong portal.
 * Kho học liệu của portal chỉ lọc theo `type` — xem ghi chú đầu tệp.
 */
export const TEACHER_MATERIALS_SUBMENU: NavigationLink[] = [
  { href: "/teacher/materials", label: "Tất cả học liệu", status: "available" },
  {
    href: "/teacher/materials?type=lecture_video",
    label: "Trước giờ · Video và phiếu học tập",
    status: "available",
  },
  {
    href: "/teacher/materials?type=simulation",
    label: "Trong giờ · Thí nghiệm 3D",
    status: "available",
  },
  {
    href: "/teacher/materials?type=assessment",
    label: "Sau giờ · Ôn tập và đánh giá",
    status: "available",
  },
  {
    href: "/hoc-lieu/lop-hoc-dao-nguoc",
    label: "Hướng dẫn tổ chức lớp học",
    status: "available",
  },
];

export const STUDENT_MATERIALS_SUBMENU: NavigationLink[] = [
  { href: "/student/materials", label: "Tất cả học liệu", status: "available" },
  {
    href: "/student/materials?type=lecture_video",
    label: "Trước giờ · Video bài giảng",
    status: "available",
  },
  {
    href: "/student/materials?type=simulation",
    label: "Trong giờ · Thí nghiệm 3D",
    status: "available",
  },
  {
    href: "/student/materials?type=assessment",
    label: "Sau giờ · Ôn tập",
    status: "available",
  },
  {
    href: "/hoc-lieu/lop-hoc-dao-nguoc",
    label: "Hướng dẫn tự học hiệu quả",
    status: "available",
  },
];

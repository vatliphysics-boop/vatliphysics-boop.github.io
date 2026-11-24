"use client";

import React, { useState } from "react";

type TopicCode = "B21" | "B22" | "B23" | "B24" | "B25";

interface MindMapBranch {
  id: string;
  title: string;
  items: string[];
}

interface TopicMindMap {
  code: TopicCode;
  centralTitle: string;
  branches: MindMapBranch[];
}

const INITIAL_MINDMAPS: Record<TopicCode, TopicMindMap> = {
  B21: {
    code: "B21",
    centralTitle: "B21 · Cấu trúc hạt nhân",
    branches: [
      {
        id: "b21-1",
        title: "Thí nghiệm tán xạ hạt alpha",
        items: [
          "Đa số hạt alpha xuyên thẳng qua lá vàng mỏng: nguyên tử gần như trống rỗng",
          "Một tỉ lệ rất nhỏ lệch góc lớn (> 90°): điện tích dương tập trung ở hạt nhân kích thước rất nhỏ",
        ],
      },
      {
        id: "b21-2",
        title: "Thành phần & kí hiệu hạt nhân",
        items: [
          "Gồm Z proton (điện tích +e) và N neutron (không mang điện)",
          "Số khối A = Z + N; kí hiệu hạt nhân X có chỉ số trên A, chỉ số dưới Z",
        ],
      },
      {
        id: "b21-3",
        title: "Đồng vị & kích thước hạt nhân",
        items: [
          "Các hạt nhân đồng vị có cùng số proton Z nhưng khác số neutron N",
          "Bán kính hạt nhân R ≈ 1,2 · A^(1/3) fm (cỡ 10⁻¹⁵ m)",
        ],
      },
    ],
  },
  B22: {
    code: "B22",
    centralTitle: "B22 · Phản ứng hạt nhân & Năng lượng liên kết",
    branches: [
      {
        id: "b22-1",
        title: "Độ hụt khối & Năng lượng liên kết",
        items: [
          "Độ hụt khối Δm = Z·mp + (A − Z)·mn − mX > 0",
          "Năng lượng liên kết riêng Elkr = Elk / A đặc trưng cho mức độ bền vững của hạt nhân",
        ],
      },
      {
        id: "b22-2",
        title: "Định luật bảo toàn trong phản ứng",
        items: [
          "Bảo toàn số nucleon (số khối A) và bảo toàn điện tích (Z)",
          "Bảo toàn năng lượng toàn phần và động lượng (không có bảo toàn khối lượng nghỉ)",
        ],
      },
      {
        id: "b22-3",
        title: "Phân hạch & Nhiệt hạch",
        items: [
          "Phân hạch: hạt nhân nặng (U-235, Pu-239) hấp thụ neutron chậm tách thành hai hạt nhân trung bình",
          "Nhiệt hạch: hai hạt nhân rất nhẹ (D, T) tổng hợp ở nhiệt độ rất cao tạo hạt nhân nặng hơn",
        ],
      },
    ],
  },
  B23: {
    code: "B23",
    centralTitle: "B23 · Hiện tượng phóng xạ",
    branches: [
      {
        id: "b23-1",
        title: "Bản chất & đặc điểm phóng xạ",
        items: [
          "Quá trình biến đổi hạt nhân tự phát, ngẫu nhiên, không phụ thuộc nhiệt độ hay áp suất",
          "Các dạng tia: α (hạt nhân He-4), β⁻ (electron), β⁺ (positron) và γ (sóng điện từ bước sóng rất ngắn)",
        ],
      },
      {
        id: "b23-2",
        title: "Định luật phóng xạ & Độ phóng xạ",
        items: [
          "Số hạt chưa phân rã giảm theo quy luật hàm mũ: N(t) = N₀ · 2^(−t/T) = N₀ · e^(−λt)",
          "Độ phóng xạ H(t) = λ · N(t) với λ = ln(2)/T, đơn vị đo là becquerel (Bq)",
        ],
      },
      {
        id: "b23-3",
        title: "Nguyên tắc an toàn bức xạ",
        items: [
          "Giảm thời gian tiếp xúc trực tiếp với nguồn phóng xạ",
          "Tăng khoảng cách tới nguồn và sử dụng vật liệu che chắn phù hợp (chì, bê tông)",
        ],
      },
    ],
  },
  B24: {
    code: "B24",
    centralTitle: "B24 · Công nghiệp hạt nhân",
    branches: [
      {
        id: "b24-1",
        title: "Nhà máy điện hạt nhân",
        items: [
          "Duy trì phản ứng phân hạch dây chuyền có kiểm soát ở trạng thái tới hạn k = 1 nhờ thanh điều khiển",
          "Chuyển hóa năng lượng: năng lượng phân hạch → nội năng (nhiệt) → cơ năng tua-bin → điện năng",
        ],
      },
      {
        id: "b24-2",
        title: "Y học hạt nhân",
        items: [
          "Chẩn đoán hình ảnh chức năng bằng đồng vị chu kì ngắn (PET, SPECT)",
          "Điều trị ung thư có định hướng bằng dược chất phóng xạ (I-131) hoặc chùm tia xạ trị ngoài (Co-60)",
        ],
      },
      {
        id: "b24-3",
        title: "Nông nghiệp, công nghiệp & khảo cổ",
        items: [
          "Chiếu xạ khử trùng nông sản, thực phẩm và tạo giống cây trồng đột biến có lợi",
          "Kiểm tra khuyết tật vật liệu không phá hủy và định tuổi cổ vật bằng đồng vị C-14",
        ],
      },
    ],
  },
  B25: {
    code: "B25",
    centralTitle: "B25 · Bài tập Vật lí hạt nhân",
    branches: [
      {
        id: "b25-1",
        title: "Dạng 1: Cân bằng phương trình hạt nhân",
        items: [
          "Viết đúng kí hiệu hạt α (A=4, Z=2), β⁻ (A=0, Z=−1), β⁺ (A=0, Z=+1), neutron (A=1, Z=0)",
          "Áp dụng ∑A_trước = ∑A_sau và ∑Z_trước = ∑Z_sau để xác định hạt nhân chưa biết",
        ],
      },
      {
        id: "b25-2",
        title: "Dạng 2: Năng lượng liên kết & phản ứng",
        items: [
          "Đổi đơn vị thống nhất: 1 u·c² ≈ 931,5 MeV trước khi tính Elk và Elkr",
          "Tính năng lượng tỏa/thu: W = (m_trước − m_sau)·c²",
        ],
      },
      {
        id: "b25-3",
        title: "Dạng 3: Đồ thị & bài toán chu kì bán rã",
        items: [
          "Đọc mốc H₀ và tìm hai thời điểm kẹp mức H₀/2 để ước lượng chu kì bán rã T",
          "Phân biệt rõ số hạt còn lại N(t) và số hạt đã bị phân rã ΔN = N₀ · (1 − 2^(−t/T))",
        ],
      },
    ],
  },
};

const BRANCH_COLORS = [
  "#2b3b93",
  "#0f6fa8",
  "#12735a",
  "#8c4c12",
  "#6d28d9",
  "#b42332",
];

export function MindMapWorkspace() {
  const [selectedTopic, setSelectedTopic] = useState<TopicCode>("B21");
  const [mapsByTopic, setMapsByTopic] = useState<Record<TopicCode, TopicMindMap>>(
    () => INITIAL_MINDMAPS,
  );
  const [newBranchTitle, setNewBranchTitle] = useState<string>("");
  const [draftItems, setDraftItems] = useState<Record<string, string>>({});
  const [groupName, setGroupName] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"md" | "txt">("md");

  const activeMap = mapsByTopic[selectedTopic];

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBranchTitle.trim();
    if (!trimmed) return;
    const branchId = `${selectedTopic.toLowerCase()}-${Date.now()}`;
    setMapsByTopic((prev) => ({
      ...prev,
      [selectedTopic]: {
        ...prev[selectedTopic],
        branches: [
          ...prev[selectedTopic].branches,
          { id: branchId, title: trimmed, items: [] },
        ],
      },
    }));
    setNewBranchTitle("");
  };

  const handleRemoveBranch = (branchId: string) => {
    setMapsByTopic((prev) => ({
      ...prev,
      [selectedTopic]: {
        ...prev[selectedTopic],
        branches: prev[selectedTopic].branches.filter((b) => b.id !== branchId),
      },
    }));
  };

  const handleAddItem = (branchId: string) => {
    const text = (draftItems[branchId] ?? "").trim();
    if (!text) return;
    setMapsByTopic((prev) => ({
      ...prev,
      [selectedTopic]: {
        ...prev[selectedTopic],
        branches: prev[selectedTopic].branches.map((branch) =>
          branch.id === branchId
            ? { ...branch, items: [...branch.items, text] }
            : branch,
        ),
      },
    }));
    setDraftItems((prev) => ({ ...prev, [branchId]: "" }));
  };

  const handleRemoveItem = (branchId: string, itemIdx: number) => {
    setMapsByTopic((prev) => ({
      ...prev,
      [selectedTopic]: {
        ...prev[selectedTopic],
        branches: prev[selectedTopic].branches.map((branch) =>
          branch.id === branchId
            ? {
                ...branch,
                items: branch.items.filter((_, idx) => idx !== itemIdx),
              }
            : branch,
        ),
      },
    }));
  };

  const handleDownloadMindMap = () => {
    const headerGroup = groupName.trim() ? `Nhóm thực hiện: ${groupName.trim()}\n` : "";
    let fileContent = "";
    if (exportFormat === "md") {
      const sections = activeMap.branches
        .map((branch, idx) => {
          const bullets =
            branch.items.length > 0
              ? branch.items.map((item) => `  - ${item}`).join("\n")
              : "  - (Chưa có ý chi tiết)";
          return `## ${idx + 1}. ${branch.title}\n${bullets}`;
        })
        .join("\n\n");
      fileContent = `# Sơ đồ tư duy: ${activeMap.centralTitle}\n\n${headerGroup}Chủ đề Chương IV — Vật lí hạt nhân 12\n\n${sections}\n`;
    } else {
      const sections = activeMap.branches
        .map((branch, idx) => {
          const bullets =
            branch.items.length > 0
              ? branch.items.map((item) => `   + ${item}`).join("\n")
              : "   + (Chưa có ý chi tiết)";
          return `[Nhánh ${idx + 1}] ${branch.title}\n${bullets}`;
        })
        .join("\n\n");
      fileContent = `SƠ ĐỒ TƯ DUY: ${activeMap.centralTitle}\n${headerGroup}==================================================\n\n${sections}\n`;
    }

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `so-do-tu-duy-${selectedTopic.toLowerCase()}.${exportFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tính chiều cao SVG động theo số nhánh để sơ đồ trực quan không bao giờ bị tràn chữ
  const branchCount = activeMap.branches.length;
  const rowHeight = 96;
  const svgHeight = Math.max(280, branchCount * rowHeight + 40);
  const centerY = svgHeight / 2;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Thanh chọn chủ đề B21–B25 & thông tin nhóm */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {(["B21", "B22", "B23", "B24", "B25"] as const).map((code) => {
            const active = code === selectedTopic;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedTopic(code)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: active
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--border-light)",
                  background: active ? "var(--color-primary-soft)" : "var(--bg-page)",
                  color: active ? "var(--color-primary)" : "var(--text-secondary)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                {code}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          <label htmlFor="mindmap-group-input" style={{ fontSize: "13px", fontWeight: 600 }}>
            Tên nhóm:
          </label>
          <input
            id="mindmap-group-input"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="VD: Nhóm 2 - Lớp 12A1"
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-dark)",
              background: "var(--bg-surface)",
              fontSize: "13.5px",
            }}
          />
        </div>
      </div>

      {/* Sơ đồ tư duy trực quan bằng SVG */}
      <div
        style={{
          padding: "18px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-muted)",
            marginBottom: "10px",
          }}
        >
          Bản xem trước sơ đồ trực quan ({activeMap.branches.length} nhánh chính)
        </div>
        <svg
          viewBox={`0 0 860 ${svgHeight}`}
          role="img"
          aria-label={`Sơ đồ tư duy trực quan cho chủ đề ${activeMap.centralTitle}`}
          style={{ width: "100%", minWidth: "640px", height: "auto", display: "block" }}
        >
          {/* Đường nối cong từ nút gốc sang từng nhánh */}
          {activeMap.branches.map((branch, idx) => {
            const targetY = 56 + idx * rowHeight;
            const stroke = BRANCH_COLORS[idx % BRANCH_COLORS.length];
            const pathD = `M 250 ${centerY} C 315 ${centerY}, 315 ${targetY}, 380 ${targetY}`;
            return (
              <g key={branch.id}>
                <path d={pathD} fill="none" stroke={stroke} strokeWidth={2.5} />
                <rect
                  x={380}
                  y={targetY - 34}
                  width={456}
                  height={72}
                  rx={10}
                  fill="#ffffff"
                  stroke={stroke}
                  strokeWidth={1.8}
                />
                <text
                  x={396}
                  y={targetY - 10}
                  fontSize={13.5}
                  fontWeight={700}
                  fill={stroke}
                >
                  {idx + 1}. {branch.title.slice(0, 54)}
                </text>
                <text x={396} y={targetY + 12} fontSize={11.5} fill="#425a6b">
                  {branch.items[0]
                    ? `• ${branch.items[0].slice(0, 66)}${branch.items[0].length > 66 ? "…" : ""}`
                    : "• (Chưa có ý chi tiết)"}
                </text>
                {branch.items.length > 1 && (
                  <text x={396} y={targetY + 28} fontSize={11} fill="#526b7a">
                    {`• ${branch.items[1].slice(0, 58)}${branch.items[1].length > 58 ? "…" : ""}${
                      branch.items.length > 2 ? ` (+${branch.items.length - 2} ý khác)` : ""
                    }`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nút trung tâm */}
          <rect
            x={20}
            y={centerY - 40}
            width={230}
            height={80}
            rx={14}
            fill="#2b3b93"
          />
          <text
            x={135}
            y={centerY - 6}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="#ffffff"
          >
            CHỦ ĐỀ TRUNG TÂM
          </text>
          <text
            x={135}
            y={centerY + 16}
            textAnchor="middle"
            fontSize={12.5}
            fontWeight={600}
            fill="#e7eaf9"
          >
            {activeMap.centralTitle.slice(0, 30)}
          </text>
        </svg>
      </div>

      {/* Form thêm nhánh chính mới */}
      <form
        onSubmit={handleAddBranch}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
        }}
      >
        <input
          type="text"
          value={newBranchTitle}
          onChange={(e) => setNewBranchTitle(e.target.value)}
          placeholder="Nhập tên nhánh chính mới (ví dụ: Liên hệ thực tiễn, Sai lầm thường gặp...)"
          aria-label="Tên nhánh chính mới"
          style={{
            flex: "1 1 260px",
            padding: "9px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-dark)",
            background: "var(--bg-surface)",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "9px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-primary)",
            background: "var(--color-primary-soft)",
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: "13.5px",
            cursor: "pointer",
          }}
        >
          + Thêm nhánh chính
        </button>
      </form>

      {/* Danh sách thẻ chỉnh sửa từng nhánh và thêm ý chi tiết */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
          gap: "16px",
        }}
      >
        {activeMap.branches.map((branch, idx) => {
          const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
          return (
            <div
              key={branch.id}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                borderTop: `4px solid ${color}`,
                background: "var(--bg-surface)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 700, color }}>
                    Nhánh {idx + 1}: {branch.title}
                  </h3>
                  {activeMap.branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(branch.id)}
                      aria-label={`Xóa nhánh ${branch.title}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Xóa nhánh
                    </button>
                  )}
                </div>

                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "18px",
                    display: "grid",
                    gap: "8px",
                    fontSize: "13.5px",
                    color: "var(--text-primary)",
                  }}
                >
                  {branch.items.map((item, itemIdx) => (
                    <li key={`${branch.id}-${itemIdx}`} style={{ lineHeight: 1.5 }}>
                      <span>{item}</span>{" "}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(branch.id, itemIdx)}
                        aria-label={`Xóa ý ${item}`}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--semantic-danger)",
                          fontSize: "11.5px",
                          cursor: "pointer",
                          marginLeft: "4px",
                        }}
                      >
                        [xóa]
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <input
                  type="text"
                  value={draftItems[branch.id] ?? ""}
                  onChange={(e) =>
                    setDraftItems((prev) => ({ ...prev, [branch.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem(branch.id);
                    }
                  }}
                  placeholder="Thêm ý chi tiết vào nhánh này..."
                  aria-label={`Thêm ý chi tiết cho nhánh ${branch.title}`}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-dark)",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(branch.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-surface-elevated)",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    fontSize: "12.5px",
                    cursor: "pointer",
                  }}
                >
                  + Thêm ý
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thanh công cụ xuất tệp .md / .txt */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-surface-elevated)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px" }}>
          <label htmlFor="mindmap-export-format" style={{ fontWeight: 600 }}>
            Định dạng xuất:
          </label>
          <select
            id="mindmap-export-format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value === "txt" ? "txt" : "md")}
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-dark)",
              background: "var(--bg-surface)",
              fontSize: "13px",
            }}
          >
            <option value="md">Markdown (.md)</option>
            <option value="txt">Văn bản thuần (.txt)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleDownloadMindMap}
          style={{
            padding: "10px 18px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--color-primary)",
            color: "var(--color-primary-on)",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Tải sơ đồ về máy
        </button>
      </div>
    </div>
  );
}

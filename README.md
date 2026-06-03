# Web quản lý lập lịch (Automated Student Timetable Helper)

Ứng dụng web tối ưu hóa sắp xếp thời biểu tự động giải quyết xung đột lịch học phần và lịch cá nhân bận dành cho sinh viên Việt Nam.

---

## 📂 Danh mục tài liệu đi kèm (Project Structure)

Theo cấu trúc chuẩn hóa được quy định từ ngày đầu, các tài liệu kỹ thuật cốt lõi được đặt trong thư mục `docs/`:

1. 📄 **[Specification (`docs/SPEC.md`)](/docs/SPEC.md)**: Đặc tả chi tiết tính năng, đối tượng người dùng, các module nghiệp vụ và tiêu chí nghiệm thu.
2. 📐 **[Architecture Decisions (`docs/ARCHITECTURE.md`)](/docs/ARCHITECTURE.md)**: Làm rõ giải thuật quy đổi thời gian sang số phút đầu tuần, chi tiết thuật toán tìm kiếm tổ hợp bằng Đệ quy quay lui (Backtracking), phương thức đo đạc và lọc giải pháp xung đột tối thiểu.
3. 📝 **[Changelog (`docs/CHANGELOG.md`)](/docs/CHANGELOG.md)**: Lịch sử cập nhật phát triển theo từng phân đoạn (Sprints).

---

## 🚀 Tính năng nổi bật (Key Features)

*   **Quản lý môn học đa dạng (Multi-Section Subject Management)**: Cho phép thêm các môn học kèm nhiều lớp học phần khác nhau (tên lớp, giảng viên, phòng học, lịch học một hoặc nhiều buổi).
*   **Hỗ trợ 2 chuẩn nhập liệu thời gian**:
    *   Học theo **Tiết học** truyền thống (Tiết 1 đến Tiết 15).
    *   Học theo **Khung giờ học cụ thể** (ví dụ: `09:15 - 11:45`).
*   **Nhập lịch bận cá nhân (Personal Busy Times)**: Nhập các lịch cố định hàng tuần (đi làm thêm, học IELTS, v.v.) để thuật toán tránh xếp lớp vào giờ đó.
*   **Thuật toán tổ hợp tự động (Automatic backtracking combination generator)**: Tìm kiếm tất cả các phương án thời khóa biểu hợp lệ, không bao giờ bị trùng chéo mốc thời gian.
*   **Hiển thị Tuần trực quan (Interactive Visual Weekly Grid)**: Xem kết quả tổ hợp dưới dạng lịch tuần đầy màu sắc, dễ dàng duyệt đổi giữa các "Phương án 1", "Phương án 2", v.v. bằng các nút điều hướng hoặc phím mũi tên.
*   **Xử lý Xung đột thông minh khi thất bại (Conflict Center)**:
    *   Định rõ các **điểm nghẽn** (Bottlenecks) cụ thể trùng lắp ở thứ mấy, tiết mấy, giữa lớp học phần nào hoặc giữa học phần với lịch cá nhân.
    *   Gợi ý các phương án thời khóa biểu **Xung đột tối thiểu** (ít tiết trùng nhất) kèm bôi đỏ vùng chồng lịch để sinh viên dễ dàng chọn lựa phương án thỏa hiệp tối ưu.

---

## 🛠️ Hướng dẫn Khởi chạy & Phát triển (Setup & Running)

### Khởi chạy môi trường phát triển (Local Development)

1.  **Cài đặt các gói phụ thuộc (Dependencies)**:
    ```bash
    npm install
    ```
2.  **Chạy server phát triển (Vite)**:
    ```bash
    npm run dev
    ```
    Ứng dụng sẽ khả dụng tại: `http://localhost:3000` (hoặc cổng mà trình biên dịch thiết lập).

### Biên dịch dự án (Production Build)

1.  **Tạo tệp tĩnh cho SPA**:
    ```bash
    npm run build
    ```
    Thư mục `dist/` sẽ chứa mã nguồn html, css, js tối ưu hoàn chỉnh cho việc triển khai lên bất kỳ Cloud hosting nào (như Cloud Run, Netlify, Vercel, v.v.).

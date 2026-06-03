# CHANGELOG: Web quản lý lập lịch

Tài liệu ghi lại toàn bộ tiến độ phát triển, các thay đổi và cập nhật tính năng của ứng dụng sắp xếp thời khóa biểu.

---

## [1.0.0] - 2026-06-03 (Phiên bản đầu tiên - Thiết kế & Xây dựng)

### Đã hoàn thiện (Added)
- **Tài liệu hóa dự án (Docs Setup)**:
  - Khởi tạo thư mục `docs/`.
  - Viết tài liệu đặc tả nghiệp vụ `docs/SPEC.md` chi tiết về đối tượng sinh viên, các tính năng cốt lõi và các kịch bản sử dụng.
  - Thiết lập tài liệu kiến trúc kỹ thuật `docs/ARCHITECTURE.md` làm rõ cách biểu diễn thời gian bằng phút đầu tuần, thuật toán đệ quy quay lui (Backtracking) và giải pháp khắc phục khi tổ hợp lịch bị trùng.
  - Phác thảo chiến lược phát triển trong `docs/CHANGELOG.md`.
- **Cấu hình Core TypeScript**:
  - Chuẩn bị tạo tệp types định danh `src/types.ts` chứa các loại dữ liệu cốt lõi: môn học, lớp học phần, phòng học, giảng viên, dải thời gian học (tiết hoặc khung giờ biểu), lịch bận cá nhân.
- **Tiện ích Quy đổi và Sắp xếp**:
  - Chuẩn bị thiết lập tệp `src/utils.ts` phục vụ quy ước thời gian, sinh tổ hợp, và phát hiện xung đột thời gian tối ưu.

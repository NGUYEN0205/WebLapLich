# SPECIFICATION: Web quản lý lập lịch (Schedule Helper for Students)

Ứng dụng Web giúp sinh viên đại học tối ưu hóa việc sắp xếp thời khóa biểu tự động dựa trên danh sách lớp học phần muốn đăng ký và lịch cá nhân, đồng thời hiển thị trực quan các phương án và xử lý xung đột thông minh.

---

## 1. Đối tượng sử dụng & User Personas

### Sinh viên đại học (Đăng ký tín chỉ)
- **Vấn đề**: Đến kỳ đăng ký môn học, mỗi môn học thường có nhiều lớp học phần khác nhau (nhiều mã lớp, giảng viên, phòng học, thứ học, ca học khác nhau). Sinh viên phải tự nháp từng phương án xếp lịch trên giấy hoặc Excel để không bị trùng giờ giữa các môn.
- **Vấn đề thêm**: Sinh viên có lịch bận cá nhân cố định như đi làm thêm, học tiếng Anh ở trung tâm, sinh hoạt câu lạc bộ, v.v. Việc đối chiếu thủ công rất dễ sai sót và mất nhiều giờ liền.
- **Nhu cầu**: Nhập tất cả môn học mong muốn cùng các lớp học phần tương ứng và lịch bận cá nhân, nhấn nút để hệ thống tự xếp và đề xuất các thời khóa biểu khả thi. Nếu không tìm được lịch hoàn hảo, hệ thống phải gợi ý lịch tốt nhất với mức độ xung đột thấp nhất.

---

## 2. Các Tính năng Cốt lõi (Core Features)

### Module 1: Quản lý dữ liệu đầu vào (Input Management)
- **1.1. Nhập lịch môn học**:
  - Thêm môn học mới (ví dụ: Toán Cao Cấp, Lập trình Web).
  - Với mỗi môn học, cho phép thêm nhiều **Lớp học phần (LHP)** khả dụng.
  - Mỗi Lớp học phần gồm các trường thông tin:
    - Tên lớp/ Mã lớp (ví dụ: L01, Nhóm 2).
    - Giảng viên (optional).
    - Địa điểm/ Phòng học (optional).
    - Lịch học trong tuần: Một LHP có thể học nhiều buổi/tuần. Mỗi buổi gồm:
      - **Thứ**: Thứ 2 đến Chủ nhật.
      - **Loại thời gian**: Chọn giữa **Số tiết học / Tiết bắt đầu** (ví dụ: Tiết 1-3) hoặc **Khung giờ học cụ thể** (ví dụ: 08:00 - 10:15).
- **1.2. Nhập lịch cá nhân**:
  - Thêm các khoảng thời gian bận cố định lặp lại hàng tuần.
  - Ví dụ: Lịch đi làm thêm (Thứ 3: 18:00 - 22:00), Lịch học tiếng Anh (Thứ 7: Tiết 1-4).
  - Có thể dễ dàng Bật/Tắt (Toggle active) từng lịch bận để thuật toán cân nhắc hoặc bỏ qua.
- **1.3. Nhập liệu nhanh tiện dụng (Optional/Bonus)**:
  - Cho phép người dùng lưu trữ nhanh cấu hình vào trình duyệt (`localStorage`) để không bị mất dữ liệu khi F5.

### Module 2: Thuật toán Xử lý & Sắp xếp (Algorithm Core)
- **2.1. Phép Unify hệ thống thời gian**:
  - Quy đổi tất cả "Tiết học" và "Khung giờ cụ thể" về một hệ trục chung: **Số phút tính từ đầu tuần** (0 đến 10079 phút cho 7 ngày × 24 giờ × 60 phút).
  - Hệ thống định nghĩa cấu hình "Tiết học" mặc định (ví dụ: Tiết 1 bắt đầu từ 07:00, 1 tiết kéo dài 45 phút, giữa các tiết có 5-10 phút giải lao).
- **2.2. Thuật toán quay lui tìm tổ hợp (Backtracking Combinations)**:
  - Đầu vào: $N$ môn học, mỗi môn học có một tập hợp $M_i$ các lớp học phần.
  - Thuật toán tìm các tổ hợp chập $N$ lớp học phần (mỗi môn học lấy đúng 1 lớp học phần) sao cho:
    - Không có bất kỳ 2 lớp học phần nào trùng thời gian.
    - Không có lớp học phần nào trùng với các lịch cá nhân đang bật bận.
- **2.3. Giải thuật Tìm độ xung đột tối thiểu (Conflict Indexing)**:
  - Khi **không có tổ hợp nào hoàn toàn không bị trùng** (thất bại 100%):
    - Đếm số phút bị trùng (xung đột) của từng tổ hợp có thể tạo ra.
    - Sắp xếp và chọn ra các tổ hợp có tổng số phút/tiết bị trùng **nhỏ nhất** (ví dụ: chỉ trùng 1-2 tiết học hoặc trùng nhẹ 15-30 phút).
    - Gợi ý các phương án này kèm chỉ số xung đột cụ thể để người dùng quyết định hy sinh hay điều chỉnh.

### Module 3: Hiển thị Kết quả & Xử lý Xung đột (Output & Direct Visualization)
- **3.1. Chế độ Thành công - Lịch trực quan tuần**:
  - Trực quan hóa dưới dạng thời khóa biểu tuần (Thứ 2 đến Chủ nhật, Trục dọc là thời gian từ 07:00 đến 22:00).
  - Đổ màu phân biệt giữa các môn học khác nhau, có hiển thị lịch cá nhân bận (được bôi xám hoặc gạch chéo).
  - Thanh duyệt phương án: "Phương án 1 / 15", "Phương án 2 / 15", v.v. Cho phép nhấn Next / Prev hoặc phím mũi tên để chuyển đổi các phương án thời khóa biểu hợp lệ tức thì.
  - Hiện thông tin thống kê: "Tổng số tín chỉ / số môn", "Số ngày trống lịch (ngày off)", "Thời gian trống nhiều nhất trong ngày".
- **3.2. Chế độ Thất bại - Điểm nghẽn & Đề xuất**:
  - Nếu số phương án hoàn hảo = 0: Hiển thị cảnh báo màu đỏ trực quan.
  - Liệt kê cụ thể **Điểm nghẽn chính (Bottlenecks)**: "Môn A (Lớp L01) và Môn B (Lớp L02) xung đột với nhau vào Thứ 4 từ Tiết 3 đến Tiết 5." Hoặc "Lớp L02 môn C xung đột với Lịch bận 'Đi làm thêm' vào Thứ 6".
  - Hiển thị danh sách các phương án thời khóa biểu **Gần tối ưu nhất** (ví dụ: Trùng tối thiểu 1 tiết hoặc 2 tiết). Trên lịch tuần, phần bị trùng/xung đột sẽ được tô màu đỏ neon nhấp nháy hoặc có viền cảnh báo rõ ràng để sinh viên cân nhắc đổi lớp môn học hoặc dời bộ lịch cá nhân.

---

## 3. Kế hoạch Phát triển & Sắp xếp (Planning)

### Sprint 1: Thiết lập & Core Data Structure (Ngày 1)
- Thiết lập khung cấu trúc dự án chuẩn theo mô hình yêu cầu (docs, src, assets).
- Định nghĩa các kiểu dữ liệu TypeScript (`types.ts`) cho: `Subject`, `ClassSection`, `ScheduleSlot`, `PersonalSchedule`, `TimetableOption`.
- Tạo cơ sở dữ liệu mẫu (mock data) đầy đủ để test thuật toán.

### Sprint 2: Phát triển Algorithm Sắp xếp & Tính toán Xung đột (Ngày d)
- Xây dựng file tiện ích quy đổi thời gian sang phút đầu tuần (`utils.ts`).
- Viết thuật toán tìm tổ hợp khả thi bằng Backtracking.
- Viết thuật toán tính toán "Chỉ số xung đột" (Conflict Score) và gợi ý lịch gần tối ưu trong trường hợp thất bại.
- Viết unit test giả lập cho thuật toán xếp lịch để đảm bảo không bị sót trường hợp và không bị lặp vô hạn.

### Sprint 3: UI Quản lý Đầu vào & Lịch biểu Trực quan (Ngày 3)
- Giao diện nhập thông tin môn học, lớp học phần sinh động (bảng mẫu, nhập nhanh, xóa, sửa).
- Giao diện thêm lịch cá nhân bận.
- Thiết kế Calendar Week view siêu mượt hỗ trợ hiển thị cả môn học lẫn lịch cá nhân trên cùng một grid.
- Hỗ trợ xem các phương án lịch biểu thông qua bộ lọc, nút điều hướng Next / Previous và các chỉ số thống kê (Số ngày nghỉ, thời gian rảnh).
- Hoàn thiện xử lý hiển thị điểm nghẽn và đề xuất lịch lỗi nhẹ khi thất bại.
- Kiểm thử toàn diện ứng dụng và tối ưu hóa hiệu năng render.

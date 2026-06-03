# ARCHITECTURE DECISIONS & DESIGN: Web quản lý lập lịch

Tài liệu này mô tả chi tiết kiến trúc hệ thống, cấu trúc dữ liệu, và các quyết định kỹ thuật cốt lõi (ADR) được áp dụng trong ứng dụng sắp xếp thời khóa biểu tự động.

---

## 1. Biểu diễn Hệ trục Thời gian và Quy đổi (Time Representation)

Để giải quyết vấn đề so sánh chéo giữa hai hệ thời gian khác nhau:
1. **Hệ Tiết học (Periods)**: Thường chỉ mô tả bằng số thứ tự (Tiết 1, Tiết 2, Tiết 3, ..., Tiết 15). Mỗi tiết học tương ứng với một khoảng thời gian cố định tại cơ sở đào tạo.
2. **Hệ Giờ cụ thể (Clock Times)**: Biểu thị bằng định dạng `HH:MM` (ví dụ: `08:00 - 10:30`).

### Quy đổi về Số phút trong tuần (Weekly Minutes Index):
Chúng ta biểu thị mỗi mốc thời gian bằng số phút tính từ đầu tuần (00:00 sáng Thứ Hai). Một tuần có $7 \times 24 \times 60 = 10,080$ phút.

$$MinutesOfWeek = (DayOfWeek \times 24 \times 60) + (Hour \times 60) + Minute$$

Trong đó `DayOfWeek` được quy ước:
- Thứ Hải (Monday): `0`
- Thứ Ba (Tuesday): `1`
- Thứ Tư (Wednesday): `2`
- Thứ Năm (Thursday): `3`
- Thứ Sáu (Friday): `4`
- Thứ Bảy (Saturday): `5`
- Chủ Nhật (Sunday): `6`

#### Định nghĩa Mốc thời gian mặc định cho Tiết học (Tiết 1 - 15):
Dưới đây là một cấu hình mốc mặc định chuẩn của các trường đại học tại Việt Nam mà hệ thống sử dụng:
- **Tiết 1**: 07:00 - 07:45 (Tương đương từ phút `420` đến `465` của ngày)
- **Tiết 2**: 07:50 - 08:35 (Phút `470` đến `515`)
- **Tiết 3**: 08:45 - 09:30 (Phút `525` đến `570`)
- **Tiết 4**: 09:35 - 10:20 (Phút `575` đến `620`)
- **Tiết 5**: 10:30 - 11:15 (Phút `630` đến `675`)
- **Tiết 6**: 12:30 - 13:15 (Phút `750` đến `795`)
- **Tiết 7**: 13:20 - 14:05 (Phút `800` đến `845`)
- **Tiết 8**: 14:15 - 15:00 (Phút `855` đến `900`)
- **Tiết 9**: 15:05 - 15:50 (Phút `905` đến `950`)
- **Tiết 10**: 16:00 - 16:45 (Phút `960` đến `1005`)
- **Tiết 11**: 17:30 - 18:15 (Phút `1050` đến `1095`)
- **Tiết 12**: 18:15 - 19:00 (Phút `1095` đến `1140`)
- **Tiết 13**: 19:00 - 19:45 (Phút `1140` đến `1185`)
- **Tiết 14**: 19:45 - 20:30 (Phút `1185` đến `1230`)
- **Tiết 15**: 20:30 - 21:15 (Phút `1230` đến `1275`)

Nhờ việc quy đổi đồng bộ này, việc kiểm tra sự trùng khớp thời gian chuyển thành phép so sánh giao nhau giữa 2 khoảng đóng đơn giản:
$$\operatorname{overlap}([s_1, e_1], [s_2, e_2]) \iff \max(s_1, s_2) < \min(e_1, e_2)$$

---

## 2. Giải thuật Tổ hợp & Xếp lịch (Scheduling Algorithm)

### 2.1. Đệ quy Quay lui tìm tổ hợp không trùng (Backtracking Search)
- Hệ thống duyệt qua từng môn học $i$ từ $0$ đến $N-1$.
- Tại mỗi môn học $i$, ta thử nghiệm lần lượt từng lớp học phần $c_j \in M_i$.
- Với mỗi lớp học phần $c_j$, ta kiểm tra xem các buổi học của lớp này có bị trùng với:
  1. Các lớp học phần đã được chọn cho các môn học trước từ $0$ đến $i-1$.
  2. Các lịch cá nhân bận đang kích hoạt (`isActive === true`).
- Nếu không trùng, ta tạm thời chọn lớp $c_j$ này và đệ quy sang môn tiếp theo $i+1$.
- Sau khi duyệt hết môn $N-1$ thành công, ta lưu cấu hình này thành một **Phương án thời khóa biểu hợp lệ (Valid Option)**.
- Để tránh quá tải trình duyệt và đứng luồng, ta khống chế tối đa số lượng phương án trả về (ví dụ: tối đa 200 phương án).

### 2.2. Xử lý khi không có tổ hợp hợp lệ (Conflict Optimization Metric)
Nếu số phương án hoàn hảo = 0, hệ thống chuyển sang chế độ **Conflict Optimization**:
- Ta duyệt qua tất cả các tổ hợp môn học có thể lập ra (kể cả tổ hợp bị trùng). Với $N$ môn học, tổng số tổ hợp là $\prod_{i=0}^{N-1} |M_i|$.
- Nếu số tổ hợp quá lớn (ví dụ: > 10,000 tổ hợp), ta giới hạn lấy mẫu lựa chọn hoặc sử dụng giải thuật tham lam để tìm ra các ứng viên tốt nhất nhằm đảm bảo hiệu năng.
- Với mỗi tổ hợp, ta tính **Tổng số phút bị trùng (Total Conflict Minutes)**.
- **Conflict Minutes** được tính bằng tổng số phút bận bị xếp lặp:
  - Giữa lớp học phần môn $A$ và môn $B$ học cùng giờ.
  - Giữa lớp học phần môn $A$ và lịch cá nhân bận.
- Sắp xếp tất cả các tổ hợp theo thứ tự tăng dần của **Conflict Minutes**.
- Trả về top 5-10 tổ hợp có chỉ số xung đột nhỏ nhất để hiển thị làm phương án đề xuất giảm nhẹ.

---

## 3. Cấu trúc Thư mục và File (Directory Structure)

Theo yêu cầu chuẩn hóa cấu trúc dự án:
```
/
├── docs/
│   ├── SPEC.md         # Yêu cầu nghiệp vụ, tính năng và kịch bản sử dụng
│   ├── ARCHITECTURE.md # Mô tả kiến trúc, thuật toán quy đổi và cấu trúc dữ liệu (Tài liệu này)
│   └── CHANGELOG.md    # Nhật ký các phiên bản và tiến độ phát triển
├── src/
│   ├── components/     # Các thành phần UI chuyên biệt
│   │   ├── CalendarView.tsx    # Thành phần lịch biểu hiển thị dạng lưới tuần quan trực quan
│   │   ├── SubjectManager.tsx  # Quản lý nhập môn học và lớp học phần
│   │   ├── PersonalManager.tsx # Quản lý lịch cá nhân bận
│   │   ├── ConflictCenter.tsx  # Phân tích điểm nghẽn và hiển thị các giải pháp đề xuất
│   │   └── SummaryStats.tsx    # Thống kê nhanh thông số hiển thị phương án
│   ├── types.ts        # Toàn bộ kiểu dữ liệu dùng chung (Subjects, Classes, Busy, v.v.)
│   ├── utils.ts        # Thư viện thuật toán quy đổi thời gian, quay lui lập lịch và đo xung đột
│   ├── App.tsx         # Layout chính kết nối dữ liệu và quản lý trạng thái chính
│   ├── index.css       # Các style phối hợp Tailwind CSS
│   └── main.tsx        # Khởi nguồn cho React app
├── README.md           # Hướng dẫn khởi dịch thiết lập nhanh dự án
```

---

## 4. Thiết kế Thực thể Dữ liệu (Data Models in `types.ts`)

```typescript
export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0: Thứ 2, ..., 6: Chủ nhật
  type: 'period' | 'time';
  startPeriod?: number; // 1 to 15
  numPeriods?: number;
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
}

export interface ClassSection {
  id: string;
  className: string; // Tên/Mã lớp học phần (ví dụ: "L01")
  teacherName?: string;
  room?: string;
  scheduleSlots: TimeSlot[];
}

export interface Subject {
  id: string;
  subjectName: string; // Tên môn học
  color: string; // Mã màu hex đại diện cho môn học đó
  sections: ClassSection[];
}

export interface PersonalSchedule {
  id: string;
  title: string; // Tên lịch bận (đăng ký tập gym, học ngoại ngữ, etc.)
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isActive: boolean;
}
```

# Hệ Thống LMS Đề Cương & Tự Động Phân Tích Đề Thi Lớp Học

Hệ thống LMS web database hiện đại, chạy trực tiếp trên trình duyệt máy tính và điện thoại thông minh, phục vụ việc quản lý đề cương ôn tập môn học và tự động bóc tách, tính toán, chuyển đổi đề thi từ ảnh chụp/tài liệu thành bài kiểm tra trắc nghiệm tương tác cho cả lớp.

---

## 🌟 Các Tính Năng Trọng Tâm

### 1. 📚 Bảng Lựa Chọn Môn Học & Theo Dõi Trạng Thái
- Hiển thị đầy đủ danh sách các môn học (Toán, Vật lý, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý, v.v.).
- Trực quan hóa trạng thái với huy hiệu màu sắc rõ ràng:
  - **Trạng thái Đề cương**: *Đã có đề cương* (kèm tóm tắt lý thuyết, công thức trọng tâm) / *Chưa có đề cương*.
  - **Trạng thái Đề thi**: *Đã có đề* (hiển thị số lượng đề thi và tổng số câu hỏi) / *Chưa có đề*.
- Bộ lọc thông minh: Lọc theo trạng thái đề cương, trạng thái đề thi, tìm kiếm nhanh theo tên môn hoặc mã môn.
- Cho phép xem, biên soạn và in ấn đề cương chi tiết (hỗ trợ công thức Toán/Lý/Hóa chuẩn LaTeX KaTeX).

### 2. 🧠 Phân Tích & Tính Toán Câu Hỏi Tự Động (AI & OCR Engine)
- **Đa dạng nguồn nhập liệu**:
  - 📸 **Chụp ảnh trực tiếp từ Camera điện thoại**: Tự động mở camera chụp ảnh trang đề thi.
  - 🖼️ **Tải ảnh đề thi** (JPG, PNG, WebP) từ thư viện máy.
  - 📄 **Tải file tài liệu**: Hỗ trợ file Word (`.docx`), PDF (`.pdf`), hoặc file text (`.txt`).
  - 📋 **Dán văn bản trực tiếp**: Sao chép đề thi từ Zalo, Facebook, tài liệu trực tuyến.
- **Thuật toán bóc tách và tính toán câu hỏi**:
  - Nhận diện tự động các mẫu `Câu 1:`, `Câu 1.`, `Question 1:`, `Bài 1:`...
  - Tách các phương án `A.`, `B.`, `C.`, `D.` dù nằm trên một dòng hay nhiều dòng.
  - Tự động nhận diện đáp án đúng (từ khóa *Đáp án: A*, dấu sao `*A.`, hoặc bảng đáp án cuối bài `1.A 2.B 3.C...`).
  - Bóc tách phần *Lời giải / Hướng dẫn giải chi tiết*.
  - **Tính toán ước lượng**:
    - Phân loại mức độ khó: *Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao*.
    - Tính toán thời gian làm bài đề xuất dựa trên độ phức tạp của từng câu.
  - **Xem trước và chỉnh sửa trực quan**: Cho phép người dùng trực tiếp sửa nội dung câu hỏi, điều chỉnh đáp án đúng bằng nút chọn radio trước khi lưu vào ngân hàng đề thi.
  - **Tùy chọn AI (Google Gemini)**: Hỗ trợ tích hợp Gemini Vision API để giải chi tiết đề thi mờ hoặc phức tạp.

### 3. 🎯 Bài Kiểm Tra Tương Tác Chuẩn Web & Điện Thoại
- **2 Chế độ làm bài linh hoạt**:
  - **Chế độ Luyện tập (Practice)**: Chọn đáp án -> Biết ngay đúng/sai kèm giải thích chi tiết và công thức liên quan.
  - **Chế độ Kiểm tra bấm giờ (Exam)**: Đồng hồ đếm ngược với cảnh báo thời gian, xáo trộn câu hỏi và đáp án ngẫu nhiên, chấm điểm khi nộp bài.
- **Tối ưu trải nghiệm di động (Mobile-First UI)**:
  - Nút bấm A/B/C/D to rõ, phản hồi cảm ứng mượt mà.
  - Bảng ma trận câu hỏi (Question Palette) nổi giúp nhảy nhanh đến bất kỳ câu hỏi nào.
  - Tính năng đánh dấu câu phân vân (Bookmark) để kiểm tra lại trước khi nộp.
  - Thanh tiến trình trực quan.

### 4. 📊 Chấm Điểm & Phân Tích Kết Quả
- Chấm điểm tự động theo thang điểm 10.
- Xếp loại học tập: *Xuất sắc, Giỏi, Khá, Trung bình, Cần ôn luyện thêm*.
- Phân tích chi tiết số câu đúng, sai, bỏ qua, thời gian làm bài trung bình mỗi câu.
- Hiệu ứng pháo hoa Confetti khi đạt điểm cao.
- Bộ lọc xem lại: Xem tất cả câu hỏi, chỉ xem câu sai, hoặc chỉ xem câu đúng.
- Hỗ trợ in kết quả bài làm ra giấy.

### 5. 💾 Cơ Sở Dữ Liệu Nội Bộ (IndexedDB + LocalStorage)
- Dữ liệu lưu trữ an toàn ngay trên trình duyệt mà không cần cài đặt cơ sở dữ liệu phức tạp.
- **Tính năng Sao lưu & Phục hồi (Export/Import JSON)**: Cho phép xuất toàn bộ cơ sở dữ liệu đề cương, đề thi thành 1 file JSON để gửi cho các bạn trong lớp nhập vào máy cùng ôn tập.

---

## 🚀 Hướng Dẫn Khởi Chạy

### Cách 1: Mở Trực Tiếp Trên Trình Duyệt (Không cần cài đặt)
Chỉ cần nhấp đúp vào file `index.html` để mở trong Google Chrome, Microsoft Edge hoặc Safari.

### Cách 2: Chạy Máy Chủ Để Cả Lớp Cùng Kết Nối Trên Điện Thoại (Khuyên dùng)
Trong thư mục dự án, chạy lệnh:
```bash
node server.js
```
Màn hình console sẽ hiển thị địa chỉ truy cập:
- Trên máy tính: `http://localhost:3000`
- Trên **điện thoại** (kết nối cùng Wi-Fi): `http://<Địa-chỉ-IP-mạng-nội-bộ>:3000`

---

## 📁 Cấu Trúc Mã Nguồn

```
lucid-euclid/
├── index.html          # Giao diện chính responsive (Tailwind CSS, KaTeX, Lucide Icons)
├── server.js           # Máy chủ HTTP Node.js tĩnh nhẹ (Zero Dependencies)
├── css/
│   └── style.css       # Hiệu ứng chuyển động, tối ưu cảm ứng di động & định dạng in ấn
├── js/
│   ├── app.js          # Trình điều khiển trung tâm (Controller & View Router)
│   ├── db.js           # Cơ sở dữ liệu IndexedDB & LocalStorage
│   ├── parser.js       # Thuật toán phân tích, tính toán và bóc tách câu hỏi
│   ├── ocr.js          # Xử lý nhận dạng ảnh (Tesseract OCR) và đọc file PDF/Word/AI
│   ├── quiz.js         # Bộ máy thi tương tác (Timer, Shuffle, Palette, Scoring)
│   └── sample-data.js  # Dữ liệu mẫu chuẩn THPT (Toán, Lý, Hóa, Sinh, Văn, Anh)
└── README.md           # Tài liệu hướng dẫn sử dụng
```

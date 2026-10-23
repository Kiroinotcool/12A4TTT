// sample-data.js - Dữ liệu mẫu khởi tạo cho hệ sinh thái LMS Lớp học
window.DEFAULT_DATA = {
  classInfo: {
    className: "Lớp 12A1 - THPT Chuyên",
    academicYear: "Năm học 2024 - 2025",
    semester: "Học kỳ 1",
    description: "Hệ thống quản lý đề cương môn học, tự động phân tích đề thi từ ảnh/file và tổ chức ôn luyện trắc nghiệm trên Web & Điện thoại."
  },
  subjects: [
    {
      id: "toan",
      name: "Toán học",
      code: "MATH12",
      icon: "calculator",
      color: "from-blue-600 to-indigo-600",
      accent: "blue",
      hasOutline: true,
      hasExam: true,
      outlines: [
        {
          id: "outline-toan-01",
          title: "Đề Cương Ôn Tập Giải Tích 12 (Khảo Sát Hàm Số)",
          updatedAt: "2024-10-20",
          author: "Tổ Toán - Thầy Tuấn",
          summary: "Trọng tâm khảo sát hàm số, tính đơn điệu, cực trị, GTLN-GTNN, tiệm cận đồ thị.",
          topics: [
            {
              name: "Chủ đề 1: Tính đơn điệu và Cực trị hàm số",
              content: "Hàm số $y = f(x)$ đồng biến trên $(a, b) \\Leftrightarrow f'(x) \\ge 0, \\forall x \\in (a, b)$. Điểm cực trị là nghiệm của $f'(x) = 0$ mà qua đó $f'(x)$ đổi dấu."
            },
            {
              name: "Chủ đề 2: Giá trị lớn nhất và nhỏ nhất",
              content: "Quy tắc tìm GTLN, GTNN trên đoạn $[a, b]$: Tính đạo hàm, tìm các nghiệm $x_i \\in [a, b]$, tính $f(a), f(b), f(x_i)$ và so sánh."
            },
            {
              name: "Chủ đề 3: Đường tiệm cận của đồ thị hàm số",
              content: "Tiệm cận đứng $x = x_0$ khi $\\lim_{x \\to x_0^\\pm} f(x) = \\pm \\infty$. Tiệm cận ngang $y = y_0$ khi $\\lim_{x \\to \\pm \\infty} f(x) = y_0$."
            }
          ]
        },
        {
          id: "outline-toan-02",
          title: "Đề Cương Hình Học Không Gian 12 (Khối Đa Diện)",
          updatedAt: "2024-10-22",
          author: "Tổ Toán - Cô Linh",
          summary: "Thể tích khối chóp, lăng trụ, lăng trụ đứng, hình chóp đều và tỷ số thể tích Simson.",
          topics: [
            {
              name: "Chủ đề 1: Thể tích khối chóp & lăng trụ",
              content: "Thể tích khối chóp: $V = \\frac{1}{3} B \\cdot h$. Thể tích khối lăng trụ: $V = B \\cdot h$."
            },
            {
              name: "Chủ đề 2: Tỷ số thể tích khối chóp tam giác (Simson)",
              content: "Cho hình chóp $S.ABC$. Các điểm $A', B', C'$ lần lượt trên $SA, SB, SC$. Ta có: $\\frac{V_{S.A'B'C'}}{V_{S.ABC}} = \\frac{SA'}{SA} \\cdot \\frac{SB'}{SB} \\cdot \\frac{SC'}{SC}$."
            }
          ]
        }
      ],
      outline: {
        title: "Đề Cương Ôn Tập Giải Tích 12 (Khảo Sát Hàm Số)",
        updatedAt: "2024-10-20",
        author: "Tổ Toán - Thầy Tuấn",
        summary: "Trọng tâm khảo sát hàm số, tính đơn điệu, cực trị, GTLN-GTNN, tiệm cận đồ thị."
      },
      exams: [
        {
          id: "exam-toan-01",
          title: "Đề Ôn Tập Khảo Sát Hàm Số & Thể Tích Khối Đa Diện",
          durationMinutes: 20,
          description: "Bộ 6 câu trắc nghiệm trọng tâm có công thức Toán KaTeX và lời giải chi tiết từng bước.",
          createdAt: "2024-10-21",
          questions: [
            {
              id: "q-toan-1",
              question: "Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của đồ thị hàm số là:",
              options: [
                { key: "A", text: "$A(0; 2)$" },
                { key: "B", text: "$B(2; -2)$" },
                { key: "C", text: "$C(0; 0)$" },
                { key: "D", text: "$D(1; 0)$" }
              ],
              correctAnswer: "A",
              explanation: "Ta có $y' = 3x^2 - 6x = 3x(x - 2)$. Cho $y' = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Qua $x = 0$, $y'$ đổi dấu từ dương sang âm nên $x = 0$ là điểm cực đại $\\Rightarrow y(0) = 2$. Vậy tọa độ điểm cực đại là $(0; 2)$.",
              difficulty: "Nhận biết",
              topic: "Cực trị hàm số"
            },
            {
              id: "q-toan-2",
              question: "Số đường tiệm cận ngang của đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$ là:",
              options: [
                { key: "A", text: "$1$" },
                { key: "B", text: "$2$" },
                { key: "C", text: "$0$" },
                { key: "D", text: "$3$" }
              ],
              correctAnswer: "A",
              explanation: "Ta có $\\lim_{x \\to +\\infty} \\frac{2x - 1}{x + 1} = 2$ và $\\lim_{x \\to -\\infty} \\frac{2x - 1}{x + 1} = 2$. Do đó đồ thị có duy nhất 1 đường tiệm cận ngang là $y = 2$.",
              difficulty: "Nhận biết",
              topic: "Tiệm cận đồ thị"
            },
            {
              id: "q-toan-3",
              question: "Giá trị lớn nhất của hàm số $f(x) = x^4 - 2x^2 + 3$ trên đoạn $[0; 2]$ bằng:",
              options: [
                { key: "A", text: "$11$" },
                { key: "B", text: "$3$" },
                { key: "C", text: "$2$" },
                { key: "D", text: "$9$" }
              ],
              correctAnswer: "A",
              explanation: "Ta có $f'(x) = 4x^3 - 4x = 4x(x^2 - 1)$. $f'(x) = 0 \\Leftrightarrow x = 0$ hoặc $x = 1$ (do xét trên $[0; 2]$). Ta tính: $f(0) = 3$, $f(1) = 2$, $f(2) = 16 - 8 + 3 = 11$. Vậy $\\max_{[0; 2]} f(x) = 11$.",
              difficulty: "Thông hiểu",
              topic: "GTLN & GTNN"
            },
            {
              id: "q-toan-4",
              question: "Cho khối chóp tam giác đều $S.ABC$ có cạnh đáy bằng $a$ và cạnh bên bằng $2a$. Thể tích $V$ của khối chóp đã cho là:",
              options: [
                { key: "A", text: "$V = \\frac{\\sqrt{11}a^3}{12}$" },
                { key: "B", text: "$V = \\frac{\\sqrt{11}a^3}{4}$" },
                { key: "C", text: "$V = \\frac{\\sqrt{3}a^3}{12}$" },
                { key: "D", text: "$V = \\frac{\\sqrt{33}a^3}{12}$" }
              ],
              correctAnswer: "A",
              explanation: "Diện tích đáy $S_{ABC} = \\frac{a^2\\sqrt{3}}{4}$. Gọi $G$ là trọng tâm $\\triangle ABC \\Rightarrow SG \\perp (ABC)$. Bán kính đường tròn ngoại tiếp đáy $R = AG = \\frac{a\\sqrt{3}}{3}$. Chiều cao $h = SG = \\sqrt{SA^2 - AG^2} = \\sqrt{4a^2 - \\frac{a^2}{3}} = a\\sqrt{\\frac{11}{3}}$. Thể tích $V = \\frac{1}{3} S_{ABC} \\cdot h = \\frac{1}{3} \\cdot \\frac{a^2\\sqrt{3}}{4} \\cdot a\\frac{\\sqrt{11}}{\\sqrt{3}} = \\frac{\\sqrt{11}a^3}{12}$.",
              difficulty: "Vận dụng",
              topic: "Khối đa diện"
            },
            {
              id: "q-toan-5",
              question: "Hàm số nào sau đây đồng biến trên khoảng $(-\\infty; +\\infty)$?",
              options: [
                { key: "A", text: "$y = x^3 + 3x - 1$" },
                { key: "B", text: "$y = x^4 + 2x^2$" },
                { key: "C", text: "$y = \\frac{x - 1}{x + 2}$" },
                { key: "D", text: "$y = -x^3 - x$" }
              ],
              correctAnswer: "A",
              explanation: "Xét $y = x^3 + 3x - 1$ có $y' = 3x^2 + 3 > 0, \\forall x \\in \\mathbb{R}$. Do đó hàm số luôn đồng biến trên $\\mathbb{R}$.",
              difficulty: "Nhận biết",
              topic: "Tính đơn điệu"
            },
            {
              id: "q-toan-6",
              question: "Số giao điểm của đồ thị hàm số $y = x^3 - 3x$ và đường thẳng $y = x$ là:",
              options: [
                { key: "A", text: "$3$" },
                { key: "B", text: "$1$" },
                { key: "C", text: "$2$" },
                { key: "D", text: "$0$" }
              ],
              correctAnswer: "A",
              explanation: "Phương trình hoành độ giao điểm: $x^3 - 3x = x \\Leftrightarrow x^3 - 4x = 0 \\Leftrightarrow x(x^2 - 4) = 0 \\Leftrightarrow x = 0$ hoặc $x = \\pm 2$. Có 3 nghiệm phân biệt nên có 3 giao điểm.",
              difficulty: "Thông hiểu",
              topic: "Tương giao đồ thị"
            }
          ]
        }
      ]
    },
    {
      id: "vat-ly",
      name: "Vật lý",
      code: "PHYS12",
      icon: "atom",
      color: "from-amber-500 to-orange-600",
      accent: "amber",
      hasOutline: true,
      hasExam: true,
      outline: {
        title: "Đề Cương Dao Động Cơ & Sóng Cơ 12",
        updatedAt: "2024-10-18",
        author: "Cô Hằng - Tổ Lý",
        summary: "Dao động điều hòa, con lắc lò xo, con lắc đơn, sự truyền sóng và hiện tượng giao thoa sóng cơ.",
        topics: [
          {
            name: "Chủ đề 1: Đại cương dao động điều hòa",
            content: "Phương trình $x = A\\cos(\\omega t + \\varphi)$. Vận tốc $v = x' = -\\omega A\\sin(\\omega t + \\varphi)$, sớm pha $\\pi/2$ so với li độ. Gia tốc $a = v' = -\\omega^2 x$, ngược pha li độ."
          },
          {
            name: "Chủ đề 2: Con lắc lò xo và con lắc đơn",
            content: "Con lắc lò xo: $\\omega = \\sqrt{\\frac{k}{m}}$, $T = 2\\pi\\sqrt{\\frac{m}{k}}$. Con lắc đơn: $\\omega = \\sqrt{\\frac{g}{l}}$, $T = 2\\pi\\sqrt{\\frac{l}{g}}$."
          },
          {
            name: "Chủ đề 3: Sóng cơ và sự truyền sóng",
            content: "Bước sóng $\\lambda = v \\cdot T = \\frac{v}{f}$. Độ lệch pha giữa 2 điểm cách nhau khoảng $d$ trên cùng một phương truyền sóng: $\\Delta \\varphi = \\frac{2\\pi d}{\\lambda}$."
          }
        ]
      },
      exams: [
        {
          id: "exam-ly-01",
          title: "Đề Ôn Tập Chương 1: Dao Động Cơ Học",
          durationMinutes: 15,
          description: "5 câu trắc nghiệm dao động điều hòa, con lắc lò xo và bài toán thời gian.",
          createdAt: "2024-10-19",
          questions: [
            {
              id: "q-ly-1",
              question: "Một vật dao động điều hòa theo phương trình $x = 6\\cos(4\\pi t + \\frac{\\pi}{3})$ (cm). Biên độ dao động của vật là:",
              options: [
                { key: "A", text: "$6\\text{ cm}$" },
                { key: "B", text: "$4\\pi\\text{ cm}$" },
                { key: "C", text: "$12\\text{ cm}$" },
                { key: "D", text: "$3\\text{ cm}$" }
              ],
              correctAnswer: "A",
              explanation: "Đối chiếu với phương trình tổng quát $x = A\\cos(\\omega t + \\varphi)$, ta có biên độ $A = 6\\text{ cm}$.",
              difficulty: "Nhận biết",
              topic: "Dao động điều hòa"
            },
            {
              id: "q-ly-2",
              question: "Tại nơi có gia tốc trọng trường $g$, một con lắc đơn có chiều dài $l$ dao động điều hòa. Chu kỳ dao động của con lắc được tính bằng công thức:",
              options: [
                { key: "A", text: "$T = 2\\pi\\sqrt{\\frac{l}{g}}$" },
                { key: "B", text: "$T = 2\\pi\\sqrt{\\frac{g}{l}}$" },
                { key: "C", text: "$T = \\frac{1}{2\\pi}\\sqrt{\\frac{l}{g}}$" },
                { key: "D", text: "$T = 2\\pi\\sqrt{\\frac{m}{k}}$" }
              ],
              correctAnswer: "A",
              explanation: "Chu kỳ dao động của con lắc đơn: $T = 2\\pi\\sqrt{\\frac{l}{g}}$.",
              difficulty: "Nhận biết",
              topic: "Con lắc đơn"
            },
            {
              id: "q-ly-3",
              question: "Một con lắc lò xo có độ cứng $k = 100\\text{ N/m}$, khối lượng vật nhỏ $m = 100\\text{ g}$. Lấy $\\pi^2 = 10$. Tần số dao động của con lắc là:",
              options: [
                { key: "A", text: "$5\\text{ Hz}$" },
                { key: "B", text: "$10\\text{ Hz}$" },
                { key: "C", text: "$0,2\\text{ s}$" },
                { key: "D", text: "$2\\text{ Hz}$" }
              ],
              correctAnswer: "A",
              explanation: "Đổi $m = 100\\text{ g} = 0,1\\text{ kg}$. Tần số $f = \\frac{1}{2\\pi}\\sqrt{\\frac{k}{m}} = \\frac{1}{2\\pi}\\sqrt{\\frac{100}{0,1}} = \\frac{1}{2\\pi}\\sqrt{1000} = \\frac{10\\pi}{2\\pi} = 5\\text{ Hz}$.",
              difficulty: "Thông hiểu",
              topic: "Con lắc lò xo"
            },
            {
              id: "q-ly-4",
              question: "Trong dao động điều hòa, đại lượng nào sau đây biến thiên cùng tần số với li độ nhưng ngược pha với li độ?",
              options: [
                { key: "A", text: "Gia tốc" },
                { key: "B", text: "Vận tốc" },
                { key: "C", text: "Động năng" },
                { key: "D", text: "Thế năng" }
              ],
              correctAnswer: "A",
              explanation: "Gia tốc $a = -\\omega^2 x = \\omega^2 A\\cos(\\omega t + \\varphi + \\pi)$, do đó gia tốc ngược pha và cùng tần số với li độ.",
              difficulty: "Nhận biết",
              topic: "Mối liên hệ pha"
            },
            {
              id: "q-ly-5",
              question: "Một sóng cơ hình sin có chu kỳ $0,1\\text{ s}$ truyền với tốc độ $2\\text{ m/s}$. Bước sóng của sóng cơ này là:",
              options: [
                { key: "A", text: "$0,2\\text{ m}$" },
                { key: "B", text: "$20\\text{ m}$" },
                { key: "C", text: "$0,05\\text{ m}$" },
                { key: "D", text: "$2\\text{ m}$" }
              ],
              correctAnswer: "A",
              explanation: "Bước sóng $\\lambda = v \\cdot T = 2 \\cdot 0,1 = 0,2\\text{ m} = 20\\text{ cm}$.",
              difficulty: "Thông hiểu",
              topic: "Sóng cơ"
            }
          ]
        }
      ]
    },
    {
      id: "hoa-hoc",
      name: "Hóa học",
      code: "CHEM12",
      icon: "flask-conical",
      color: "from-emerald-600 to-teal-700",
      accent: "emerald",
      hasOutline: true,
      hasExam: true,
      outlines: [
        {
          id: "outline-hoa-01",
          title: "Đề Cương Este - Lipit & Cacbohiđrat",
          updatedAt: "2024-10-15",
          author: "Thầy Hưng - Tổ Hóa",
          summary: "Cấu tạo, đồng phân, danh pháp, tính chất hóa học và phương pháp giải bài toán thủy phân Este - Chất béo.",
          topics: [
            {
              name: "Chủ đề 1: Este no đơn chức mạch hở",
              content: "Công thức chung $C_n H_{2n} O_2$ ($n \\ge 2$). Phản ứng xà phòng hóa: $RCOOR' + NaOH \\xrightarrow{t^\\circ} RCOONa + R'OH$."
            },
            {
              name: "Chủ đề 2: Chất béo (Triglixerit)",
              content: "Công thức chung $(RCOO)_3 C_3 H_5$. Khi thủy phân luôn sinh ra glixerol $C_3 H_5(OH)_3$. Tỉ lệ $n_{chất\\ béo} = \\frac{1}{3} n_{NaOH} = n_{glixerol}$."
            }
          ]
        },
        {
          id: "outline-hoa-02",
          title: "Đề Cương Amin, Amino Axit & Protein",
          updatedAt: "2024-10-22",
          author: "Thầy Hưng - Tổ Hóa",
          summary: "Đặc điểm cấu tạo nhóm amin $-NH_2$, tính bazơ của amin, tính lưỡng tính của amino axit và phản ứng màu biure.",
          topics: [
            {
              name: "Chủ đề 1: Tính chất của Amin",
              content: "Amin có tính bazơ tương tự $NH_3$. So sánh lực bazơ: $CH_3NH_2 > NH_3 > C_6H_5NH_2$ (anilin)."
            },
            {
              name: "Chủ đề 2: Amino Axit",
              content: "Amino axit là hợp chất hữu cơ tạp chức, vừa có tính axit vừa có tính bazơ (lưỡng tính). Phản ứng trùng ngưng tạo peptit."
            }
          ]
        }
      ],
      outline: {
        title: "Đề Cương Este - Lipit & Cacbohiđrat",
        updatedAt: "2024-10-15",
        author: "Thầy Hưng - Tổ Hóa",
        summary: "Cấu tạo, đồng phân, danh pháp, tính chất hóa học và phương pháp giải bài toán thủy phân Este - Chất béo."
      },
      exams: [
        {
          id: "exam-hoa-01",
          title: "Đề Trắc Nghiệm Este - Lipit (Cơ bản đến Nâng cao)",
          durationMinutes: 15,
          description: "4 câu hỏi trọng tâm xà phòng hóa và nhận diện chất béo.",
          createdAt: "2024-10-17",
          questions: [
            {
              id: "q-hoa-1",
              question: "Este no, đơn chức, mạch hở có công thức phân tử tổng quát là:",
              options: [
                { key: "A", text: "$C_n H_{2n} O_2\\ (n \\ge 2)$" },
                { key: "B", text: "$C_n H_{2n-2} O_2\\ (n \\ge 2)$" },
                { key: "C", text: "$C_n H_{2n+2} O_2\\ (n \\ge 1)$" },
                { key: "D", text: "$C_n H_{2n} O\\ (n \\ge 2)$" }
              ],
              correctAnswer: "A",
              explanation: "Este no đơn chức mạch hở có 1 liên kết $\\pi$ (trong nhóm $-COO-$) và mạch hở nên có dạng $C_n H_{2n} O_2$ với số cacbon tối thiểu $n = 2$ ($HCOOCH_3$).",
              difficulty: "Nhận biết",
              topic: "Este"
            },
            {
              id: "q-hoa-2",
              question: "Chất nào sau đây là chất béo no, ở điều kiện thường là chất rắn?",
              options: [
                { key: "A", text: "Tristearin $(C_{17} H_{35} COO)_3 C_3 H_5$" },
                { key: "B", text: "Triolein $(C_{17} H_{33} COO)_3 C_3 H_5$" },
                { key: "C", text: "Metyl axetat $CH_3 COOCH_3$" },
                { key: "D", text: "Axit axetic $CH_3 COOH$" }
              ],
              correctAnswer: "A",
              explanation: "Tristearin và Tripanmitin là chất béo no, tồn tại ở trạng thái rắn ở nhiệt độ thường. Triolein là chất béo không no ở thể lỏng.",
              difficulty: "Nhận biết",
              topic: "Chất béo"
            },
            {
              id: "q-hoa-3",
              question: "Thủy phân hoàn toàn $8,8\\text{ gam}$ etyl axetat trong dung dịch $NaOH$ vừa đủ thu được $m\\text{ gam}$ muối. Giá trị của $m$ là:",
              options: [
                { key: "A", text: "$8,2\\text{ g}$" },
                { key: "B", text: "$6,8\\text{ g}$" },
                { key: "C", text: "$4,1\\text{ g}$" },
                { key: "D", text: "$10,2\\text{ g}$" }
              ],
              correctAnswer: "A",
              explanation: "$n_{CH_3 COOC_2 H_5} = \\frac{8,8}{88} = 0,1\\text{ mol}$. Phương trình: $CH_3 COOC_2 H_5 + NaOH \\to CH_3 COONa + C_2 H_5 OH$. Muối thu được là $CH_3 COONa$: $n_{muối} = 0,1\\text{ mol} \\Rightarrow m = 0,1 \\times 82 = 8,2\\text{ gam}$.",
              difficulty: "Thông hiểu",
              topic: "Bài toán Este"
            },
            {
              id: "q-hoa-4",
              question: "Chất nào sau đây tác dụng với dung dịch $AgNO_3$ trong $NH_3$ đun nóng tạo kết tủa bạc (phản ứng tráng gương)?",
              options: [
                { key: "A", text: "$HCOOCH_3$" },
                { key: "B", text: "$CH_3 COOC_2 H_5$" },
                { key: "C", text: "$CH_3 COOH$" },
                { key: "D", text: "$CH_3 OCH_3$" }
              ],
              correctAnswer: "A",
              explanation: "Este của axit fomic ($HCOOR$) chứa nhóm chức andehit $-CHO$ nên có khả năng tham gia phản ứng tráng bạc.",
              difficulty: "Thông hiểu",
              topic: "Este fomat"
            }
          ]
        }
      ]
    },
    {
      id: "tieng-anh",
      name: "Tiếng Anh",
      code: "ENG12",
      icon: "languages",
      color: "from-sky-500 to-cyan-600",
      accent: "cyan",
      hasOutline: true,
      hasExam: true,
      outline: {
        title: "English 12 - Grammar & Lexical Outline",
        updatedAt: "2024-10-12",
        author: "Ms. Lan",
        summary: "Tenses revision, Relative Clauses, Reported Speech, Inversion, and Conditional sentences.",
        topics: [
          {
            name: "Topic 1: Conditionals & Wish Clauses",
            content: "Type 1: If + S + V(s/es), S + will + V. Type 2: If + S + V2/ed (were), S + would + V. Type 3: If + S + had + V3/ed, S + would have + V3/ed."
          },
          {
            name: "Topic 2: Relative Clauses",
            content: "Who (person subject), Whom (person object), Which (thing), Whose (possession), That (restrictive clauses)."
          }
        ]
      },
      exams: [
        {
          id: "exam-eng-01",
          title: "English Grammar Test: Conditional Sentences & Tenses",
          durationMinutes: 10,
          description: "4 câu hỏi trắc nghiệm tiếng Anh bám sát cấu trúc đề tốt nghiệp THPT.",
          createdAt: "2024-10-14",
          questions: [
            {
              id: "q-eng-1",
              question: "If I _______ his phone number, I would have invited him to the birthday party yesterday.",
              options: [
                { key: "A", text: "had known" },
                { key: "B", text: "knew" },
                { key: "C", text: "have known" },
                { key: "D", text: "know" }
              ],
              correctAnswer: "A",
              explanation: "Đây là câu điều kiện loại 3 diễn tả sự việc trái với quá khứ: Mệnh đề If dùng thì Quá khứ hoàn thành (had + V3/ed), mệnh đề chính dùng would have + V3/ed.",
              difficulty: "Thông hiểu",
              topic: "Conditional Sentences"
            },
            {
              id: "q-eng-2",
              question: "The girl _______ father is a famous scientist won first prize in the national biology competition.",
              options: [
                { key: "A", text: "whose" },
                { key: "B", text: "who" },
                { key: "C", text: "whom" },
                { key: "D", text: "which" }
              ],
              correctAnswer: "A",
              explanation: "'Whose' dùng để chỉ sự sở hữu (whose father = cha của cô gái).",
              difficulty: "Nhận biết",
              topic: "Relative Pronouns"
            },
            {
              id: "q-eng-3",
              question: "By the time we arrived at the cinema, the movie _______ already.",
              options: [
                { key: "A", text: "had started" },
                { key: "B", text: "started" },
                { key: "C", text: "has started" },
                { key: "D", text: "was starting" }
              ],
              correctAnswer: "A",
              explanation: "Hành động bộ phim bắt đầu xảy ra trước hành động chúng tôi đến trong quá khứ ('By the time + Past Simple, Past Perfect'). Do đó dùng thì Quá khứ hoàn thành 'had started'.",
              difficulty: "Thông hiểu",
              topic: "Past Tenses"
            },
            {
              id: "q-eng-4",
              question: "Hardly _______ down to dinner when the telephone rang.",
              options: [
                { key: "A", text: "had we sat" },
                { key: "B", text: "we had sat" },
                { key: "C", text: "did we sit" },
                { key: "D", text: "we were sitting" }
              ],
              correctAnswer: "A",
              explanation: "Cấu trúc đảo ngữ: 'Hardly + had + S + V3/ed + when + S + V2/ed' (Vừa mới... thì...).",
              difficulty: "Vận dụng",
              topic: "Inversion"
            }
          ]
        }
      ]
    },
    {
      id: "sinh-hoc",
      name: "Sinh học",
      code: "BIO12",
      icon: "dna",
      color: "from-green-600 to-emerald-700",
      accent: "green",
      hasOutline: false,
      hasExam: true,
      outline: null,
      exams: [
        {
          id: "exam-bio-01",
          title: "Đề Trắc Nghiệm Di Truyền Phân Tử & Mã Di Truyền",
          durationMinutes: 10,
          description: "Bộ câu hỏi về cơ chế nhân đôi ADN và phiên mã, dịch mã.",
          createdAt: "2024-10-10",
          questions: [
            {
              id: "q-bio-1",
              question: "Bộ ba nào sau đây quy định tín hiệu mở đầu dịch mã và mã hóa axit amin Metionin ở sinh vật nhân thực?",
              options: [
                { key: "A", text: "5'AUG3'" },
                { key: "B", text: "5'UAA3'" },
                { key: "C", text: "5'UAG3'" },
                { key: "D", text: "5'UGA3'" }
              ],
              correctAnswer: "A",
              explanation: "AUG trên mARN là codon mở đầu, mã hóa axit amin mở đầu (Met ở sinh vật nhân thực, fMet ở sinh vật nhân sơ).",
              difficulty: "Nhận biết",
              topic: "Mã di truyền"
            },
            {
              id: "q-bio-2",
              question: "Trong phân tử ADN mạch kép, bazơ nitơ Adenin (A) liên kết với Timin (T) bằng:",
              options: [
                { key: "A", text: "2 liên kết hiđro" },
                { key: "B", text: "3 liên kết hiđro" },
                { key: "C", text: "1 liên kết photphodieste" },
                { key: "D", text: "1 liên kết peptit" }
              ],
              correctAnswer: "A",
              explanation: "Theo nguyên tắc bổ sung: A liên kết với T bằng 2 liên kết hiđro; G liên kết với X bằng 3 liên kết hiđro.",
              difficulty: "Nhận biết",
              topic: "Cấu trúc ADN"
            }
          ]
        }
      ]
    },
    {
      id: "ngu-van",
      name: "Ngữ văn",
      code: "LIT12",
      icon: "book-open",
      color: "from-rose-600 to-pink-600",
      accent: "rose",
      hasOutline: true,
      hasExam: false,
      outline: {
        title: "Đề Cương Ôn Tập Tác Phẩm Văn Học Học Kỳ 1",
        updatedAt: "2024-10-08",
        author: "Cô Mai",
        summary: "Hệ thống hóa nội dung và nghệ thuật các tác phẩm trọng tâm: Tây Tiến (Quang Dũng), Việt Bắc (Tố Hữu), Đất Nước (Nguyễn Khoa Điềm), Sóng (Xuân Quỳnh).",
        topics: [
          {
            name: "Bài 1: Tây Tiến (Quang Dũng)",
            content: "Khắc họa bức tranh thiên nhiên Tây Bắc hùng vĩ, hiểm trở nhưng thơ mộng; hình tượng người lính Tây Tiến hào hoa, lãng mạn, mang vẻ đẹp bi tráng."
          },
          {
            name: "Bài 2: Việt Bắc (Tố Hữu)",
            content: "Bản trường ca về cách mạng và kháng chiến, thể hiện nghĩa tình son sắt thuỷ chung giữa cán bộ kháng chiến và đồng bào Việt Bắc qua thể thơ lục bát ngọt ngào."
          },
          {
            name: "Bài 3: Đất Nước (Trích trường ca Mặt đường khát vọng)",
            content: "Tư tưởng cốt lõi: 'Đất Nước của Nhân dân'. Đất Nước được cảm nhận đa chiều từ chiều dài thời gian lịch sử, chiều rộng không gian địa lý đến chiều sâu tâm hồn văn hóa phong tục."
          }
        ]
      },
      exams: []
    },
    {
      id: "lich-su",
      name: "Lịch sử",
      code: "HIST12",
      icon: "landmark",
      color: "from-red-600 to-amber-700",
      accent: "red",
      hasOutline: true,
      hasExam: true,
      outline: {
        title: "Đề Cương Ôn Tập Giữa Học Kì I - Lịch Sử 12",
        lastUpdated: "2026-10-23",
        chapters: [
          {
            title: "Bài 1: Liên Hợp Quốc và Trật Tự Thế Giới Mới",
            topics: [
              "Bối cảnh thành lập và mục tiêu của Liên Hợp Quốc (1945)",
              "Nguyên tắc hoạt động: Giải quyết tranh chấp bằng biện pháp hòa bình",
              "Vai trò của Liên Hợp Quốc và quan hệ hợp tác với Việt Nam (từ 1977)"
            ]
          }
        ]
      },
      exams: [
        {
          id: "exam-lichsu-01",
          title: "Đề Ôn Tập Bài 1: Liên Hợp Quốc (Chuẩn GDPT 2018)",
          durationMinutes: 15,
          totalQuestions: 2,
          questions: [
            {
              id: "q-ls-1",
              num: 1,
              type: "single_choice",
              question: "Nội dung nào là cơ sở để tổ chức Liên hợp quốc đề ra nguyên tắc “Giải quyết các tranh chấp quốc tế bằng biện pháp hòa bình”?",
              options: [
                { key: "A", text: "Hòa bình là nguyện vọng, xu thế của các dân tộc trên thế giới." },
                { key: "B", text: "Hòa bình là điều kiện quyết định để duy trì chế độ chính trị." },
                { key: "C", text: "Mục đích của Liên hợp quốc là cân bằng lợi ích của các nước lớn." },
                { key: "D", text: "Tranh chấp, xung đột chỉ xảy ra ở một số ít khu vực trên thế giới." }
              ],
              correctAnswer: "A",
              explanation: "Hòa bình luôn là nguyện vọng tha thiết và xu thế chung của nhân loại sau thảm họa Chiến tranh thế giới thứ hai.",
              difficulty: "Nhận biết",
              topic: "Lịch sử thế giới",
              needsReview: false
            },
            {
              id: "q-ls-2",
              num: 2,
              type: "true_false",
              question: "Đọc đoạn tư liệu sau về Liên hợp quốc. Trong mỗi ý a), b), c), d), thí sinh chọn Đúng hoặc Sai:",
              subQuestions: [
                {
                  key: "a",
                  text: "Liên hợp quốc là tổ chức quốc tế lớn nhất được thành lập năm 1945.",
                  correctAnswer: "true"
                },
                {
                  key: "b",
                  text: "Việt Nam là một trong 50 quốc gia tham gia sáng lập Liên hợp quốc.",
                  correctAnswer: "false"
                },
                {
                  key: "c",
                  text: "Duy trì hòa bình và an ninh quốc tế là mục tiêu hàng đầu của Liên hợp quốc.",
                  correctAnswer: "true"
                },
                {
                  key: "d",
                  text: "Trụ sở chính của Liên hợp quốc hiện nay đặt tại Luân Đôn (Anh).",
                  correctAnswer: "false"
                }
              ],
              explanation: "Việt Nam chính thức gia nhập Liên Hợp Quốc vào ngày 20/9/1977 (thành viên thứ 149). Trụ sở chính của Liên Hợp Quốc đặt tại thành phố New York (Hoa Kỳ).",
              difficulty: "Thông hiểu",
              topic: "Lịch sử thế giới",
              needsReview: false
            }
          ]
        }
      ]
    },
    {
      id: "tin-hoc",
      name: "Tin học",
      code: "IT12",
      icon: "cpu",
      color: "from-purple-600 to-indigo-700",
      accent: "purple",
      hasOutline: false,
      hasExam: false,
      outline: null,
      exams: []
    }
  ],
  history: [
    {
      id: "hist-01",
      examId: "exam-toan-01",
      subjectId: "toan",
      subjectName: "Toán học",
      examTitle: "Đề Ôn Tập Khảo Sát Hàm Số & Thể Tích Khối Đa Diện",
      score: 10.0,
      correctCount: 6,
      totalQuestions: 6,
      timeSpentSeconds: 420,
      completedAt: "2024-10-22 15:30",
      details: [
        { questionId: "q-toan-1", selected: "A", correct: "A", isCorrect: true },
        { questionId: "q-toan-2", selected: "A", correct: "A", isCorrect: true },
        { questionId: "q-toan-3", selected: "A", correct: "A", isCorrect: true },
        { questionId: "q-toan-4", selected: "A", correct: "A", isCorrect: true },
        { questionId: "q-toan-5", selected: "A", correct: "A", isCorrect: true },
        { questionId: "q-toan-6", selected: "A", correct: "A", isCorrect: true }
      ]
    }
  ]
};

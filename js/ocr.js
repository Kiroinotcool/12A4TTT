// ocr.js - Xử lý nhận dạng ký tự quang học (OCR) từ Ảnh chụp và trích xuất file PDF / Word
class FileAndOCRProcessor {
  constructor() {
    this.tesseractWorker = null;
    this.geminiApiKey = localStorage.getItem('LMS_GEMINI_API_KEY') || '';
  }

  setApiKey(key) {
    this.geminiApiKey = key ? key.trim() : '';
    localStorage.setItem('LMS_GEMINI_API_KEY', this.geminiApiKey);
  }

  getApiKey() {
    return this.geminiApiKey;
  }

  /**
   * Đọc và trích xuất văn bản từ File (Ảnh, PDF, Word, hoặc TXT)
   * onProgressCallback(statusText, percent)
   */
  async processFile(file, onProgress = () => {}) {
    if (!file) throw new Error('Chưa chọn file');

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // 1. Nếu là file ảnh (JPG, PNG, JPEG, WEBP, BMP)
    if (fileType.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp')) {
      return await this.processImage(file, onProgress);
    }

    // 2. Nếu là file PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.processPDF(file, onProgress);
    }

    // 3. Nếu là file Word (.docx)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      return await this.processDocx(file, onProgress);
    }

    // 4. Nếu là file văn bản thuần (.txt)
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return await this.processTextFile(file, onProgress);
    }

    throw new Error('Định dạng file không được hỗ trợ. Vui lòng tải ảnh (JPG/PNG), tài liệu Word (.docx), PDF hoặc file văn bản (.txt).');
  }

  /**
   * Xử lý file ảnh bằng Tesseract.js OCR (tiếng Việt vie + eng)
   */
  async processImage(imageFileOrBlob, onProgress) {
    onProgress('Đang tải mô hình nhận dạng ảnh Tesseract...', 10);

    // Nếu người dùng có cấu hình Gemini API, ưu tiên gửi ảnh đến Gemini Multimodal để có chất lượng dịch cao nhất
    if (this.geminiApiKey) {
      try {
        onProgress('Đang phân tích hình ảnh bằng AI (Gemini Vision)...', 40);
        const aiText = await this._processImageWithGemini(imageFileOrBlob);
        onProgress('Hoàn tất phân tích AI!', 100);
        return aiText;
      } catch (err) {
        console.warn('AI OCR lỗi, chuyển sang OCR cục bộ Tesseract:', err);
        onProgress('AI không phản hồi, chuyển sang OCR trình duyệt...', 20);
      }
    }

    // Kiểm tra xem thư viện Tesseract đã nạp chưa
    if (typeof Tesseract === 'undefined') {
      throw new Error('Thư viện Tesseract.js chưa được nạp. Vui lòng kiểm tra kết nối mạng.');
    }

    try {
      onProgress('Khởi động động cơ OCR tiếng Việt...', 25);
      
      const imageUrl = URL.createObjectURL(imageFileOrBlob);

      const result = await Tesseract.recognize(
        imageUrl,
        'vie+eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = 30 + Math.round((m.progress || 0) * 65);
              onProgress(`Đang quét chữ tiếng Việt từ ảnh... ${Math.round((m.progress || 0) * 100)}%`, pct);
            } else if (m.status) {
              onProgress(`Trạng thái: ${m.status}...`, 30);
            }
          }
        }
      );

      URL.revokeObjectURL(imageUrl);
      onProgress('Hoàn tất trích xuất chữ từ ảnh!', 100);
      return result.data.text;
    } catch (error) {
      console.error('Lỗi nhận dạng ảnh:', error);
      throw new Error('Không thể nhận dạng chữ từ ảnh này. Vui lòng thử ảnh rõ nét hơn hoặc dán trực tiếp đề thi.');
    }
  }

  /**
   * Xử lý file PDF bằng pdf.js (có thuật toán chống tách chữ tiếng Việt)
   */
  async processPDF(file, onProgress) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('Thư viện PDF.js chưa được nạp.');
    }

    onProgress('Đang đọc cấu trúc file PDF...', 15);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    let fullText = '';
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress(`Đang trích xuất nội dung trang ${pageNum}/${numPages}...`, 20 + Math.round((pageNum / numPages) * 75));
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let lastX = undefined;
      let lastY = undefined;
      let lastWidth = 0;
      let text = '';
      
      for (const item of textContent.items) {
        const curX = item.transform[4];
        const curY = item.transform[5];
        const curWidth = item.width || 0;
        const curStr = item.str;

        if (!curStr) continue;

        if (lastY === undefined || Math.abs(curY - lastY) > 5) {
          // Xuống dòng mới
          text += (text ? '\n' : '') + curStr;
        } else {
          // Cùng dòng: tính khoảng cách ngang giữa item trước và item hiện tại
          const gap = curX - (lastX + lastWidth);
          // Nếu gap >= 2.0 pt thì đây là khoảng cách giữa 2 từ độc lập
          // Nếu gap < 2.0 pt thì đây là các ký tự liền kề trong cùng 1 từ (chống bị tách chữ tiếng Việt)
          if (gap >= 2.0 && !text.endsWith(' ') && !curStr.startsWith(' ')) {
            text += ' ' + curStr;
          } else {
            text += curStr;
          }
        }

        lastX = curX;
        lastY = curY;
        lastWidth = curWidth;
      }
      fullText += text + '\n\n';
    }

    onProgress('Hoàn tất trích xuất PDF!', 100);
    return fullText;
  }

  /**
   * Xử lý file Word .docx bằng Mammoth.js
   */
  async processDocx(file, onProgress) {
    if (typeof mammoth === 'undefined') {
      throw new Error('Thư viện Mammoth.js chưa được nạp.');
    }

    onProgress('Đang phân tích cấu trúc tài liệu Word...', 30);
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    onProgress('Hoàn tất đọc file Word!', 100);
    return result.value;
  }

  /**
   * Xử lý file text thuần
   */
  async processTextFile(file, onProgress) {
    onProgress('Đang đọc file văn bản...', 50);
    const text = await file.text();
    onProgress('Hoàn tất!', 100);
    return text;
  }

  /**
   * Tùy chọn gọi Gemini Vision API khi người dùng cung cấp API Key
   */
  async _processImageWithGemini(file) {
    const base64Data = await this._fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    const prompt = `Bạn là một trợ lý AI phân tích đề thi cho hệ thống LMS trường học.
Nhiệm vụ: Trích xuất chính xác toàn bộ câu hỏi trắc nghiệm từ bức ảnh này thành văn bản có định dạng chuẩn sau:

Câu 1: [Nội dung câu hỏi, công thức toán viết dạng LaTeX $...$]
A. [Nội dung đáp án A]
B. [Nội dung đáp án B]
C. [Nội dung đáp án C]
D. [Nội dung đáp án D]
Đáp án: [A hoặc B hoặc C hoặc D]
Lời giải: [Giải thích chi tiết các bước giải nếu bạn giải được]

Câu 2:
...

Lưu ý:
- Giữ nguyên tất cả các câu hỏi trong ảnh.
- Nhận diện đúng công thức Toán, Lý, Hóa dạng LaTeX KaTeX ($...$).
- Đảm bảo trích xuất đầy đủ 4 đáp án A, B, C, D cho mỗi câu.
- Chỉ xuất nội dung câu hỏi theo đúng cấu trúc, không thêm lời chào mở đầu.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data.split(',')[1]
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Lỗi gọi Gemini API: ' + err);
    }

    const json = await response.json();
    return json.candidates[0].content.parts[0].text;
  }

  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
}

window.fileProcessor = new FileAndOCRProcessor();

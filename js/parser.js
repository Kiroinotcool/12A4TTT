// parser.js - Bộ máy thuật toán phân tích, tính toán và bóc tách câu hỏi đề thi
class QuestionParser {
  constructor() {
    this.questionRegex = /(?:^|\n)\s*(?:Câu|CÂU|Question|QUESTION)\s*(\d+)[\s.:\-–—)]\s*/gi;
    this.optionRegex = /(?:^|\s|\n)(?:[A-D]|[a-d])\s*[\.\)]\s*/g;
  }

  /**
   * Thuật toán hàn gắn chữ tiếng Việt bị tách rời do OCR hoặc PDF font spacing
   * Ví dụ: "T ổ   L ị ch  s ử" -> "Tổ Lịch sử", "qu ố c t ế" -> "quốc tế", "A . " -> "A. "
   */
  repairVietnameseSpacing(text) {
    if (!text || typeof text !== 'string') return '';
    let str = text;

    // 1. Chuẩn hóa format Câu và Phương án A, B, C, D
    str = str.replace(/(?:^|\n)\s*(?:Câu|CÂU|Question)\s*(\d+)\s*[\.:\-–—\)]\s*/gi, '\nCâu $1: ');
    str = str.replace(/(^|[\s\n])([A-D])\s*[\.\)]\s*/g, '$1$2. ');

    const vnVowelsList = 'aăâeêioôơuưyàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵAĂÂEÊIOÔƠUƯYÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴ';
    const vnVowelsRegex = new RegExp(`[${vnVowelsList}]`);
    const hasVowel = (s) => vnVowelsRegex.test(s);

    // Phụ âm đầu trơ trọi (hoàn toàn KHÔNG có nguyên âm nào, HOẶC là phụ âm kép 'qu', 'gi')
    const isInitialConsonant = (s) => {
      const clean = s.replace(/[^a-zA-ZđĐ]/g, '');
      if (!clean) return false;
      if (/[.,:;?!'"“”\)\(\]]$/.test(s)) return false;
      if (/^(?:qu|gi|QU|GI)$/i.test(clean)) return true;
      if (hasVowel(s)) return false;
      return /^(?:b|c|d|đ|g|gh|h|k|kh|l|m|n|p|ph|r|s|t|th|tr|v|x|ch|ng|nh|ngh)$/i.test(clean);
    };

    // Phụ âm cuối: c, ch, m, n, ng, nh, p, t
    const isFinalConsonant = (s) => /^(?:c|ch|m|n|ng|nh|p|t)$/i.test(s.trim());

    // Bán nguyên âm cuối: i, y, u, o
    const isFinalGlide = (s) => /^[iyuouIYUO]$/.test(s.trim());

    // Ký tự cuối cùng của chuỗi là một nguyên âm
    const endsWithVowel = (s) => {
      const clean = s.replace(/[^a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]/g, '');
      if (!clean) return false;
      const lastChar = clean[clean.length - 1];
      return vnVowelsRegex.test(lastChar);
    };

    const lines = str.split('\n');
    const repairedLines = lines.map(line => {
      if (!line.trim()) return '';

      let tokens = [];
      let regex = /(\S+)(\s*)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        tokens.push({
          word: match[1],
          trailingSpaces: match[2].length
        });
      }

      let merged = [];
      for (let i = 0; i < tokens.length; i++) {
        let cur = tokens[i];
        if (merged.length === 0) {
          merged.push(cur.word);
          continue;
        }

        let prevWord = merged[merged.length - 1];
        let prevToken = tokens[i - 1];
        let spaceBefore = prevToken ? prevToken.trailingSpaces : 1;

        let cleanEnding = cur.word.replace(/[.,:;?!'"“”\)\(\]]+$/, '');

        // 1. prevWord là phụ âm đầu trơ trọi (T, L, s, ch, qu, gi, b, đ, v, h, N...)
        if (isInitialConsonant(prevWord)) {
          merged[merged.length - 1] = prevWord + cur.word;
          continue;
        }

        // 2. cur.word là nguyên âm đơn lẻ mang dấu thanh (ở, ệ, ộ, ả, ế, ắ, ử, ổ)
        if (cleanEnding.length <= 2 && /^[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]$/.test(cleanEnding)) {
          if (!hasVowel(prevWord) || /[iuưIUƯyY]$/.test(prevWord.replace(/[^a-zA-ZđĐ\u00C0-\u024F\u1EA0-\u1EF9]/g, ''))) {
            merged[merged.length - 1] = prevWord + cur.word;
            continue;
          }
        }

        // 3. cur.word là phụ âm cuối (c, ch, m, n, ng, nh, p, t) hoặc bán nguyên âm cuối (i, y, u, o)
        if ((isFinalConsonant(cleanEnding) || isFinalGlide(cleanEnding)) && endsWithVowel(prevWord) && spaceBefore <= 2) {
          merged[merged.length - 1] = prevWord + cur.word;
          continue;
        }

        // 4. Chữ in hoa ngắn bị tách mảnh (N + Ộ + I -> NỘI, T + Ậ + P -> TẬP, K + I -> KI, H + Ọ + C -> HỌC)
        if (prevWord.length <= 2 && cur.word.length <= 2 &&
            /^[A-ZĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]+$/.test(prevWord) &&
            /^[A-ZĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]+$/.test(cur.word) &&
            spaceBefore <= 2) {
          if (!hasVowel(prevWord) || !hasVowel(cur.word) || endsWithVowel(prevWord)) {
            merged[merged.length - 1] = prevWord + cur.word;
            continue;
          }
        }

        merged.push(cur.word);
      }

      return merged.join(' ');
    });

    return repairedLines.join('\n');
  }

  /**
   * Phân tích chuỗi văn bản đầu vào (từ OCR, PDF, Word hoặc gõ tay)
   * thành mảng các câu hỏi có cấu trúc chuẩn.
   */
  parseExamText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return { success: false, questions: [], error: 'Văn bản trống' };
    }

    // 1. Tiền xử lý văn bản: chuẩn hóa xuống dòng, xóa ký tự rác, và hàn gắn chữ tiếng Việt bị tách rời
    let cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    cleanText = this.repairVietnameseSpacing(cleanText);

    // 2. Tìm và bóc tách bảng đáp án ở cuối văn bản (nếu có)
    const { textWithoutAnswers, answerKeyMap } = this._extractAnswerTable(cleanText);

    // 3. Phân chia văn bản thành các khối câu hỏi dựa trên từ khóa "Câu 1:", "Câu 2:"...
    const rawQuestionBlocks = this._splitIntoQuestionBlocks(textWithoutAnswers);

    if (rawQuestionBlocks.length === 0) {
      // Trường hợp không có chữ "Câu 1", thử bóc tách linh hoạt
      return this._fallbackHeuristicParse(cleanText, answerKeyMap);
    }

    // 4. Bóc tách chi tiết từng khối câu hỏi
    const parsedQuestions = [];
    rawQuestionBlocks.forEach((block, idx) => {
      const qNum = block.num || (idx + 1);
      const parsed = this._parseSingleQuestionBlock(block.content, qNum, answerKeyMap);
      if (parsed) {
        parsedQuestions.push(parsed);
      }
    });

    // 5. Tính toán các chỉ số thống kê & độ khó
    const stats = this._computeExamStats(parsedQuestions);

    return {
      success: parsedQuestions.length > 0,
      totalQuestions: parsedQuestions.length,
      questions: parsedQuestions,
      stats: stats,
      rawBlockCount: rawQuestionBlocks.length
    };
  }

  /**
   * Trích xuất bảng đáp án cuối bài dạng:
   * 1.A 2.B 3.C 4.D hoặc 1-A, 2-B, hoặc bảng:
   * Câu 1 2 3 4
   * Đ/A A B C D
   * Cũng như đáp án Đúng/Sai dạng: 1. a-Đ, b-S, c-Đ, d-S
   */
  _extractAnswerTable(text) {
    const answerKeyMap = {};
    let textWithoutAnswers = text;

    // Tìm vị trí bắt đầu của phần đáp án (thường có tiêu đề BẢNG ĐÁP ÁN, ĐÁP ÁN, HƯỚNG DẪN CHẤM)
    const answerHeaderRegex = /(?:BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+TRẮC\s+NGHIỆM|ĐÁP\s+ÁN\s+THAM\s+KHẢO|KEY|ANSWER\s+KEY)/i;
    const matchHeader = text.search(answerHeaderRegex);

    let answerSection = '';
    if (matchHeader !== -1) {
      answerSection = text.slice(matchHeader);
      textWithoutAnswers = text.slice(0, matchHeader);
    } else {
      // Tìm ở cuối văn bản nếu có chuỗi dạng "1.A  2.B  3.C  4.D" liên tiếp
      const patternMatch = text.match(/(?:\d+[\.\-\s:]+[A-D]\s*){3,}$/i);
      if (patternMatch) {
        answerSection = patternMatch[0];
        textWithoutAnswers = text.slice(0, patternMatch.index);
      }
    }

    if (answerSection) {
      // Trích xuất đáp án trắc nghiệm A-D
      const pairRegex = /(\d+)[\.\s:\-–—\)]+([A-D])/gi;
      let m;
      while ((m = pairRegex.exec(answerSection)) !== null) {
        const qNum = parseInt(m[1], 10);
        const ans = m[2].toUpperCase();
        answerKeyMap[qNum] = ans;
      }
    }

    return { textWithoutAnswers, answerKeyMap };
  }

  /**
   * Chia văn bản thành các khối câu hỏi
   * Thông minh: Nếu đề thi có "Câu 1, Câu 2..." thì BỎ QUA các tiêu đề bài học như "BÀI 1: LIÊN HỢP QUỐC"
   */
  _splitIntoQuestionBlocks(text) {
    const blocks = [];
    const hasCau = /(?:^|\n)\s*(?:Câu|CÂU|Question)\s*\d+/i.test(text);
    const pattern = hasCau
      ? /(?:^|\n)\s*(?:Câu|CÂU|Question)\s*(\d+)[\s.:\-–—)]\s*/gi
      : /(?:^|\n)\s*(?:Câu|CÂU|Bài|BÀI|Question|QUESTION)\s*(\d+)[\s.:\-–—)]\s*/gi;

    let match;
    const indices = [];

    while ((match = pattern.exec(text)) !== null) {
      indices.push({
        num: parseInt(match[1], 10),
        startIndex: match.index,
        contentStart: match.index + match[0].length
      });
    }

    for (let i = 0; i < indices.length; i++) {
      const current = indices[i];
      const next = indices[i + 1];
      const rawBlock = next
        ? text.slice(current.contentStart, next.startIndex)
        : text.slice(current.contentStart);

      blocks.push({
        num: current.num,
        content: rawBlock.trim()
      });
    }

    return blocks;
  }

  /**
   * Phân tích 1 khối câu hỏi đơn lẻ: Tự động phân loại:
   * 1. Câu hỏi Đúng/Sai (Dạng Phần II cấu trúc Bộ GD&ĐT: a, b, c, d)
   * 2. Câu hỏi Trắc nghiệm 4 lựa chọn (Phần I: A, B, C, D)
   */
  _parseSingleQuestionBlock(blockText, qNum, globalAnswerKeys = {}) {
    let text = blockText;
    let explanation = '';
    let foundCorrect = null;

    // 1. Tách lời giải / hướng dẫn giải nếu có
    const expRegex = /(?:Lời\s+giải|Hướng\s+dẫn\s+giải|Giải\s+thích|Giải\s+chi\s+tiết|Explanation)[\s.:\-–—\n]+([\s\S]*)$/i;
    const expMatch = text.match(expRegex);
    if (expMatch) {
      explanation = expMatch[1].trim();
      text = text.slice(0, expMatch.index).trim();
    }

    // 2. Nhận diện dạng câu hỏi ĐÚNG / SAI (Phần II cấu trúc Bộ GD&ĐT)
    // Dấu hiệu: có các mệnh đề con a), b), c), d)
    let subItemRegex = /(?:^|\n)\s*([a-d])\s*[\.\)]\s*/gi;
    let subMatches = [];
    let sm;
    while ((sm = subItemRegex.exec(text)) !== null) {
      subMatches.push({
        key: sm[1].toLowerCase(),
        index: sm.index,
        length: sm[0].length
      });
    }

    // Fallback: nếu các ý a, b, c, d nằm trên cùng 1 dòng
    if (subMatches.length < 2) {
      subItemRegex = /(?:^|\s)\s*([a-d])\s*[\.\)]\s*/gi;
      subMatches = [];
      while ((sm = subItemRegex.exec(text)) !== null) {
        subMatches.push({
          key: sm[1].toLowerCase(),
          index: sm.index,
          length: sm[0].length
        });
      }
      if (subMatches.length > 4) {
        subMatches = subMatches.slice(-4);
      }
    }

    const hasUpperCaseABCD = /(?:^|\n|\s)[A-D]\s*[\.\)]/g.test(text);
    const isTrueFalse = subMatches.length >= 2 && (!hasUpperCaseABCD || /(?:đúng\s+(?:hoặc|hay|\/)\s*sai|chọn\s+đúng\s+sai)/i.test(text));

    if (isTrueFalse) {
      // Tách phần lời dẫn câu hỏi (trước ý con đầu tiên)
      const firstSub = subMatches[0];
      let questionLead = text.slice(0, firstSub.index).trim();
      questionLead = this._autoFormatMath(questionLead);

      const subQuestions = [];
      for (let i = 0; i < subMatches.length; i++) {
        const curr = subMatches[i];
        const next = subMatches[i + 1];
        let subContent = next
          ? text.slice(curr.index + curr.length, next.index)
          : text.slice(curr.index + curr.length);

        subContent = subContent.trim();

        // Nhận diện Đúng / Sai trong ngoặc hoặc ở cuối ý: "(Đúng)", "(Sai)", "[Đ]", "[S]"
        let subCorrect = null;
        const tfMatch = subContent.match(/[\(\[\{]?\s*(Đúng|Sai|Đ|S|True|False)\s*[\)\]\}]?\s*$/i);
        if (tfMatch) {
          const val = tfMatch[1].toLowerCase();
          subCorrect = (val === 'đúng' || val === 'đ' || val === 'true') ? 'true' : 'false';
          subContent = subContent.slice(0, tfMatch.index).trim();
        }

        subContent = this._autoFormatMath(subContent);

        subQuestions.push({
          key: curr.key,
          text: subContent,
          correctAnswer: subCorrect || 'true',
          needsReview: subCorrect === null
        });
      }

      const difficulty = this._estimateDifficulty(questionLead, explanation);
      const topic = this._guessTopic(questionLead);
      explanation = this._autoFormatMath(explanation);

      return {
        id: 'q-' + Date.now() + '-' + qNum,
        num: qNum,
        type: 'true_false',
        question: questionLead,
        subQuestions: subQuestions,
        explanation: explanation || 'Xem lại kiến thức lý thuyết trong đề cương để giải thích tính Đúng/Sai của các mệnh đề.',
        difficulty: difficulty,
        topic: topic,
        needsReview: subQuestions.some(s => s.needsReview)
      };
    }

    // 3. Xử lý câu hỏi trắc nghiệm nhiều phương án lựa chọn A, B, C, D
    // Tìm đáp án đúng được ghi trực tiếp trong câu: "Đáp án: A" hoặc "Chọn B" hoặc "Key: C"
    const ansInBlockRegex = /(?:Đáp\s+án|Chọn|Key|Answer)[\s.:\-–—]+([A-D])/i;
    const ansMatch = text.match(ansInBlockRegex);
    if (ansMatch) {
      foundCorrect = ansMatch[1].toUpperCase();
      text = text.replace(ansInBlockRegex, '').trim();
    }

    // Nhận diện vị trí bắt đầu của A., B., C., D. (cho phép khoảng cách lỏng lẻo như "A . ")
    const optRegex = /(?:^|\s|\n)([*]?)([A-D])\s*[\.\)]\s*/g;
    const optMatches = [];
    let m;
    while ((m = optRegex.exec(text)) !== null) {
      optMatches.push({
        hasAsterisk: m[1] === '*',
        letter: m[2].toUpperCase(),
        index: m.index,
        length: m[0].length
      });
    }

    // Lọc các match hợp lệ
    const validOptions = [];
    let questionText = text;

    if (optMatches.length >= 2) {
      const firstOpt = optMatches[0];
      questionText = text.slice(0, firstOpt.index).trim();

      for (let i = 0; i < optMatches.length; i++) {
        const curr = optMatches[i];
        const next = optMatches[i + 1];
        let optContent = next
          ? text.slice(curr.index + curr.length, next.index)
          : text.slice(curr.index + curr.length);

        optContent = optContent.trim();

        if (curr.hasAsterisk && !foundCorrect) {
          foundCorrect = curr.letter;
        }

        validOptions.push({
          key: curr.letter,
          text: optContent
        });
      }
    } else {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        questionText = lines[0];
        const letters = ['A', 'B', 'C', 'D'];
        for (let i = 1; i < lines.length && i <= 4; i++) {
          validOptions.push({
            key: letters[i - 1],
            text: lines[i].replace(/^[A-D]\s*[\.\)]\s*/i, '')
          });
        }
      } else {
        questionText = text;
      }
    }

    // Nếu có đáp án trong bảng globalAnswerKeys thì ưu tiên sử dụng
    if (!foundCorrect && globalAnswerKeys[qNum]) {
      foundCorrect = globalAnswerKeys[qNum];
    }

    const needsReview = !foundCorrect;
    const finalCorrect = foundCorrect || 'A';

    // Tính toán độ khó & chủ đề phỏng đoán
    const difficulty = this._estimateDifficulty(questionText, explanation);
    const topic = this._guessTopic(questionText);

    // Chuẩn hóa công thức Toán nếu có dạng LaTeX
    questionText = this._autoFormatMath(questionText);
    const formattedOptions = validOptions.map(opt => ({
      key: opt.key,
      text: this._autoFormatMath(opt.text)
    }));
    explanation = this._autoFormatMath(explanation);

    return {
      id: 'q-' + Date.now() + '-' + qNum,
      num: qNum,
      type: 'single_choice',
      question: questionText,
      options: formattedOptions.length > 0 ? formattedOptions : [
        { key: 'A', text: 'Đáp án A' },
        { key: 'B', text: 'Đáp án B' },
        { key: 'C', text: 'Đáp án C' },
        { key: 'D', text: 'Đáp án D' }
      ],
      correctAnswer: finalCorrect,
      explanation: explanation || 'Xem lại kiến thức lý thuyết trong đề cương để giải bài này.',
      difficulty: difficulty,
      topic: topic,
      needsReview: needsReview
    };
  }

  /**
   * Fallback parse khi văn bản không có tiền tố "Câu 1", "Câu 2"
   */
  _fallbackHeuristicParse(text, answerKeyMap) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const questions = [];

    paragraphs.forEach((p, idx) => {
      const q = this._parseSingleQuestionBlock(p, idx + 1, answerKeyMap);
      if (q && q.question.length > 5) {
        questions.push(q);
      }
    });

    return {
      success: questions.length > 0,
      totalQuestions: questions.length,
      questions: questions,
      stats: this._computeExamStats(questions),
      rawBlockCount: paragraphs.length
    };
  }

  /**
   * Tính toán độ khó câu hỏi dựa trên phân tích từ vựng & cấu trúc
   */
  _estimateDifficulty(questionText, explanation) {
    const text = (questionText + ' ' + (explanation || '')).toLowerCase();

    // Nhận diện mức độ Vận dụng cao (Hardest)
    if (
      text.includes('vận dụng cao') ||
      text.includes('giá trị lớn nhất') ||
      text.includes('có bao nhiêu giá trị nguyên') ||
      text.includes('tham số m để') ||
      text.includes('tối đa') ||
      text.includes('cực trị') && text.includes('tham số') ||
      text.length > 300
    ) {
      return 'Vận dụng cao';
    }

    // Nhận diện mức độ Vận dụng
    if (
      text.includes('tính thể tích') ||
      text.includes('khoảng cách từ') ||
      text.includes('tính diện tích') ||
      text.includes('chu kỳ') ||
      text.includes('phản ứng hoàn toàn') ||
      text.includes('hiệu suất') ||
      text.includes('suy ra')
    ) {
      return 'Vận dụng';
    }

    // Nhận diện mức độ Thông hiểu
    if (
      text.includes('hàm số đồng biến') ||
      text.includes('tiệm cận') ||
      text.includes('phương trình') ||
      text.includes('đồng phân') ||
      text.includes('tính chất') ||
      text.includes('tại sao') ||
      text.includes('chất nào sau đây') ||
      text.includes('tư liệu') ||
      text.includes('đúng hoặc sai')
    ) {
      return 'Thông hiểu';
    }

    // Mặc định: Nhận biết
    return 'Nhận biết';
  }

  /**
   * Phỏng đoán chủ đề bài học dựa trên từ khóa
   */
  _guessTopic(text) {
    const t = text.toLowerCase();
    if (t.includes('liên hợp quốc') || t.includes('trật tự thế giới') || t.includes('chiến tranh thế giới') || t.includes('asean') || t.includes('lịch sử')) return 'Lịch sử';
    if (t.includes('hàm số') || t.includes('đạo hàm') || t.includes('cực trị')) return 'Giải tích';
    if (t.includes('thể tích') || t.includes('khối chóp') || t.includes('lăng trụ')) return 'Hình học không gian';
    if (t.includes('dao động') || t.includes('con lắc') || t.includes('sóng')) return 'Dao động & Sóng';
    if (t.includes('este') || t.includes('lipit') || t.includes('xà phòng')) return 'Hóa hữu cơ';
    if (t.includes('adn') || t.includes('arn') || t.includes('gen') || t.includes('protein')) return 'Di truyền học';
    if (t.includes('tác giả') || t.includes('nhà thơ') || t.includes('văn bản')) return 'Văn học';
    if (t.includes('if') || t.includes('tense') || t.includes('verb') || t.includes('sentence')) return 'Ngữ pháp Tiếng Anh';
    return 'Tổng hợp';
  }

  /**
   * Tự động nhận diện công thức toán học và bọc $...$ cho KaTeX
   */
  _autoFormatMath(str) {
    if (!str) return '';
    let res = str;

    if (res.includes('$')) return res;

    res = res.replace(/\\(frac|sqrt|lim|int|sum)\b[^{}]*\{[^{}]*\}/g, (match) => `$${match}$`);

    return res;
  }

  /**
   * Tính toán các chỉ số thống kê của đề thi
   */
  _computeExamStats(questions) {
    const stats = {
      total: questions.length,
      singleChoiceCount: 0,
      trueFalseCount: 0,
      difficultyBreakdown: {
        'Nhận biết': 0,
        'Thông hiểu': 0,
        'Vận dụng': 0,
        'Vận dụng cao': 0
      },
      missingAnswerKeys: 0,
      estimatedTimeMinutes: 0
    };

    questions.forEach(q => {
      if (q.type === 'true_false') {
        stats.trueFalseCount++;
      } else {
        stats.singleChoiceCount++;
      }

      if (stats.difficultyBreakdown[q.difficulty] !== undefined) {
        stats.difficultyBreakdown[q.difficulty]++;
      }
      if (q.needsReview) {
        stats.missingAnswerKeys++;
      }
    });

    const est = (
      stats.difficultyBreakdown['Nhận biết'] * 1 +
      stats.difficultyBreakdown['Thông hiểu'] * 1.5 +
      stats.difficultyBreakdown['Vận dụng'] * 2 +
      stats.difficultyBreakdown['Vận dụng cao'] * 3.5
    );
    stats.estimatedTimeMinutes = Math.max(5, Math.ceil(est));

    return stats;
  }
}

window.questionParser = new QuestionParser();

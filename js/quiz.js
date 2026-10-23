// quiz.js - Bộ máy làm bài kiểm tra tương tác chuẩn Web & Mobile
class QuizEngine {
  constructor() {
    this.currentExam = null;
    this.currentSubject = null;
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {};      // { questionIndex: 'A' }
    this.bookmarked = new Set(); // Set of question indices
    this.mode = 'exam';         // 'exam' (bấm giờ) hoặc 'practice' (luyện tập)
    this.timerInterval = null;
    this.timeRemainingSeconds = 0;
    this.totalTimeSeconds = 0;
    this.startTime = null;
    this.isSubmitted = false;
    this.result = null;
  }

  /**
   * Bắt đầu bài kiểm tra
   */
  startQuiz({ exam, subject, mode = 'exam', shuffleQuestions = false, shuffleOptions = false, customDuration = null }) {
    this.currentExam = exam;
    this.currentSubject = subject;
    this.mode = mode;
    this.isSubmitted = false;
    this.userAnswers = {};
    this.bookmarked = new Set();
    this.currentIndex = 0;
    this.result = null;

    // Chuẩn bị danh sách câu hỏi
    let qList = JSON.parse(JSON.stringify(exam.questions || []));

    if (shuffleQuestions) {
      qList = this._shuffleArray(qList);
    }

    if (shuffleOptions) {
      qList.forEach(q => {
        if (q.type === 'true_false' || !q.options) return; // Giữ nguyên thứ tự a, b, c, d của câu hỏi Đúng/Sai
        const correctOpt = q.options.find(o => o.key === q.correctAnswer);
        const correctText = correctOpt ? correctOpt.text : '';
        const shuffled = this._shuffleArray(q.options.map(o => o.text));
        const newOpts = shuffled.map((txt, idx) => {
          const key = String.fromCharCode(65 + idx);
          if (txt === correctText) {
            q.correctAnswer = key;
          }
          return { key: key, text: txt };
        });
        q.options = newOpts;
      });
    }

    this.questions = qList;

    // Cài đặt thời gian
    const durationMins = customDuration || exam.durationMinutes || Math.max(5, Math.ceil(this.questions.length * 1.5));
    this.totalTimeSeconds = durationMins * 60;
    this.timeRemainingSeconds = this.totalTimeSeconds;
    this.startTime = new Date();

    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.mode === 'exam') {
      this.timerInterval = setInterval(() => {
        this.timeRemainingSeconds--;
        if (this.timeRemainingSeconds <= 0) {
          clearInterval(this.timerInterval);
          this.submitQuiz(true); // Tự động nộp bài khi hết giờ
        }
        this._triggerTimerUpdate();
      }, 1000);
    }

    this.renderCurrentQuestion();
    this._renderPalette();
    this._triggerTimerUpdate();
  }

  _shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Chọn đáp án cho câu hỏi trắc nghiệm A, B, C, D
   */
  selectAnswer(key) {
    if (this.isSubmitted) return;

    this.userAnswers[this.currentIndex] = key;
    this.renderCurrentQuestion();
    this._renderPalette();
  }

  /**
   * Chọn đáp án Đúng / Sai cho từng ý a), b), c), d)
   */
  selectTrueFalseSubAnswer(subKey, val) {
    if (this.isSubmitted) return;

    if (!this.userAnswers[this.currentIndex] || typeof this.userAnswers[this.currentIndex] !== 'object') {
      this.userAnswers[this.currentIndex] = {};
    }

    this.userAnswers[this.currentIndex][subKey] = val;
    this.renderCurrentQuestion();
    this._renderPalette();
  }

  /**
   * Bật/tắt đánh dấu câu hỏi xem lại
   */
  toggleBookmark(index = this.currentIndex) {
    if (this.bookmarked.has(index)) {
      this.bookmarked.delete(index);
    } else {
      this.bookmarked.add(index);
    }
    this.renderCurrentQuestion();
    this._renderPalette();
  }

  /**
   * Chuyển đến câu hỏi theo vị trí
   */
  goToQuestion(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    this.renderCurrentQuestion();
    this._renderPalette();
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.goToQuestion(this.currentIndex + 1);
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.goToQuestion(this.currentIndex - 1);
    }
  }

  /**
   * Nộp bài kiểm tra & Tính toán kết quả
   */
  submitQuiz(autoSubmit = false) {
    if (this.isSubmitted) return;

    if (!autoSubmit) {
      const unansweredCount = this.questions.length - Object.keys(this.userAnswers).length;
      if (unansweredCount > 0) {
        const confirmMsg = `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`;
        if (!confirm(confirmMsg)) {
          return;
        }
      }
    }

    this.isSubmitted = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const timeSpent = this.totalTimeSeconds - Math.max(0, this.timeRemainingSeconds);

    // Tính toán số câu đúng và thang điểm 10 theo chuẩn Bộ GD&ĐT
    let totalScoreWeight = 0;
    let earnedPoints = 0;
    let correctCount = 0;
    const details = [];

    this.questions.forEach((q, idx) => {
      const selected = this.userAnswers[idx] || null;
      let isCorrect = false;
      let questionEarned = 0;

      if (q.type === 'true_false') {
        totalScoreWeight += 1.0;
        let subCorrectCount = 0;
        const subDetails = (q.subQuestions || []).map(sub => {
          const userChoice = (selected && typeof selected === 'object') ? selected[sub.key] : null;
          const isSubCorrect = userChoice === sub.correctAnswer;
          if (isSubCorrect) subCorrectCount++;
          return {
            key: sub.key,
            text: sub.text,
            userChoice: userChoice,
            correctAnswer: sub.correctAnswer,
            isCorrect: isSubCorrect
          };
        });

        // Quy chế tính điểm câu hỏi Đúng/Sai Bộ GD&ĐT:
        // Đúng 1 ý: 0.1 đ; Đúng 2 ý: 0.25 đ; Đúng 3 ý: 0.5 đ; Đúng 4 ý: 1.0 đ
        if (subCorrectCount === 4) questionEarned = 1.0;
        else if (subCorrectCount === 3) questionEarned = 0.5;
        else if (subCorrectCount === 2) questionEarned = 0.25;
        else if (subCorrectCount === 1) questionEarned = 0.1;
        else questionEarned = 0;

        earnedPoints += questionEarned;
        isCorrect = subCorrectCount === 4;
        if (isCorrect) correctCount++;

        details.push({
          questionIndex: idx,
          questionId: q.id,
          type: 'true_false',
          questionText: q.question,
          subQuestions: q.subQuestions,
          subDetails: subDetails,
          subCorrectCount: subCorrectCount,
          earnedScore: questionEarned,
          selected: selected,
          isCorrect: isCorrect,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic
        });
      } else {
        // Trắc nghiệm 4 lựa chọn A, B, C, D
        totalScoreWeight += 1.0;
        isCorrect = selected === q.correctAnswer;
        if (isCorrect) {
          correctCount++;
          earnedPoints += 1.0;
        }

        details.push({
          questionIndex: idx,
          questionId: q.id,
          type: 'single_choice',
          questionText: q.question,
          options: q.options || [],
          selected: selected,
          correct: q.correctAnswer,
          isCorrect: isCorrect,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic
        });
      }
    });

    // Điểm số thang điểm 10
    const rawScore = totalScoreWeight > 0 ? (earnedPoints / totalScoreWeight) * 10 : 0;
    const score = Math.round(rawScore * 10) / 10;

    this.result = {
      examId: this.currentExam.id,
      subjectId: this.currentSubject.id,
      subjectName: this.currentSubject.name,
      examTitle: this.currentExam.title,
      score: score,
      correctCount: correctCount,
      totalQuestions: this.questions.length,
      timeSpentSeconds: timeSpent,
      completedAt: new Date().toLocaleString('vi-VN'),
      details: details
    };

    // Lưu vào cơ sở dữ liệu
    if (window.db) {
      window.db.saveHistory(this.result);
    }

    this.renderResultScreen();
  }

  /**
   * Render giao diện câu hỏi hiện tại
   */
  renderCurrentQuestion() {
    const container = document.getElementById('quiz-question-container');
    if (!container || !this.questions[this.currentIndex]) return;

    const q = this.questions[this.currentIndex];
    const total = this.questions.length;
    const selectedAnswer = this.userAnswers[this.currentIndex];
    const isBookmarked = this.bookmarked.has(this.currentIndex);
    const isPractice = this.mode === 'practice';
    const isAnswered = selectedAnswer !== undefined;

    // Cập nhật thanh tiến trình
    const progressPct = ((this.currentIndex + 1) / total) * 100;
    const progressBar = document.getElementById('quiz-progress-fill');
    if (progressBar) progressBar.style.width = `${progressPct}%`;

    const countText = document.getElementById('quiz-question-counter');
    if (countText) countText.textContent = `Câu ${this.currentIndex + 1}/${total}`;

    // Nút prev / next
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');
    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) {
      if (this.currentIndex === total - 1) {
        nextBtn.innerHTML = `<span>Xem lại</span> <i data-lucid="eye" class="w-4 h-4 ml-1"></i>`;
      } else {
        nextBtn.innerHTML = `<span>Câu tiếp</span> <i data-lucid="chevron-right" class="w-4 h-4 ml-1"></i>`;
      }
    }

    // Nút đánh dấu Bookmark
    const bookmarkBtn = document.getElementById('quiz-bookmark-btn');
    if (bookmarkBtn) {
      if (isBookmarked) {
        bookmarkBtn.className = "px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center space-x-1 border border-amber-300 shadow-sm";
        bookmarkBtn.innerHTML = `<i data-lucide="bookmark-check" class="w-4 h-4 fill-amber-500 text-amber-600"></i> <span>Đã đánh dấu</span>`;
      } else {
        bookmarkBtn.className = "px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center space-x-1 border border-slate-200 dark:border-slate-700 transition";
        bookmarkBtn.innerHTML = `<i data-lucide="bookmark" class="w-4 h-4 text-slate-500"></i> <span>Đánh dấu câu này</span>`;
      }
    }

    // HTML cho câu hỏi và các phương án
    let optionsHtml = '';
    let explanationHtml = '';

    if (q.type === 'true_false') {
      const subItems = q.subQuestions || [];
      const userSubAns = (selectedAnswer && typeof selectedAnswer === 'object') ? selectedAnswer : {};
      const allSubAnswered = subItems.length > 0 && subItems.every(s => userSubAns[s.key] !== undefined);

      let subListHtml = subItems.map(sub => {
        const userChoice = userSubAns[sub.key]; // 'true' | 'false' | undefined
        const isChosen = userChoice !== undefined;
        const isTrueSelected = userChoice === 'true';
        const isFalseSelected = userChoice === 'false';

        let trueBtnClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400';
        let falseBtnClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400';

        if (isPractice && isChosen) {
          // Practice Mode: hiển thị đúng / sai ngay sau khi chọn
          if (sub.correctAnswer === 'true') {
            trueBtnClass = 'border-emerald-500 bg-emerald-600 text-white font-bold ring-2 ring-emerald-400';
            falseBtnClass = isFalseSelected ? 'border-rose-500 bg-rose-600 text-white font-bold' : 'border-slate-200 opacity-60';
          } else {
            falseBtnClass = 'border-emerald-500 bg-emerald-600 text-white font-bold ring-2 ring-emerald-400';
            trueBtnClass = isTrueSelected ? 'border-rose-500 bg-rose-600 text-white font-bold' : 'border-slate-200 opacity-60';
          }
        } else {
          // Exam Mode: hiển thị trạng thái đã chọn
          if (isTrueSelected) {
            trueBtnClass = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500 font-bold';
          } else if (isFalseSelected) {
            falseBtnClass = 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500 font-bold';
          }
        }

        return `
          <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
            <div class="flex items-start space-x-2.5 flex-1">
              <span class="flex-shrink-0 w-6 h-6 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs flex items-center justify-center mt-0.5">
                ${sub.key}
              </span>
              <div class="text-sm md:text-base text-slate-900 dark:text-slate-100 leading-relaxed katex-render">
                ${sub.text}
              </div>
            </div>

            <div class="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
              <button onclick="window.quizEngine.selectTrueFalseSubAnswer('${sub.key}', 'true')"
                      class="px-3.5 py-1.5 rounded-xl border text-xs md:text-sm font-semibold flex items-center space-x-1.5 cursor-pointer transition active:scale-95 ${trueBtnClass}">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Đúng</span>
              </button>
              <button onclick="window.quizEngine.selectTrueFalseSubAnswer('${sub.key}', 'false')"
                      class="px-3.5 py-1.5 rounded-xl border text-xs md:text-sm font-semibold flex items-center space-x-1.5 cursor-pointer transition active:scale-95 ${falseBtnClass}">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                <span>Sai</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      optionsHtml = `
        <div class="space-y-2.5 pt-2">
          ${subListHtml}
        </div>
      `;

      if (isPractice && allSubAnswered) {
        explanationHtml = `
          <div class="mt-6 p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-100">
            <div class="flex items-center space-x-2 font-bold mb-2 text-indigo-600 dark:text-indigo-400">
              <i data-lucide="help-circle" class="w-5 h-5"></i>
              <span>Hướng dẫn & Giải thích chi tiết:</span>
            </div>
            <div class="text-sm leading-relaxed katex-render">
              ${q.explanation || 'Không có lời giải chi tiết.'}
            </div>
          </div>
        `;
      }
    } else {
      // Dạng trắc nghiệm 4 lựa chọn A, B, C, D
      let choiceButtonsHtml = '';
      (q.options || []).forEach(opt => {
        const isSelected = selectedAnswer === opt.key;
        let btnClasses = 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200';
        let badgeClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';

        if (isPractice && isAnswered) {
          if (opt.key === q.correctAnswer) {
            btnClasses = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400';
            badgeClasses = 'bg-emerald-600 text-white';
          } else if (isSelected && opt.key !== q.correctAnswer) {
            btnClasses = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400';
            badgeClasses = 'bg-rose-600 text-white';
          }
        } else if (isSelected) {
          btnClasses = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500 font-semibold shadow-sm';
          badgeClasses = 'bg-indigo-600 text-white';
        }

        choiceButtonsHtml += `
          <button onclick="window.quizEngine.selectAnswer('${opt.key}')"
                  class="w-full text-left p-4 rounded-xl border-2 transition-all flex items-start space-x-3 active:scale-[0.99] touch-manipulation cursor-pointer ${btnClasses}">
            <span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${badgeClasses}">
              ${opt.key}
            </span>
            <div class="flex-1 pt-1 text-sm md:text-base leading-relaxed katex-render">
              ${opt.text}
            </div>
          </button>
        `;
      });

      optionsHtml = `
        <div class="grid grid-cols-1 gap-3 pt-2">
          ${choiceButtonsHtml}
        </div>
      `;

      if (isPractice && isAnswered) {
        const isCorrect = selectedAnswer === q.correctAnswer;
        explanationHtml = `
          <div class="mt-6 p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200' : 'bg-amber-50/70 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'}">
            <div class="flex items-center space-x-2 font-bold mb-2">
              <i data-lucide="${isCorrect ? 'check-circle' : 'alert-circle'}" class="w-5 h-5 ${isCorrect ? 'text-emerald-600' : 'text-amber-600'}"></i>
              <span>${isCorrect ? 'Chính xác! Đáp án ' + q.correctAnswer : 'Chưa đúng! Đáp án đúng là ' + q.correctAnswer}</span>
            </div>
            <div class="text-sm leading-relaxed katex-render">
              ${q.explanation || 'Không có lời giải chi tiết.'}
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = `
      <div class="space-y-4 animate-fade-in">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Câu ${this.currentIndex + 1}
          </span>
          <span class="px-2.5 py-1 text-xs font-semibold rounded-md ${q.type === 'true_false' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}">
            ${q.type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm'}
          </span>
          <span class="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            ${q.difficulty || 'Nhận biết'}
          </span>
          ${q.topic ? `
          <span class="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            ${q.topic}
          </span>` : ''}
        </div>

        <div class="text-base md:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed katex-render">
          ${q.question}
        </div>

        ${optionsHtml}

        ${explanationHtml}
      </div>
    `;

    // Render Lucide icons và KaTeX công thức toán
    this._refreshIconsAndMath();
  }

  /**
   * Render bảng ma trận câu hỏi (Question Palette)
   */
  _renderPalette() {
    const desktopPalette = document.getElementById('quiz-palette-desktop');
    const mobilePalette = document.getElementById('quiz-palette-mobile');

    const generateButtons = () => {
      return this.questions.map((q, idx) => {
        const isCurrent = idx === this.currentIndex;
        const isAnswered = q.type === 'true_false'
          ? (this.userAnswers[idx] && typeof this.userAnswers[idx] === 'object' && Object.keys(this.userAnswers[idx]).length > 0)
          : (this.userAnswers[idx] !== undefined);
        const isBookmarked = this.bookmarked.has(idx);

        let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200';
        let borderClass = 'border-transparent';

        if (isCurrent) {
          borderClass = 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900';
        }

        if (isBookmarked) {
          bgClass = 'bg-amber-400 text-amber-950 font-bold';
        } else if (isAnswered) {
          bgClass = 'bg-indigo-600 text-white font-bold';
        }

        return `
          <button onclick="window.quizEngine.goToQuestion(${idx})"
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all relative ${bgClass} ${borderClass}">
            ${idx + 1}
            ${isBookmarked ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full border border-white"></span>` : ''}
          </button>
        `;
      }).join('');
    };

    const countAnswered = Object.keys(this.userAnswers).length;
    const answeredText = `${countAnswered}/${this.questions.length} câu`;

    const summaryEl = document.getElementById('quiz-palette-summary');
    if (summaryEl) summaryEl.textContent = answeredText;

    if (desktopPalette) desktopPalette.innerHTML = generateButtons();
    if (mobilePalette) mobilePalette.innerHTML = generateButtons();
  }

  /**
   * Cập nhật đồng hồ đếm ngược
   */
  _triggerTimerUpdate() {
    const timerEls = document.querySelectorAll('.quiz-timer-display');
    const minutes = Math.floor(this.timeRemainingSeconds / 60);
    const seconds = this.timeRemainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    timerEls.forEach(el => {
      el.textContent = formatted;
      if (this.timeRemainingSeconds < 180 && this.mode === 'exam') {
        el.classList.add('text-rose-600', 'animate-pulse');
      } else {
        el.classList.remove('text-rose-600', 'animate-pulse');
      }
    });
  }

  /**
   * Hiển thị màn hình kết quả sau khi nộp bài
   */
  renderResultScreen() {
    const quizView = document.getElementById('view-quiz-running');
    const resultView = document.getElementById('view-quiz-result');

    if (quizView) quizView.classList.add('hidden');
    if (resultView) resultView.classList.remove('hidden');

    const res = this.result;
    if (!res) return;

    // Điểm số & Xếp loại
    const scoreVal = document.getElementById('result-score-val');
    const gradeBadge = document.getElementById('result-grade-badge');
    const commentText = document.getElementById('result-comment-text');

    if (scoreVal) scoreVal.textContent = res.score.toFixed(1);

    let grade = 'Cần ôn thêm';
    let badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    let comment = 'Bạn nên đọc lại đề cương lý thuyết và làm lại đề này để nắm chắc các câu hỏi đã sai.';

    if (res.score >= 9.0) {
      grade = 'Xuất sắc! 🎉';
      badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      comment = 'Kiến thức rất vững! Bạn đã sẵn sàng cho kỳ thi chính thức.';
      this._launchConfetti();
    } else if (res.score >= 8.0) {
      grade = 'Giỏi! 👏';
      badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      comment = 'Kết quả rất tốt! Hãy xem lại các câu vận dụng cao để đạt điểm tuyệt đối nhé.';
      this._launchConfetti();
    } else if (res.score >= 6.5) {
      grade = 'Khá';
      badgeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
      comment = 'Nắm tương đối chắc kiến thức cơ bản. Cần luyện tập thêm các bài toán mức độ vận dụng.';
    } else if (res.score >= 5.0) {
      grade = 'Trung bình';
      badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      comment = 'Đã vượt qua mức trung bình, nhưng cần rà soát lại các công thức cốt lõi trong đề cương.';
    }

    if (gradeBadge) {
      gradeBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`;
      gradeBadge.textContent = grade;
    }

    if (commentText) commentText.textContent = comment;

    // Thông số chi tiết
    const correctEl = document.getElementById('result-correct-count');
    const wrongEl = document.getElementById('result-wrong-count');
    const skippedEl = document.getElementById('result-skipped-count');
    const timeEl = document.getElementById('result-time-spent');

    const skippedCount = res.totalQuestions - Object.keys(this.userAnswers).length;
    const wrongCount = res.totalQuestions - res.correctCount - skippedCount;

    if (correctEl) correctEl.textContent = `${res.correctCount}/${res.totalQuestions}`;
    if (wrongEl) wrongEl.textContent = `${wrongCount}`;
    if (skippedEl) skippedEl.textContent = `${skippedCount}`;

    const spentMins = Math.floor(res.timeSpentSeconds / 60);
    const spentSecs = res.timeSpentSeconds % 60;
    if (timeEl) timeEl.textContent = `${spentMins}m ${spentSecs}s`;

    // Render danh sách chi tiết từng câu để xem lại
    this.renderReviewQuestions('all');
  }

  /**
   * Render danh sách xem lại câu hỏi (Lọc: all, wrong, correct)
   */
  renderReviewQuestions(filter = 'all') {
    const container = document.getElementById('result-review-list');
    if (!container || !this.result) return;

    let items = this.result.details;
    if (filter === 'wrong') {
      items = items.filter(d => !d.isCorrect);
    } else if (filter === 'correct') {
      items = items.filter(d => d.isCorrect);
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          Không có câu hỏi nào trong danh mục này.
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach((item, idx) => {
      const isCorrect = item.isCorrect;

      if (item.type === 'true_false') {
        const statusBadge = isCorrect
          ? `<span class="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center space-x-1"><i data-lucide="check" class="w-3.5 h-3.5 mr-1"></i> Đúng hoàn toàn (4/4 ý) - 1.0 đ</span>`
          : `<span class="px-2.5 py-1 text-xs font-bold rounded-md ${item.subCorrectCount > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'} flex items-center space-x-1">Đúng ${item.subCorrectCount}/4 ý - Đạt ${item.earnedScore.toFixed(2)} đ</span>`;

        let subListHtml = (item.subDetails || []).map(sub => {
          const isSubCorrect = sub.isCorrect;
          const userChoiceStr = sub.userChoice === 'true' ? 'Đúng' : sub.userChoice === 'false' ? 'Sai' : 'Chưa chọn';
          const correctChoiceStr = sub.correctAnswer === 'true' ? 'Đúng' : 'Sai';

          const cardBorder = isSubCorrect
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
            : 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20';

          return `
            <div class="p-3.5 rounded-xl border ${cardBorder} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div class="flex items-start space-x-2.5 flex-1">
                <span class="flex-shrink-0 w-6 h-6 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs flex items-center justify-center mt-0.5">
                  ${sub.key}
                </span>
                <div class="text-sm text-slate-900 dark:text-slate-100 leading-relaxed katex-render">
                  ${sub.text}
                </div>
              </div>

              <div class="flex items-center space-x-2 text-xs flex-shrink-0 self-end sm:self-center">
                <span class="px-2.5 py-1 rounded-lg ${isSubCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'}">
                  Bạn chọn: <b>${userChoiceStr}</b>
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold">
                  Đáp án: <b>${correctChoiceStr}</b>
                </span>
              </div>
            </div>
          `;
        }).join('');

        html += `
          <div class="p-5 rounded-2xl border ${isCorrect ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900 dark:text-slate-100">Câu ${item.questionIndex + 1}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-semibold">Đúng / Sai</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${item.difficulty}</span>
                ${item.topic ? `<span class="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">${item.topic}</span>` : ''}
              </div>
              ${statusBadge}
            </div>

            <div class="text-sm md:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium katex-render">
              ${item.questionText}
            </div>

            <div class="space-y-2 pt-1">
              ${subListHtml}
            </div>

            <div class="mt-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm space-y-1">
              <div class="font-semibold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
                <i data-lucide="help-circle" class="w-4 h-4 text-indigo-500"></i>
                <span>Hướng dẫn & Giải thích chi tiết:</span>
              </div>
              <div class="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed katex-render pt-1">
                ${item.explanation || 'Không có hướng dẫn giải.'}
              </div>
            </div>
          </div>
        `;
      } else {
        // Dạng trắc nghiệm 4 phương án A, B, C, D
        const statusBadge = isCorrect
          ? `<span class="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center space-x-1"><i data-lucide="check" class="w-3.5 h-3.5 mr-1"></i> Đúng</span>`
          : `<span class="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 flex items-center space-x-1"><i data-lucide="x" class="w-3.5 h-3.5 mr-1"></i> Sai (${item.selected ? 'Bạn chọn ' + item.selected : 'Chưa chọn'})</span>`;

        let optionsList = '';
        (item.options || []).forEach(opt => {
          let optStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';
          if (opt.key === item.correct) {
            optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-400';
          } else if (opt.key === item.selected && !isCorrect) {
            optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400';
          }

          optionsList += `
            <div class="p-3 rounded-lg border text-sm flex items-start space-x-2 ${optStyle}">
              <span class="font-bold w-6 flex-shrink-0">${opt.key}.</span>
              <div class="flex-1 katex-render">${opt.text}</div>
            </div>
          `;
        });

        html += `
          <div class="p-5 rounded-2xl border ${isCorrect ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20' : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/20'} space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900 dark:text-slate-100">Câu ${item.questionIndex + 1}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">Trắc nghiệm</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${item.difficulty}</span>
                ${item.topic ? `<span class="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">${item.topic}</span>` : ''}
              </div>
              ${statusBadge}
            </div>

            <div class="text-sm md:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium katex-render">
              ${item.questionText}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              ${optionsList}
            </div>

            <div class="mt-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm space-y-1">
              <div class="font-semibold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
                <i data-lucide="help-circle" class="w-4 h-4 text-indigo-500"></i>
                <span>Đáp án đúng: <b class="text-emerald-600 dark:text-emerald-400 font-bold">${item.correct}</b></span>
              </div>
              <div class="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed katex-render pt-1">
                ${item.explanation || 'Không có hướng dẫn giải.'}
              </div>
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
    this._refreshIconsAndMath();
  }

  _launchConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  _refreshIconsAndMath() {
    // Kích hoạt Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Render KaTeX công thức toán học
    if (typeof renderMathInElement === 'function') {
      const renderElements = document.querySelectorAll('.katex-render');
      renderElements.forEach(el => {
        renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      });
    }
  }
}

window.quizEngine = new QuizEngine();

// app.js - Trình điều khiển trung tâm (Controller & UI Router) cho hệ thống LMS Lớp học
class LMSApp {
  constructor() {
    this.currentView = 'view-subjects';
    this.subjects = [];
    this.selectedSubjectForExam = null;
    this.currentEditingOutlineSubjId = null;
    this.currentEditingOutlineId = null;
    this.currentSubjectHubId = null;
    this.parsedExamBuffer = null; // Chứa kết quả đề thi vừa phân tích từ ảnh/file
    this.darkMode = localStorage.getItem('LMS_DARK_MODE') === 'true';
    this.subjectViewMode = localStorage.getItem('LMS_VIEW_MODE') || 'icons'; // 'icons' hoặc 'cards'
  }

  async init() {
    // 1. Áp dụng chế độ Dark/Light mode
    this.applyTheme();

    // 2. Khởi tạo cơ sở dữ liệu IndexedDB
    await window.db.init();

    // 3. Tải danh sách môn học
    await this.loadSubjects();

    // 4. Lắng nghe sự kiện người dùng
    this.bindEvents();

    // 5. Cập nhật giao diện ban đầu
    this.setSubjectViewMode(this.subjectViewMode, false);
    this.renderSubjectsTable();
    this.renderExamsList();
    this.renderHistoryView();
    this.updateStatsCards();

    // 6. Kích hoạt icon
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --- Theme Controller ---
  applyTheme() {
    const htmlEl = document.documentElement;
    if (this.darkMode) {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('LMS_DARK_MODE', this.darkMode);
    this.applyTheme();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --- View Switcher ---
  switchView(targetViewId) {
    const views = [
      'view-subjects',
      'view-parser',
      'view-exams',
      'view-quiz-running',
      'view-quiz-result',
      'view-history'
    ];

    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === targetViewId) {
          el.classList.remove('hidden');
          el.classList.add('animate-fade-in');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Cập nhật trạng thái active trên thanh điều hướng Desktop & Mobile
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      const target = btn.getAttribute('data-nav-target');
      if (target === targetViewId) {
        btn.classList.add('text-indigo-600', 'bg-indigo-50', 'dark:bg-indigo-950/60', 'dark:text-indigo-400');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
      } else {
        btn.classList.remove('text-indigo-600', 'bg-indigo-50', 'dark:bg-indigo-950/60', 'dark:text-indigo-400');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
      }
    });

    this.currentView = targetViewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    this._renderAllMath();
  }

  // --- Chuyển đổi chế độ hiển thị Lưới Icon / Dạng Thẻ ---
  setSubjectViewMode(mode, doRender = true) {
    this.subjectViewMode = mode;
    localStorage.setItem('LMS_VIEW_MODE', mode);

    const iconsBtn = document.getElementById('view-mode-icons-btn');
    const cardsBtn = document.getElementById('view-mode-cards-btn');

    if (iconsBtn && cardsBtn) {
      if (mode === 'icons') {
        iconsBtn.className = "px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm";
        cardsBtn.className = "px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition text-slate-500 hover:text-slate-800 dark:text-slate-400";
      } else {
        cardsBtn.className = "px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm";
        iconsBtn.className = "px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition text-slate-500 hover:text-slate-800 dark:text-slate-400";
      }
    }

    if (doRender) {
      this.renderSubjectsTable();
    }
  }

  // --- Dữ liệu môn học & Bảng lựa chọn ---
  async loadSubjects() {
    this.subjects = await window.db.getAllSubjects();
  }

  renderSubjectsTable(filterStatus = 'all', searchQuery = '') {
    const container = document.getElementById('subjects-grid-container');
    if (!container) return;

    let list = [...this.subjects];

    // Lọc theo tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q)));
    }

    // Lọc theo trạng thái
    if (filterStatus === 'has-outline') {
      list = list.filter(s => s.hasOutline);
    } else if (filterStatus === 'no-outline') {
      list = list.filter(s => !s.hasOutline);
    } else if (filterStatus === 'has-exam') {
      list = list.filter(s => s.hasExam);
    } else if (filterStatus === 'no-exam') {
      list = list.filter(s => !s.hasExam);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <i data-lucide="folder-search" class="w-12 h-12 mx-auto text-slate-400 mb-3"></i>
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy môn học nào</p>
          <p class="text-sm text-slate-500 mt-1">Hãy thử đổi bộ lọc hoặc thêm môn học mới vào hệ thống.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    // =========================================================================
    // CHẾ ĐỘ 1: LƯỚI ICON ỨNG DỤNG HIỆN ĐẠI (APP ICONS GRID - MẶC ĐỊNH)
    // =========================================================================
    if (this.subjectViewMode === 'icons') {
      container.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 py-2";
      container.innerHTML = list.map(subj => {
        const outlinesCount = (subj.outlines && subj.outlines.length > 0) ? subj.outlines.length : (subj.outline ? 1 : 0);
        const examCount = subj.exams ? subj.exams.length : 0;

        return `
          <div onclick="window.app.openSubjectHub('${subj.id}')"
               class="subject-app-item flex flex-col items-center text-center cursor-pointer p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl transition-all group backdrop-blur-sm">
            
            <!-- Icon Squircle lớn phong cách iOS/App Launcher -->
            <div class="relative mb-3">
              <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${subj.color || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-white shadow-lg subject-squircle">
                <i data-lucide="${subj.icon || 'book'}" class="w-8 h-8 sm:w-10 sm:h-10 drop-shadow"></i>
              </div>

              <!-- Huy hiệu góc trái: Đề cương -->
              <div class="absolute -top-1.5 -left-1.5">
                <span class="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] h-5 rounded-full text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm ${outlinesCount > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}"
                      title="${outlinesCount > 0 ? outlinesCount + ' đề cương' : 'Chưa có đề cương'}">
                  <i data-lucide="book-open" class="w-2.5 h-2.5 mr-0.5"></i>
                  ${outlinesCount}
                </span>
              </div>

              <!-- Huy hiệu góc phải: Đề thi -->
              <div class="absolute -top-1.5 -right-1.5">
                <span class="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] h-5 rounded-full text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm ${examCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}"
                      title="${examCount > 0 ? examCount + ' đề thi' : 'Chưa có đề thi'}">
                  <i data-lucide="file-check-2" class="w-2.5 h-2.5 mr-0.5"></i>
                  ${examCount}
                </span>
              </div>
            </div>

            <!-- Tên & Mã môn -->
            <h3 class="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              ${subj.name}
            </h3>
            <span class="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              ${subj.code || 'LMS'}
            </span>

            <!-- Nút tương tác -->
            <div class="mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              Mở đề cương & đề thi →
            </div>
          </div>
        `;
      }).join('');
    } 
    // =========================================================================
    // CHẾ ĐỘ 2: THẺ TRỰC QUAN TINH GỌN (COMPACT VISUAL CARDS)
    // =========================================================================
    else {
      container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
      container.innerHTML = list.map(subj => {
        const outlinesCount = (subj.outlines && subj.outlines.length > 0) ? subj.outlines.length : (subj.outline ? 1 : 0);
        const examCount = subj.exams ? subj.exams.length : 0;
        const questionCount = subj.exams ? subj.exams.reduce((sum, e) => sum + (e.questions ? e.questions.length : 0), 0) : 0;

        return `
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between group">
            <div>
              <!-- Header thẻ -->
              <div class="flex items-start justify-between mb-4">
                <div onclick="window.app.openSubjectHub('${subj.id}')" class="flex items-center space-x-3 cursor-pointer">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${subj.color || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white shadow-md subject-squircle">
                    <i data-lucide="${subj.icon || 'book'}" class="w-6 h-6"></i>
                  </div>
                  <div>
                    <h3 class="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      ${subj.name}
                    </h3>
                    <p class="text-xs text-slate-400 font-medium">Mã: ${subj.code || 'LMS'}</p>
                  </div>
                </div>

                <button onclick="window.app.deleteSubjectConfirm('${subj.id}', '${subj.name}')"
                        class="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Xóa môn học">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- 2 Khối Icon Tương Tác Thay Thế Các Dòng Text Rườm Rà Cũ -->
              <div class="grid grid-cols-2 gap-2 mb-4">
                
                <!-- Khối Icon 1: Mục Đề Cương -->
                <div onclick="window.app.openSubjectHub('${subj.id}', 'outlines')"
                     class="p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${outlinesCount > 0 ? 'bg-emerald-50/60 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/40 hover:bg-emerald-100/60' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 hover:bg-slate-100'}">
                  <div class="flex items-center justify-between mb-2">
                    <div class="w-8 h-8 rounded-xl ${outlinesCount > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} flex items-center justify-center shadow-sm">
                      <i data-lucide="book-open" class="w-4 h-4"></i>
                    </div>
                    <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full ${outlinesCount > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:text-slate-400'}">
                      ${outlinesCount > 0 ? outlinesCount + ' đề cương' : 'Chưa có'}
                    </span>
                  </div>
                  <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Mục Đề Cương</div>
                  <div class="text-[10px] text-slate-500 mt-0.5 flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>${outlinesCount > 0 ? 'Xem chi tiết' : '+ Soạn đề cương'}</span>
                    <i data-lucide="chevron-right" class="w-3 h-3 ml-0.5"></i>
                  </div>
                </div>

                <!-- Khối Icon 2: Mục Kiểm Tra -->
                <div onclick="window.app.openSubjectHub('${subj.id}', 'exams')"
                     class="p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${examCount > 0 ? 'bg-indigo-50/60 border-indigo-200/80 dark:bg-indigo-950/20 dark:border-indigo-900/40 hover:bg-indigo-100/60' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 hover:bg-slate-100'}">
                  <div class="flex items-center justify-between mb-2">
                    <div class="w-8 h-8 rounded-xl ${examCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} flex items-center justify-center shadow-sm">
                      <i data-lucide="file-check-2" class="w-4 h-4"></i>
                    </div>
                    <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full ${examCount > 0 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300' : 'bg-slate-200 text-slate-600 dark:text-slate-400'}">
                      ${examCount > 0 ? examCount + ' đề' : 'Chưa có'}
                    </span>
                  </div>
                  <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Mục Kiểm Tra</div>
                  <div class="text-[10px] text-slate-500 mt-0.5 flex items-center text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>${examCount > 0 ? `${questionCount} câu • Làm bài` : '+ Tạo đề thi'}</span>
                    <i data-lucide="chevron-right" class="w-3 h-3 ml-0.5"></i>
                  </div>
                </div>

              </div>
            </div>

            <!-- Nút mở không gian quản lý môn -->
            <button onclick="window.app.openSubjectHub('${subj.id}')"
                    class="w-full py-2.5 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition flex items-center justify-center space-x-1.5">
              <i data-lucide="layout-dashboard" class="w-4 h-4 text-indigo-500"></i>
              <span>Vào không gian môn học →</span>
            </button>
          </div>
        `;
      }).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.updateStatsCards();
  }

  // =========================================================================
  // KHÔNG GIAN MÔN HỌC (SUBJECT HUB: MỤC ĐỀ CƯƠNG & BÀI KIỂM TRA MỚI)
  // =========================================================================
  async openSubjectHub(subjectId, initialTab = 'outlines') {
    this.currentSubjectHubId = subjectId;
    const subject = await window.db.getSubjectById(subjectId);
    if (!subject) return;

    // Header môn học
    const nameEl = document.getElementById('hub-subject-name');
    const codeEl = document.getElementById('hub-subject-code');
    const iconEl = document.getElementById('hub-subject-icon');
    const iconBox = document.getElementById('hub-subject-icon-box');

    if (nameEl) nameEl.textContent = subject.name;
    if (codeEl) codeEl.textContent = subject.code || 'LMS';
    if (iconEl) iconEl.setAttribute('data-lucide', subject.icon || 'book');
    if (iconBox) {
      iconBox.className = `w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg subject-squircle bg-gradient-to-br ${subject.color || 'from-indigo-600 to-purple-600'}`;
    }

    // Đếm số lượng
    const outlinesList = subject.outlines || (subject.outline ? [subject.outline] : []);
    const examsList = subject.exams || [];

    const outlinesBadge = document.getElementById('hub-outlines-badge');
    const examsBadge = document.getElementById('hub-exams-badge');
    if (outlinesBadge) outlinesBadge.textContent = outlinesList.length;
    if (examsBadge) examsBadge.textContent = examsList.length;

    // Render danh sách Đề Cương
    this.renderHubOutlinesList(subject, outlinesList);

    // Render danh sách Bài Kiểm Tra
    this.renderHubExamsList(subject, examsList);

    // Kích hoạt tab ban đầu
    this.switchSubjectHubTab(initialTab);

    // Hiện modal
    const modal = document.getElementById('subject-hub-modal');
    if (modal) modal.classList.remove('hidden');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    this._renderAllMath();
  }

  closeSubjectHub() {
    const modal = document.getElementById('subject-hub-modal');
    if (modal) modal.classList.add('hidden');
  }

  switchSubjectHubTab(tabName) {
    const outlinesTabBtn = document.getElementById('hub-tab-outlines-btn');
    const examsTabBtn = document.getElementById('hub-tab-exams-btn');
    const outlinesContent = document.getElementById('hub-content-outlines');
    const examsContent = document.getElementById('hub-content-exams');

    if (tabName === 'outlines') {
      if (outlinesTabBtn) {
        outlinesTabBtn.className = "pb-3 px-3 transition-colors flex items-center space-x-2 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold";
      }
      if (examsTabBtn) {
        examsTabBtn.className = "pb-3 px-3 transition-colors flex items-center space-x-2 border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold";
      }
      if (outlinesContent) outlinesContent.classList.remove('hidden');
      if (examsContent) examsContent.classList.add('hidden');
    } else {
      if (examsTabBtn) {
        examsTabBtn.className = "pb-3 px-3 transition-colors flex items-center space-x-2 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold";
      }
      if (outlinesTabBtn) {
        outlinesTabBtn.className = "pb-3 px-3 transition-colors flex items-center space-x-2 border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold";
      }
      if (examsContent) examsContent.classList.remove('hidden');
      if (outlinesContent) outlinesContent.classList.add('hidden');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    this._renderAllMath();
  }

  renderHubOutlinesList(subject, outlines) {
    const container = document.getElementById('hub-outlines-container');
    if (!container) return;

    if (!outlines || outlines.length === 0) {
      container.innerHTML = `
        <div class="py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <i data-lucide="book-open" class="w-6 h-6"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-sm md:text-base text-slate-800 dark:text-slate-200">Chưa có đề cương nào cho môn này</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Hãy soạn đề cương ôn tập đầu tiên để tóm tắt kiến thức và công thức trọng tâm cho cả lớp.
            </p>
          </div>
          <button onclick="window.app.openCreateNewOutlineForCurrentHub()"
                  class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition inline-flex items-center space-x-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Soạn đề cương mới ngay</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = outlines.map((o, idx) => {
      const topicCount = o.topics ? o.topics.length : 0;
      return `
        <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition shadow-sm space-y-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Đề cương #${idx + 1}
                </span>
                <span class="text-xs text-slate-400">Cập nhật: ${o.updatedAt || 'Mới nhất'}</span>
              </div>
              <h4 class="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                ${o.title}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Người soạn: <b>${o.author || 'Tổ bộ môn'}</b> • ${topicCount} chuyên đề lý thuyết
              </p>
            </div>

            <div class="flex items-center space-x-1.5">
              <button onclick="window.app.openEditOutlineForSubject('${subject.id}', '${o.id}')"
                      class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center space-x-1"
                      title="Chỉnh sửa đề cương này">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-indigo-500"></i>
                <span class="hidden sm:inline">Sửa</span>
              </button>

              <button onclick="window.app.deleteOutlineFromHub('${subject.id}', '${o.id}')"
                      class="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Xóa đề cương này">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            ${o.summary || 'Chưa có tóm tắt nội dung.'}
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-slate-400 font-medium">Hỗ trợ công thức Toán/Lý/Hóa KaTeX</span>
            
            <button onclick="window.app.viewOutlineDetail('${subject.id}', '${o.id}')"
                    class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
              <i data-lucide="book-marked" class="w-4 h-4"></i>
              <span>Xem chi tiết đề cương</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderHubExamsList(subject, exams) {
    const container = document.getElementById('hub-exams-container');
    if (!container) return;

    if (!exams || exams.length === 0) {
      container.innerHTML = `
        <div class="py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
            <i data-lucide="file-question" class="w-6 h-6"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-sm md:text-base text-slate-800 dark:text-slate-200">Chưa có bài kiểm tra nào cho môn này</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Chụp ảnh đề thi bằng camera điện thoại, tải file PDF/Word lên hoặc tạo đề mới để luyện tập ngay.
            </p>
          </div>
          <div class="flex items-center justify-center space-x-2 pt-1">
            <button onclick="window.app.openCreateNewExamForCurrentHub('scan')"
                    class="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 font-bold text-xs transition inline-flex items-center space-x-1.5">
              <i data-lucide="scan-line" class="w-4 h-4"></i>
              <span>📸 Quét ảnh đề thi</span>
            </button>

            <button onclick="window.app.openCreateNewExamForCurrentHub('manual')"
                    class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition inline-flex items-center space-x-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Tạo đề mới</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = exams.map(ex => {
      const qCount = ex.questions ? ex.questions.length : 0;
      return `
        <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-sm space-y-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-300">
                  <i data-lucide="clock" class="inline w-3 h-3 mr-0.5"></i> ${ex.durationMinutes || 15} phút
                </span>
                <span class="text-xs text-slate-400">Tạo ngày: ${ex.createdAt || 'Gần đây'}</span>
              </div>
              <h4 class="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                ${ex.title}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Số lượng: <b>${qCount} câu hỏi trắc nghiệm</b>
              </p>
            </div>

            <button onclick="window.app.deleteExamFromHub('${subject.id}', '${ex.id}', '${ex.title}')"
                    class="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Xóa đề kiểm tra này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-400">
            ${ex.description || 'Đề kiểm tra trắc nghiệm chuẩn có lời giải và công thức KaTeX.'}
          </p>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onclick="window.app.closeSubjectHub(); window.app.openExamSetupModal('${subject.id}', '${ex.id}', 'practice')"
                    class="py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition text-center flex items-center justify-center space-x-1.5">
              <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>Luyện tập (Xem đáp án)</span>
            </button>

            <button onclick="window.app.closeSubjectHub(); window.app.openExamSetupModal('${subject.id}', '${ex.id}', 'exam')"
                    class="py-2 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition text-center flex items-center justify-center space-x-1.5 shadow-sm">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>Thi bấm giờ</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Thao tác Thêm Đề Cương Mới cho môn hiện tại ---
  openCreateNewOutlineForCurrentHub() {
    if (!this.currentSubjectHubId) return;
    this.currentEditingOutlineSubjId = this.currentSubjectHubId;
    this.currentEditingOutlineId = null; // Tạo mới

    const subject = this.subjects.find(s => s.id === this.currentSubjectHubId);

    const modal = document.getElementById('outline-modal');
    const modalTitle = document.getElementById('outline-modal-title');
    const modalContent = document.getElementById('outline-modal-content');
    const editArea = document.getElementById('outline-edit-container');

    if (modalTitle) modalTitle.textContent = `Soạn Đề Cương Mới: Môn ${subject ? subject.name : ''}`;
    if (modalContent) modalContent.classList.add('hidden');
    if (editArea) editArea.classList.remove('hidden');

    // Làm trống form để soạn mới
    document.getElementById('edit-outline-title').value = `Đề Cương Ôn Tập Môn ${subject ? subject.name : ''}`;
    document.getElementById('edit-outline-author').value = 'Tổ bộ môn';
    document.getElementById('edit-outline-summary').value = 'Tóm tắt kiến thức lý thuyết và công thức trọng tâm.';
    document.getElementById('edit-outline-topics-raw').value = `### Chuyên đề 1: Kiến thức trọng tâm\nNội dung lý thuyết và công thức KaTeX $...$\n\n### Chuyên đề 2: Các dạng bài tập\nNội dung chuyên đề 2`;

    if (modal) modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  openEditOutlineForSubject(subjectId, outlineId) {
    this.currentEditingOutlineSubjId = subjectId;
    this.currentEditingOutlineId = outlineId;

    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const outlines = subject.outlines || (subject.outline ? [subject.outline] : []);
    const o = outlines.find(item => item.id === outlineId) || outlines[0] || {};

    const modal = document.getElementById('outline-modal');
    const modalTitle = document.getElementById('outline-modal-title');
    const modalContent = document.getElementById('outline-modal-content');
    const editArea = document.getElementById('outline-edit-container');

    if (modalTitle) modalTitle.textContent = `Chỉnh Sửa Đề Cương: ${subject.name}`;
    if (modalContent) modalContent.classList.add('hidden');
    if (editArea) editArea.classList.remove('hidden');

    document.getElementById('edit-outline-title').value = o.title || '';
    document.getElementById('edit-outline-author').value = o.author || '';
    document.getElementById('edit-outline-summary').value = o.summary || '';

    let topicsText = '';
    if (o.topics && o.topics.length > 0) {
      topicsText = o.topics.map(t => `### ${t.name}\n${t.content}`).join('\n\n');
    }
    document.getElementById('edit-outline-topics-raw').value = topicsText;

    if (modal) modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async viewOutlineDetail(subjectId, outlineId) {
    this.currentEditingOutlineSubjId = subjectId;
    this.currentEditingOutlineId = outlineId;

    const subject = await window.db.getSubjectById(subjectId);
    if (!subject) return;

    const outlines = subject.outlines || (subject.outline ? [subject.outline] : []);
    const o = outlines.find(item => item.id === outlineId) || outlines[0];

    const modal = document.getElementById('outline-modal');
    const modalTitle = document.getElementById('outline-modal-title');
    const modalContent = document.getElementById('outline-modal-content');
    const editArea = document.getElementById('outline-edit-container');

    if (modalTitle) modalTitle.textContent = `Đề Cương Môn: ${subject.name}`;
    if (editArea) editArea.classList.add('hidden');
    if (modalContent) modalContent.classList.remove('hidden');

    if (o && o.title) {
      let topicsHtml = '';
      if (o.topics && o.topics.length > 0) {
        topicsHtml = o.topics.map((t, idx) => `
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base flex items-center space-x-2">
              <span class="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">${idx + 1}</span>
              <span>${t.name}</span>
            </h4>
            <div class="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed katex-render pl-8">
              ${t.content}
            </div>
          </div>
        `).join('');
      }

      modalContent.innerHTML = `
        <div class="space-y-4">
          <div class="border-b border-slate-200 dark:border-slate-700 pb-3 flex items-start justify-between">
            <div>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">${o.title}</h3>
              <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span><i data-lucide="user" class="inline w-3.5 h-3.5 mr-1"></i> ${o.author || 'Tổ bộ môn'}</span>
                <span><i data-lucide="calendar" class="inline w-3.5 h-3.5 mr-1"></i> Cập nhật: ${o.updatedAt || 'Mới nhất'}</span>
              </div>
            </div>
            <button onclick="window.print()" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>In</span>
            </button>
          </div>

          <div class="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs md:text-sm text-indigo-950 dark:text-indigo-200">
            <b>Tóm tắt trọng tâm:</b> ${o.summary || 'Chưa có mô tả tóm tắt.'}
          </div>

          <div class="space-y-3 pt-2">
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-1.5">
              <i data-lucide="list-tree" class="w-4 h-4 text-emerald-500"></i>
              <span>Các chuyên đề trọng tâm ôn thi:</span>
            </h4>
            ${topicsHtml || '<p class="text-xs text-slate-400 italic">Chưa có chi tiết các chuyên đề.</p>'}
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this._renderAllMath();
  }

  async deleteOutlineFromHub(subjectId, outlineId) {
    if (confirm('Bạn có chắc muốn xóa đề cương này không?')) {
      await window.db.deleteOutline(subjectId, outlineId);
      await this.loadSubjects();
      this.renderSubjectsTable();
      this.openSubjectHub(subjectId, 'outlines');
    }
  }

  async saveOutlineFromForm() {
    const title = document.getElementById('edit-outline-title').value.trim();
    const author = document.getElementById('edit-outline-author').value.trim();
    const summary = document.getElementById('edit-outline-summary').value.trim();
    const rawTopics = document.getElementById('edit-outline-topics-raw').value.trim();

    if (!title) {
      alert('Vui lòng nhập tiêu đề đề cương.');
      return;
    }

    const topicBlocks = rawTopics.split(/(?:^|\n)###\s+/).filter(Boolean);
    const topics = topicBlocks.map((block, i) => {
      const lines = block.trim().split('\n');
      const name = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      return {
        name: name || `Chuyên đề ${i + 1}`,
        content: content || 'Chưa có nội dung chi tiết.'
      };
    });

    const outlineData = {
      id: this.currentEditingOutlineId || ('outline-' + Date.now()),
      title,
      author: author || 'Tổ bộ môn',
      updatedAt: new Date().toISOString().split('T')[0],
      summary,
      topics
    };

    await window.db.saveOutline(this.currentEditingOutlineSubjId, outlineData);
    await this.loadSubjects();
    this.renderSubjectsTable();
    this.closeOutlineModal();

    // Tự động mở lại Subject Hub để người dùng thấy đề cương mới xuất hiện ngay
    this.openSubjectHub(this.currentEditingOutlineSubjId, 'outlines');
  }

  // --- Thao tác Thêm Đề Kiểm Tra Mới cho môn hiện tại ---
  openCreateNewExamForCurrentHub(mode = 'scan') {
    if (!this.currentSubjectHubId) return;
    const subject = this.subjects.find(s => s.id === this.currentSubjectHubId);

    if (mode === 'scan') {
      // Đóng hub modal, chuyển sang tab phân tích đề tự động và chọn sẵn môn này
      this.closeSubjectHub();
      this.switchView('view-parser');
      const selectSubj = document.getElementById('parser-target-subject');
      if (selectSubj) selectSubj.value = this.currentSubjectHubId;
      const titleInput = document.getElementById('parser-exam-title');
      if (titleInput) titleInput.value = `Đề Kiểm Tra Môn ${subject ? subject.name : ''}`;
    } else {
      // Mở modal tạo đề thủ công nhanh
      const modal = document.getElementById('quick-exam-modal');
      const label = document.getElementById('quick-exam-subject-label');
      if (label) label.textContent = `Môn học: ${subject ? subject.name : ''} (${subject ? subject.code : ''})`;
      document.getElementById('quick-exam-title-input').value = `Đề Kiểm Tra Môn ${subject ? subject.name : ''}`;
      document.getElementById('quick-exam-questions-raw').value = '';
      if (modal) modal.classList.remove('hidden');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  closeQuickExamModal() {
    const modal = document.getElementById('quick-exam-modal');
    if (modal) modal.classList.add('hidden');
  }

  async saveQuickExamSubmit() {
    const title = document.getElementById('quick-exam-title-input').value.trim();
    const duration = parseInt(document.getElementById('quick-exam-duration-input').value, 10) || 15;
    const desc = document.getElementById('quick-exam-desc-input').value.trim();
    const rawQuestions = document.getElementById('quick-exam-questions-raw').value.trim();

    if (!title) {
      alert('Vui lòng nhập tên đề kiểm tra.');
      return;
    }

    if (!this.currentSubjectHubId) return;

    let parsedQuestions = [];
    if (rawQuestions) {
      const parsed = window.questionParser.parseExamText(rawQuestions);
      parsedQuestions = parsed.questions || [];
    }

    // Nếu người dùng chưa dán câu hỏi, tạo mặc định 3 câu mẫu để làm bài ngay
    if (parsedQuestions.length === 0) {
      parsedQuestions = [
        {
          id: 'q-' + Date.now() + '-1',
          question: `Câu hỏi ôn tập số 1 của ${title}`,
          options: [
            { key: 'A', text: 'Phương án A (Đáp án đúng)' },
            { key: 'B', text: 'Phương án B' },
            { key: 'C', text: 'Phương án C' },
            { key: 'D', text: 'Phương án D' }
          ],
          correctAnswer: 'A',
          explanation: 'Xem lại nội dung đề cương môn học để hiểu bản chất câu hỏi này.',
          difficulty: 'Thông hiểu'
        }
      ];
    }

    const examData = {
      id: 'exam-' + Date.now(),
      title: title,
      durationMinutes: duration,
      description: desc || `Đề kiểm tra gồm ${parsedQuestions.length} câu trắc nghiệm.`,
      createdAt: new Date().toISOString().split('T')[0],
      questions: parsedQuestions
    };

    await window.db.saveExam(this.currentSubjectHubId, examData);
    await this.loadSubjects();
    this.renderSubjectsTable();
    this.renderExamsList();
    this.closeQuickExamModal();

    // Làm mới và hiển thị đề kiểm tra mới trong Subject Hub
    this.openSubjectHub(this.currentSubjectHubId, 'exams');
    alert(`Đã tạo thành công bài kiểm tra "${title}"!`);
  }

  async deleteExamFromHub(subjectId, examId, examTitle) {
    if (confirm(`Bạn có chắc muốn xóa đề thi "${examTitle}" không?`)) {
      await window.db.deleteExam(subjectId, examId);
      await this.loadSubjects();
      this.renderSubjectsTable();
      this.renderExamsList();
      this.openSubjectHub(subjectId, 'exams');
    }
  }

  async deleteSubjectFromHub() {
    if (!this.currentSubjectHubId) return;
    const subject = this.subjects.find(s => s.id === this.currentSubjectHubId);
    if (!subject) return;

    if (confirm(`Bạn có chắc muốn xóa môn "${subject.name}" và toàn bộ đề thi, đề cương của môn này không?`)) {
      await window.db.deleteSubject(this.currentSubjectHubId);
      await this.loadSubjects();
      this.renderSubjectsTable();
      this.renderExamsList();
      this.closeSubjectHub();
    }
  }

  updateStatsCards() {
    const totalSubj = this.subjects.length;
    const withOutline = this.subjects.filter(s => s.hasOutline).length;
    const withExam = this.subjects.filter(s => s.hasExam).length;
    const totalExams = this.subjects.reduce((sum, s) => sum + (s.exams ? s.exams.length : 0), 0);

    const elTotal = document.getElementById('stat-total-subjects');
    const elOutline = document.getElementById('stat-outline-count');
    const elExam = document.getElementById('stat-exam-count');
    const elTotalExams = document.getElementById('stat-total-exams');

    if (elTotal) elTotal.textContent = totalSubj;
    if (elOutline) elOutline.textContent = `${withOutline}/${totalSubj}`;
    if (elExam) elExam.textContent = `${withExam}/${totalSubj}`;
    if (elTotalExams) elTotalExams.textContent = totalExams;
  }

  // --- Thêm Môn Học Mới ---
  openAddSubjectModal() {
    const modal = document.getElementById('add-subject-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeAddSubjectModal() {
    const modal = document.getElementById('add-subject-modal');
    if (modal) modal.classList.add('hidden');
  }

  async handleAddSubjectSubmit(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('new-subj-name').value.trim();
    const code = document.getElementById('new-subj-code').value.trim();
    const icon = document.getElementById('new-subj-icon').value;
    const color = document.getElementById('new-subj-color').value;

    if (!name) {
      alert('Vui lòng nhập tên môn học');
      return;
    }

    const newSubject = {
      id: 'subj-' + Date.now(),
      name: name,
      code: code || name.slice(0, 4).toUpperCase(),
      icon: icon || 'book',
      color: color || 'from-indigo-600 to-purple-600',
      hasOutline: false,
      hasExam: false,
      outline: null,
      exams: []
    };

    await window.db.saveSubject(newSubject);
    await this.loadSubjects();
    this.renderSubjectsTable();
    this.closeAddSubjectModal();

    // Reset form
    document.getElementById('new-subj-name').value = '';
    document.getElementById('new-subj-code').value = '';
  }

  // --- Quick start / Upload routing ---
  quickStartExamOrUpload(subjectId) {
    const subj = this.subjects.find(s => s.id === subjectId);
    if (!subj) return;

    if (subj.hasExam && subj.exams && subj.exams.length > 0) {
      // Chuyển sang tab Ngân hàng đề thi và chọn sẵn môn này
      this.switchView('view-exams');
      const selectEl = document.getElementById('exams-filter-subject');
      if (selectEl) {
        selectEl.value = subjectId;
        this.renderExamsList(subjectId);
      }
    } else {
      // Chưa có đề: Chuyển sang tab Phân tích & Tải đề lên
      this.switchView('view-parser');
      const selectSubj = document.getElementById('parser-target-subject');
      if (selectSubj) selectSubj.value = subjectId;
    }
  }

  // =========================================================================
  // BỘ MÁY PHÂN TÍCH ĐỀ TỰ ĐỘNG (OCR & QUESTION PARSER)
  // =========================================================================
  async handleFileUpload(file) {
    if (!file) return;

    const progressBox = document.getElementById('parser-progress-box');
    const progressBar = document.getElementById('parser-progress-bar');
    const progressText = document.getElementById('parser-progress-text');
    const rawTextarea = document.getElementById('parser-raw-text');

    if (progressBox) progressBox.classList.remove('hidden');

    try {
      const extractedText = await window.fileProcessor.processFile(file, (msg, pct) => {
        if (progressText) progressText.textContent = msg;
        if (progressBar) progressBar.style.width = `${pct}%`;
      });

      if (rawTextarea) rawTextarea.value = extractedText;
      if (progressText) progressText.textContent = 'Hoàn tất trích xuất! Sẵn sàng phân tích câu hỏi.';

      // Tự động phân tích câu hỏi
      this.runQuestionCalculation();
    } catch (err) {
      alert('Lỗi xử lý file: ' + err.message);
      if (progressText) progressText.textContent = 'Đã xảy ra lỗi.';
    }
  }

  runQuestionCalculation() {
    const rawText = document.getElementById('parser-raw-text').value;
    if (!rawText.trim()) {
      alert('Vui lòng tải file đề thi (ảnh, PDF, docx) hoặc dán văn bản câu hỏi vào khung nhập liệu.');
      return;
    }

    const parseResult = window.questionParser.parseExamText(rawText);

    if (!parseResult.success || parseResult.questions.length === 0) {
      alert('Không nhận diện được câu hỏi trắc nghiệm nào từ văn bản. Vui lòng kiểm tra định dạng đề có dạng "Câu 1: ... A. ... B. ..." không.');
      return;
    }

    this.parsedExamBuffer = parseResult;
    this.renderParsedQuestionsPreview(parseResult);
  }

  renderParsedQuestionsPreview(result) {
    const previewContainer = document.getElementById('parser-preview-container');
    const countBadge = document.getElementById('parser-detected-count');
    const timeEst = document.getElementById('parser-est-time');
    const statsBreakdown = document.getElementById('parser-stats-breakdown');
    const saveSection = document.getElementById('parser-save-section');

    if (previewContainer) previewContainer.classList.remove('hidden');
    if (saveSection) saveSection.classList.remove('hidden');

    if (countBadge) countBadge.textContent = `${result.totalQuestions} câu hỏi`;
    if (timeEst) timeEst.textContent = `~${result.stats.estimatedTimeMinutes} phút`;

    // Hiển thị phân bổ độ khó & dạng câu hỏi
    if (statsBreakdown) {
      const d = result.stats.difficultyBreakdown;
      const tfCount = result.questions.filter(q => q.type === 'true_false').length;
      const scCount = result.questions.length - tfCount;
      statsBreakdown.innerHTML = `
        <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-bold flex items-center space-x-1">
          <i data-lucide="check-square" class="w-3 h-3 mr-0.5"></i> Đúng/Sai: ${tfCount}
        </span>
        <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold flex items-center space-x-1">
          <i data-lucide="list" class="w-3 h-3 mr-0.5"></i> Trắc nghiệm: ${scCount}
        </span>
        <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">Nhận biết: ${d['Nhận biết']}</span>
        <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Thông hiểu: ${d['Thông hiểu']}</span>
        <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">Vận dụng: ${d['Vận dụng']}</span>
        <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-semibold">Vận dụng cao: ${d['Vận dụng cao']}</span>
        ${result.stats.missingAnswerKeys > 0 ? `<span class="px-2 py-0.5 rounded bg-rose-500 text-white text-xs font-bold animate-pulse">Cần chọn đáp án: ${result.stats.missingAnswerKeys} câu</span>` : ''}
      `;
    }

    // Render danh sách thẻ câu hỏi có thể chỉnh sửa trực tiếp
    const listEl = document.getElementById('parser-questions-list');
    if (!listEl) return;

    listEl.innerHTML = result.questions.map((q, idx) => {
      if (q.type === 'true_false') {
        // Giao diện thẻ câu hỏi Đúng/Sai (Phần II)
        const subListHtml = (q.subQuestions || []).map(sub => {
          const isTrue = sub.correctAnswer === 'true';
          return `
            <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-start space-x-2 flex-1">
                <span class="flex-shrink-0 w-6 h-6 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs flex items-center justify-center mt-0.5">
                  ${sub.key}
                </span>
                <input type="text"
                       value="${(sub.text || '').replace(/"/g, '&quot;')}"
                       onchange="window.app.updateParsedSubQuestionText(${idx}, '${sub.key}', this.value)"
                       placeholder="Nhập nội dung mệnh đề..."
                       class="flex-1 text-xs md:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              </div>

              <div class="flex items-center space-x-1.5 self-end sm:self-center flex-shrink-0">
                <button type="button"
                        onclick="window.app.updateParsedSubQuestionCorrect(${idx}, '${sub.key}', 'true')"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${isTrue ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                  <i data-lucide="check" class="w-3 h-3"></i>
                  <span>Đúng</span>
                </button>
                <button type="button"
                        onclick="window.app.updateParsedSubQuestionCorrect(${idx}, '${sub.key}', 'false')"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${!isTrue ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-500' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                  <i data-lucide="x" class="w-3 h-3"></i>
                  <span>Sai</span>
                </button>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="p-4 rounded-2xl border ${q.needsReview ? 'border-amber-400 bg-amber-50/20' : 'border-purple-300 dark:border-purple-900/60 bg-purple-50/10'} space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-sm text-purple-600 dark:text-purple-400">Câu ${idx + 1}</span>
                <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-bold">Đúng / Sai</span>
                <select onchange="window.app.updateParsedQuestionDifficulty(${idx}, this.value)"
                        class="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <option value="Nhận biết" ${q.difficulty === 'Nhận biết' ? 'selected' : ''}>Nhận biết</option>
                  <option value="Thông hiểu" ${q.difficulty === 'Thông hiểu' ? 'selected' : ''}>Thông hiểu</option>
                  <option value="Vận dụng" ${q.difficulty === 'Vận dụng' ? 'selected' : ''}>Vận dụng</option>
                  <option value="Vận dụng cao" ${q.difficulty === 'Vận dụng cao' ? 'selected' : ''}>Vận dụng cao</option>
                </select>
              </div>

              <div class="flex items-center space-x-2">
                <button type="button"
                        onclick="window.app.toggleParsedQuestionType(${idx})"
                        class="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  Đổi sang Trắc nghiệm A-B-C-D
                </button>
                <button onclick="window.app.removeParsedQuestion(${idx})"
                        class="text-slate-400 hover:text-rose-500 p-1 rounded transition" title="Xóa câu này">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nội dung câu hỏi / Đoạn tư liệu dẫn dắt:</label>
              <textarea onchange="window.app.updateParsedQuestionText(${idx}, this.value)"
                        rows="2"
                        class="w-full text-xs md:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">${q.question}</textarea>
            </div>

            <div class="space-y-2 pt-1">
              <label class="block text-xs font-medium text-slate-500 dark:text-slate-400">Các mệnh đề a, b, c, d (bấm [Đúng] hoặc [Sai] để định đáp án):</label>
              ${subListHtml}
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lời giải / Hướng dẫn tư duy:</label>
              <input type="text"
                     value="${(q.explanation || '').replace(/"/g, '&quot;')}"
                     onchange="window.app.updateParsedQuestionExplanation(${idx}, this.value)"
                     placeholder="Nhập hướng dẫn giải thích cho các ý..."
                     class="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            </div>
          </div>
        `;
      }

      // Giao diện thẻ câu hỏi Trắc nghiệm 4 lựa chọn (Phần I)
      const optionsHtml = (q.options || []).map(opt => {
        const isCorrect = opt.key === q.correctAnswer;
        return `
          <div class="flex items-center space-x-2">
            <input type="radio"
                   name="parser-correct-${idx}"
                   value="${opt.key}"
                   ${isCorrect ? 'checked' : ''}
                   onchange="window.app.updateParsedQuestionCorrect(${idx}, '${opt.key}')"
                   class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer">
            <span class="font-bold text-xs w-5 text-slate-700 dark:text-slate-300">${opt.key}.</span>
            <input type="text"
                   value="${(opt.text || '').replace(/"/g, '&quot;')}"
                   onchange="window.app.updateParsedOptionText(${idx}, '${opt.key}', this.value)"
                   class="flex-1 text-xs md:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
          </div>
        `;
      }).join('');

      return `
        <div class="p-4 rounded-2xl border ${q.needsReview ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-sm text-indigo-600 dark:text-indigo-400">Câu ${idx + 1}</span>
              <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold">Trắc nghiệm</span>
              <select onchange="window.app.updateParsedQuestionDifficulty(${idx}, this.value)"
                      class="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <option value="Nhận biết" ${q.difficulty === 'Nhận biết' ? 'selected' : ''}>Nhận biết</option>
                <option value="Thông hiểu" ${q.difficulty === 'Thông hiểu' ? 'selected' : ''}>Thông hiểu</option>
                <option value="Vận dụng" ${q.difficulty === 'Vận dụng' ? 'selected' : ''}>Vận dụng</option>
                <option value="Vận dụng cao" ${q.difficulty === 'Vận dụng cao' ? 'selected' : ''}>Vận dụng cao</option>
              </select>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Đáp án: <b>${q.correctAnswer}</b></span>
              <button type="button"
                      onclick="window.app.toggleParsedQuestionType(${idx})"
                      class="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                Đổi sang Đúng/Sai
              </button>
              <button onclick="window.app.removeParsedQuestion(${idx})"
                      class="text-slate-400 hover:text-rose-500 p-1 rounded transition" title="Xóa câu này">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nội dung câu hỏi (hỗ trợ công thức $...$):</label>
            <textarea onchange="window.app.updateParsedQuestionText(${idx}, this.value)"
                      rows="2"
                      class="w-full text-xs md:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">${q.question}</textarea>
          </div>

          <div class="space-y-1.5 pt-1">
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400">Các phương án lựa chọn (chọn nút tròn để đặt đáp án đúng):</label>
            ${optionsHtml}
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lời giải / Giải thích chi tiết:</label>
            <input type="text"
                   value="${(q.explanation || '').replace(/"/g, '&quot;')}"
                   onchange="window.app.updateParsedQuestionExplanation(${idx}, this.value)"
                   placeholder="Nhập lời giải hoặc hướng dẫn tư duy..."
                   class="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    this._renderAllMath();
  }

  // --- Cập nhật sửa đổi trên preview ---
  updateParsedQuestionCorrect(idx, key) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      this.parsedExamBuffer.questions[idx].correctAnswer = key;
      this.parsedExamBuffer.questions[idx].needsReview = false;
      this.renderParsedQuestionsPreview(this.parsedExamBuffer);
    }
  }

  updateParsedSubQuestionText(idx, key, val) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      const q = this.parsedExamBuffer.questions[idx];
      const sub = (q.subQuestions || []).find(s => s.key === key);
      if (sub) sub.text = val;
    }
  }

  updateParsedSubQuestionCorrect(idx, key, val) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      const q = this.parsedExamBuffer.questions[idx];
      const sub = (q.subQuestions || []).find(s => s.key === key);
      if (sub) {
        sub.correctAnswer = val; // 'true' hoặc 'false'
        sub.needsReview = false;
        q.needsReview = (q.subQuestions || []).some(s => s.needsReview);
        this.renderParsedQuestionsPreview(this.parsedExamBuffer);
      }
    }
  }

  toggleParsedQuestionType(idx) {
    if (!this.parsedExamBuffer || !this.parsedExamBuffer.questions[idx]) return;
    const q = this.parsedExamBuffer.questions[idx];

    if (q.type === 'true_false') {
      // Chuyển từ Đúng/Sai sang Trắc nghiệm 4 lựa chọn
      q.type = 'single_choice';
      q.options = (q.subQuestions && q.subQuestions.length > 0)
        ? q.subQuestions.map(s => ({ key: s.key.toUpperCase(), text: s.text }))
        : [
            { key: 'A', text: 'Phương án A' },
            { key: 'B', text: 'Phương án B' },
            { key: 'C', text: 'Phương án C' },
            { key: 'D', text: 'Phương án D' }
          ];
      q.correctAnswer = 'A';
    } else {
      // Chuyển từ Trắc nghiệm sang Đúng/Sai
      q.type = 'true_false';
      const letters = ['a', 'b', 'c', 'd'];
      q.subQuestions = (q.options && q.options.length > 0)
        ? q.options.slice(0, 4).map((opt, i) => ({
            key: letters[i] || 'a',
            text: opt.text,
            correctAnswer: 'true'
          }))
        : [
            { key: 'a', text: 'Mệnh đề a', correctAnswer: 'true' },
            { key: 'b', text: 'Mệnh đề b', correctAnswer: 'false' },
            { key: 'c', text: 'Mệnh đề c', correctAnswer: 'true' },
            { key: 'd', text: 'Mệnh đề d', correctAnswer: 'false' }
          ];
    }

    this.renderParsedQuestionsPreview(this.parsedExamBuffer);
  }

  updateParsedOptionText(idx, key, val) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      const opt = this.parsedExamBuffer.questions[idx].options.find(o => o.key === key);
      if (opt) opt.text = val;
    }
  }

  updateParsedQuestionText(idx, val) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      this.parsedExamBuffer.questions[idx].question = val;
    }
  }

  updateParsedQuestionExplanation(idx, val) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      this.parsedExamBuffer.questions[idx].explanation = val;
    }
  }

  updateParsedQuestionDifficulty(idx, val) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      this.parsedExamBuffer.questions[idx].difficulty = val;
    }
  }

  removeParsedQuestion(idx) {
    if (this.parsedExamBuffer && this.parsedExamBuffer.questions[idx]) {
      this.parsedExamBuffer.questions.splice(idx, 1);
      this.parsedExamBuffer.totalQuestions = this.parsedExamBuffer.questions.length;
      this.renderParsedQuestionsPreview(this.parsedExamBuffer);
    }
  }

  async saveParsedExamToSubject() {
    if (!this.parsedExamBuffer || this.parsedExamBuffer.questions.length === 0) {
      alert('Chưa có câu hỏi nào để lưu.');
      return;
    }

    const targetSubjectId = document.getElementById('parser-target-subject').value;
    const examTitle = document.getElementById('parser-exam-title').value.trim();
    const durationMins = parseInt(document.getElementById('parser-exam-duration').value, 10) || this.parsedExamBuffer.stats.estimatedTimeMinutes;

    if (!targetSubjectId) {
      alert('Vui lòng chọn môn học lưu trữ đề thi.');
      return;
    }

    if (!examTitle) {
      alert('Vui lòng nhập tên đề kiểm tra.');
      return;
    }

    const examData = {
      id: 'exam-' + Date.now(),
      title: examTitle,
      durationMinutes: durationMins,
      description: `Đề thi gồm ${this.parsedExamBuffer.questions.length} câu trắc nghiệm được phân tích tự động.`,
      createdAt: new Date().toISOString().split('T')[0],
      questions: this.parsedExamBuffer.questions
    };

    await window.db.saveExam(targetSubjectId, examData);
    await this.loadSubjects();

    alert(`Đã lưu thành công đề thi "${examTitle}" vào môn học! Bạn có thể bắt đầu làm bài ngay.`);

    // Reset buffer và chuyển sang xem đề thi
    this.parsedExamBuffer = null;
    document.getElementById('parser-preview-container').classList.add('hidden');
    document.getElementById('parser-save-section').classList.add('hidden');
    document.getElementById('parser-raw-text').value = '';

    this.switchView('view-exams');
    const selectEl = document.getElementById('exams-filter-subject');
    if (selectEl) {
      selectEl.value = targetSubjectId;
      this.renderExamsList(targetSubjectId);
    }
  }

  // =========================================================================
  // NGÂN HÀNG ĐỀ THI & KHỞI TẠO BÀI KIỂM TRA
  // =========================================================================
  renderExamsList(subjectFilter = 'all') {
    const container = document.getElementById('exams-cards-container');
    const filterSelect = document.getElementById('exams-filter-subject');
    const parserSelect = document.getElementById('parser-target-subject');

    // Cập nhật danh sách select môn học nếu chưa có
    if (filterSelect && filterSelect.options.length <= 1) {
      filterSelect.innerHTML = `<option value="all">Tất cả môn học</option>` +
        this.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }

    if (parserSelect && parserSelect.options.length <= 1) {
      parserSelect.innerHTML = `<option value="">-- Chọn môn học --</option>` +
        this.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }

    if (!container) return;

    let allExams = [];
    this.subjects.forEach(subj => {
      if (subj.exams && subj.exams.length > 0) {
        subj.exams.forEach(ex => {
          allExams.push({
            exam: ex,
            subject: subj
          });
        });
      }
    });

    if (subjectFilter !== 'all') {
      allExams = allExams.filter(item => item.subject.id === subjectFilter);
    }

    if (allExams.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <i data-lucide="file-question" class="w-12 h-12 mx-auto text-slate-400 mb-3"></i>
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">Chưa có đề thi nào trong mục này</p>
          <p class="text-sm text-slate-500 mt-1">Hãy chuyển sang tab "Phân Tích & Tạo Đề" để tạo đề thi mới từ ảnh hoặc tài liệu.</p>
          <button onclick="window.app.switchView('view-parser')"
                  class="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition">
            + Phân tích & Tạo đề mới
          </button>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = allExams.map(item => {
      const e = item.exam;
      const s = item.subject;
      const qCount = e.questions ? e.questions.length : 0;

      return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                ${s.name}
              </span>
              <span class="text-xs text-slate-400">
                <i data-lucide="clock" class="inline w-3.5 h-3.5 mr-1"></i> ${e.durationMinutes || 15} phút
              </span>
            </div>

            <h3 class="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
              ${e.title}
            </h3>

            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              ${e.description || 'Đề kiểm tra trắc nghiệm chuẩn bám sát cấu trúc đề thi.'}
            </p>

            <div class="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-400 mb-4">
              <span class="flex items-center"><i data-lucide="help-circle" class="w-3.5 h-3.5 mr-1 text-indigo-500"></i> ${qCount} câu hỏi</span>
              <span class="flex items-center"><i data-lucide="calendar" class="w-3.5 h-3.5 mr-1 text-slate-400"></i> ${e.createdAt || 'Gần đây'}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
            <button onclick="window.app.openExamSetupModal('${s.id}', '${e.id}', 'practice')"
                    class="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition text-center">
              Luyện tập
            </button>

            <button onclick="window.app.openExamSetupModal('${s.id}', '${e.id}', 'exam')"
                    class="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition text-center shadow-sm">
              Thi bấm giờ
            </button>

            <button onclick="window.app.deleteExamConfirm('${s.id}', '${e.id}', '${e.title}')"
                    class="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Xóa đề thi">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async deleteExamConfirm(subjectId, examId, examTitle) {
    if (confirm(`Bạn có chắc muốn xóa đề thi "${examTitle}" không?`)) {
      await window.db.deleteExam(subjectId, examId);
      await this.loadSubjects();
      this.renderSubjectsTable();
      this.renderExamsList();
    }
  }

  // --- Modal Thiết Lập Làm Bài ---
  openExamSetupModal(subjectId, examId, defaultMode = 'exam') {
    const subj = this.subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const ex = subj.exams.find(e => e.id === examId);
    if (!ex) return;

    this.selectedExamForStart = { subject: subj, exam: ex };

    const modal = document.getElementById('exam-setup-modal');
    document.getElementById('setup-exam-title').textContent = ex.title;
    document.getElementById('setup-exam-subject').textContent = `Môn: ${subj.name} • ${ex.questions.length} câu hỏi`;
    document.getElementById('setup-duration-val').value = ex.durationMinutes || 15;

    // Chọn mode
    const modePracticeRadio = document.querySelector('input[name="setup-mode"][value="practice"]');
    const modeExamRadio = document.querySelector('input[name="setup-mode"][value="exam"]');
    if (defaultMode === 'practice' && modePracticeRadio) modePracticeRadio.checked = true;
    if (defaultMode === 'exam' && modeExamRadio) modeExamRadio.checked = true;

    if (modal) modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  closeExamSetupModal() {
    const modal = document.getElementById('exam-setup-modal');
    if (modal) modal.classList.add('hidden');
  }

  startQuizFromModal() {
    if (!this.selectedExamForStart) return;

    const mode = document.querySelector('input[name="setup-mode"]:checked').value;
    const duration = parseInt(document.getElementById('setup-duration-val').value, 10) || 15;
    const shuffleQ = document.getElementById('setup-shuffle-q').checked;
    const shuffleO = document.getElementById('setup-shuffle-o').checked;

    this.closeExamSetupModal();
    this.switchView('view-quiz-running');

    // Thiết lập thông tin tiêu đề màn hình thi
    document.getElementById('quiz-view-title').textContent = this.selectedExamForStart.exam.title;
    document.getElementById('quiz-view-badge').textContent = mode === 'practice' ? 'Chế độ Luyện tập' : 'Chế độ Kiểm tra bấm giờ';

    window.quizEngine.startQuiz({
      exam: this.selectedExamForStart.exam,
      subject: this.selectedExamForStart.subject,
      mode: mode,
      customDuration: duration,
      shuffleQuestions: shuffleQ,
      shuffleOptions: shuffleO
    });
  }

  // =========================================================================
  // LỊCH SỬ LÀM BÀI & THỐNG KÊ
  // =========================================================================
  async renderHistoryView() {
    const container = document.getElementById('history-records-container');
    if (!container) return;

    const list = await window.db.getAllHistory();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <i data-lucide="history" class="w-12 h-12 mx-auto text-slate-400 mb-3"></i>
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">Chưa có lịch sử làm bài</p>
          <p class="text-sm text-slate-500 mt-1">Hãy bắt đầu làm một bài kiểm tra để theo dõi điểm số và tiến trình học tập của bạn.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(item => {
      const mins = Math.floor(item.timeSpentSeconds / 60);
      const secs = item.timeSpentSeconds % 60;
      let scoreBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      if (item.score >= 8.0) scoreBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      else if (item.score >= 6.5) scoreBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      else if (item.score >= 5.0) scoreBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

      return `
        <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${item.subjectName || 'Môn học'}</span>
              <span class="text-xs text-slate-400">${item.completedAt}</span>
            </div>
            <h4 class="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100">${item.examTitle}</h4>
            <div class="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Đúng: <b>${item.correctCount}/${item.totalQuestions} câu</b></span>
              <span>Thời gian: <b>${mins}m ${secs}s</b></span>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <div class="text-right">
              <span class="text-xs text-slate-400 block">Điểm số</span>
              <span class="text-2xl font-black ${item.score >= 8 ? 'text-emerald-600' : (item.score >= 5 ? 'text-blue-600' : 'text-rose-600')}">
                ${item.score.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async clearHistoryConfirm() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử làm bài không?')) {
      await window.db.clearHistory();
      this.renderHistoryView();
    }
  }

  // =========================================================================
  // SAO LƯU & PHỤC HỒI DỮ LIỆU (JSON BACKUP / RESTORE)
  // =========================================================================
  async exportDataJSON() {
    const jsonStr = await window.db.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LMS_Class_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importDataJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      await window.db.importJSON(text);
      await this.loadSubjects();
      this.renderSubjectsTable();
      this.renderExamsList();
      this.renderHistoryView();
      alert('Nhập dữ liệu thành công! Toàn bộ môn học và đề thi đã được cập nhật.');
    } catch (e) {
      alert('Lỗi nhập dữ liệu: ' + e.message);
    }
  }

  // --- Modal Cài Đặt AI API Key ---
  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('gemini-api-key-input');
    if (input) input.value = window.fileProcessor.getApiKey();
    if (modal) modal.classList.remove('hidden');
  }

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  }

  saveSettings() {
    const input = document.getElementById('gemini-api-key-input');
    if (input) {
      window.fileProcessor.setApiKey(input.value);
      alert('Đã lưu cấu hình API Key thành công!');
    }
    this.closeSettingsModal();
  }

  // --- Modal Mobile QR / Hướng dẫn kết nối điện thoại ---
  openMobileQRModal() {
    const modal = document.getElementById('mobile-qr-modal');
    if (modal) modal.classList.remove('hidden');
    // Tạo link truy cập hiện tại
    const currentUrl = window.location.href;
    const urlText = document.getElementById('mobile-share-url');
    if (urlText) urlText.textContent = currentUrl;
  }

  closeMobileQRModal() {
    const modal = document.getElementById('mobile-qr-modal');
    if (modal) modal.classList.add('hidden');
  }

  // =========================================================================
  // GẮN SỰ KIỆN TƯƠNG TÁC (BIND EVENTS)
  // =========================================================================
  bindEvents() {
    // Navigation targets
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-nav-target');
        this.switchView(target);
      });
    });

    // Lọc môn học
    const filterSelect = document.getElementById('subjects-status-filter');
    const searchInput = document.getElementById('subjects-search-input');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        this.renderSubjectsTable(filterSelect.value, searchInput ? searchInput.value : '');
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderSubjectsTable(filterSelect ? filterSelect.value : 'all', searchInput.value);
      });
    }

    // Lọc ngân hàng đề thi theo môn
    const examsFilter = document.getElementById('exams-filter-subject');
    if (examsFilter) {
      examsFilter.addEventListener('change', () => {
        this.renderExamsList(examsFilter.value);
      });
    }

    // File input change cho OCR / Parser
    const fileInput = document.getElementById('parser-file-input');
    const cameraInput = document.getElementById('parser-camera-input');
    const dropZone = document.getElementById('parser-drop-zone');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    if (cameraInput) {
      cameraInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Drag and drop vào vùng upload
    if (dropZone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('border-indigo-500', 'bg-indigo-50/50');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
        }, false);
      });

      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files[0]) {
          this.handleFileUpload(dt.files[0]);
        }
      });
    }
  }

  _renderAllMath() {
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

window.app = new LMSApp();

// Khởi động ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});

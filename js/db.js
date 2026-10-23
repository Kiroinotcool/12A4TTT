// db.js - Quản lý cơ sở dữ liệu IndexedDB & LocalStorage cho LMS Lớp Học
class LMSDatabase {
  constructor() {
    this.dbName = 'LMS_ClassDatabase';
    this.version = 1;
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Kiểm tra hỗ trợ IndexedDB
      if (!window.indexedDB) {
        console.warn('IndexedDB không được hỗ trợ, sử dụng LocalStorage fallback.');
        this._initLocalStorage();
        this.isReady = true;
        resolve(this);
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('subjects')) {
          db.createObjectStore('subjects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this._checkAndSeedDefaultData();
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('Lỗi khởi tạo IndexedDB:', event.target.error);
        this._initLocalStorage();
        this.isReady = true;
        resolve(this);
      };
    });
  }

  _initLocalStorage() {
    if (!localStorage.getItem('LMS_INIT_DONE')) {
      localStorage.setItem('LMS_SUBJECTS', JSON.stringify(window.DEFAULT_DATA.subjects));
      localStorage.setItem('LMS_HISTORY', JSON.stringify(window.DEFAULT_DATA.history));
      localStorage.setItem('LMS_CLASS_INFO', JSON.stringify(window.DEFAULT_DATA.classInfo));
      localStorage.setItem('LMS_INIT_DONE', 'true');
    }
  }

  async _checkAndSeedDefaultData() {
    const subjects = await this.getAllSubjects();
    if (!subjects || subjects.length === 0) {
      console.log('Khởi tạo dữ liệu mẫu lần đầu vào IndexedDB...');
      for (const subj of window.DEFAULT_DATA.subjects) {
        await this.saveSubject(subj);
      }
      for (const hist of window.DEFAULT_DATA.history) {
        await this.saveHistory(hist);
      }
      await this.setConfig('classInfo', window.DEFAULT_DATA.classInfo);
    } else {
      // Tự động đồng bộ đề thi mẫu môn Lịch sử (Bài 1: Liên hợp quốc) nếu chưa có đề thi
      const ls = subjects.find(s => s.id === 'lich-su');
      if (ls && (!ls.exams || ls.exams.length === 0)) {
        const defaultLs = window.DEFAULT_DATA.subjects.find(s => s.id === 'lich-su');
        if (defaultLs && defaultLs.exams && defaultLs.exams.length > 0) {
          ls.exams = defaultLs.exams;
          ls.hasExam = true;
          ls.outline = defaultLs.outline;
          ls.outlines = [defaultLs.outline];
          ls.hasOutline = true;
          await this.saveSubject(ls);
        }
      }
    }
  }

  // --- Môn học (Subjects) ---
  async getAllSubjects() {
    let list = [];
    if (!this.db) {
      const data = localStorage.getItem('LMS_SUBJECTS');
      list = data ? JSON.parse(data) : [];
    } else {
      list = await new Promise((resolve) => {
        const transaction = this.db.transaction(['subjects'], 'readonly');
        const store = transaction.objectStore('subjects');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    }

    // Chuẩn hóa cấu trúc outlines và exams
    list.forEach(s => {
      if (!s.outlines) {
        s.outlines = s.outline ? [s.outline] : [];
      }
      s.outlines.forEach((o, i) => {
        if (!o.id) o.id = 'outline-' + s.id + '-' + (i + 1);
      });
      s.outline = s.outlines[0] || null;
      s.hasOutline = s.outlines.length > 0;
      if (!s.exams) s.exams = [];
      s.hasExam = s.exams.length > 0;
    });

    return list;
  }

  async getSubjectById(id) {
    const list = await this.getAllSubjects();
    return list.find(s => s.id === id) || null;
  }

  async saveSubject(subject) {
    if (!subject.id) {
      subject.id = 'subj-' + Date.now();
    }
    // Chuẩn hóa outlines
    if (!subject.outlines) {
      subject.outlines = subject.outline ? [subject.outline] : [];
    }
    subject.outlines.forEach((o, i) => {
      if (!o.id) o.id = 'outline-' + subject.id + '-' + (i + 1);
    });
    subject.outline = subject.outlines[0] || null;
    subject.hasOutline = subject.outlines.length > 0;
    subject.hasExam = Boolean(subject.exams && subject.exams.length > 0);

    if (!this.db) {
      const list = await this.getAllSubjects();
      const idx = list.findIndex(s => s.id === subject.id);
      if (idx >= 0) list[idx] = subject;
      else list.push(subject);
      localStorage.setItem('LMS_SUBJECTS', JSON.stringify(list));
      return subject;
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['subjects'], 'readwrite');
      const store = transaction.objectStore('subjects');
      const req = store.put(subject);
      req.onsuccess = () => resolve(subject);
      req.onerror = (e) => reject(e);
    });
  }

  async deleteSubject(id) {
    if (!this.db) {
      let list = await this.getAllSubjects();
      list = list.filter(s => s.id !== id);
      localStorage.setItem('LMS_SUBJECTS', JSON.stringify(list));
      return true;
    }
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['subjects'], 'readwrite');
      const store = transaction.objectStore('subjects');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  // --- Đề cương (Outlines - Hỗ trợ nhiều đề cương / chuyên đề cho mỗi môn) ---
  async saveOutline(subjectId, outlineData) {
    const subject = await this.getSubjectById(subjectId);
    if (!subject) throw new Error('Không tìm thấy môn học');
    if (!subject.outlines) {
      subject.outlines = subject.outline ? [subject.outline] : [];
    }
    if (!outlineData.id) {
      outlineData.id = 'outline-' + Date.now();
    }
    outlineData.updatedAt = outlineData.updatedAt || new Date().toISOString().split('T')[0];

    const idx = subject.outlines.findIndex(o => o.id === outlineData.id);
    if (idx >= 0) {
      subject.outlines[idx] = outlineData;
    } else {
      subject.outlines.unshift(outlineData);
    }
    subject.outline = subject.outlines[0];
    subject.hasOutline = subject.outlines.length > 0;
    return await this.saveSubject(subject);
  }

  async deleteOutline(subjectId, outlineId) {
    const subject = await this.getSubjectById(subjectId);
    if (!subject) return;
    if (!subject.outlines) subject.outlines = subject.outline ? [subject.outline] : [];
    if (outlineId) {
      subject.outlines = subject.outlines.filter(o => o.id !== outlineId);
    } else {
      subject.outlines = [];
    }
    subject.outline = subject.outlines[0] || null;
    subject.hasOutline = subject.outlines.length > 0;
    return await this.saveSubject(subject);
  }

  // --- Đề thi (Exams) ---
  async getExamById(examId) {
    const subjects = await this.getAllSubjects();
    for (const subj of subjects) {
      if (subj.exams) {
        const found = subj.exams.find(e => e.id === examId);
        if (found) return { exam: found, subject: subj };
      }
    }
    return null;
  }

  async saveExam(subjectId, examData) {
    const subject = await this.getSubjectById(subjectId);
    if (!subject) throw new Error('Không tìm thấy môn học');
    if (!subject.exams) subject.exams = [];

    if (!examData.id) {
      examData.id = 'exam-' + Date.now();
    }
    examData.createdAt = examData.createdAt || new Date().toISOString().split('T')[0];

    const idx = subject.exams.findIndex(e => e.id === examData.id);
    if (idx >= 0) {
      subject.exams[idx] = examData;
    } else {
      subject.exams.push(examData);
    }
    subject.hasExam = subject.exams.length > 0;
    await this.saveSubject(subject);
    return examData;
  }

  async deleteExam(subjectId, examId) {
    const subject = await this.getSubjectById(subjectId);
    if (!subject || !subject.exams) return false;
    subject.exams = subject.exams.filter(e => e.id !== examId);
    subject.hasExam = subject.exams.length > 0;
    await this.saveSubject(subject);
    return true;
  }

  // --- Lịch sử làm bài (History) ---
  async getAllHistory() {
    if (!this.db) {
      const data = localStorage.getItem('LMS_HISTORY');
      return data ? JSON.parse(data) : [];
    }
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)));
      req.onerror = () => resolve([]);
    });
  }

  async saveHistory(historyRecord) {
    if (!historyRecord.id) {
      historyRecord.id = 'hist-' + Date.now();
    }
    if (!this.db) {
      const list = await this.getAllHistory();
      list.unshift(historyRecord);
      localStorage.setItem('LMS_HISTORY', JSON.stringify(list));
      return historyRecord;
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const req = store.put(historyRecord);
      req.onsuccess = () => resolve(historyRecord);
      req.onerror = (e) => reject(e);
    });
  }

  async clearHistory() {
    if (!this.db) {
      localStorage.setItem('LMS_HISTORY', JSON.stringify([]));
      return true;
    }
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  // --- Cấu hình chung & Thông tin lớp ---
  async getConfig(key, defaultValue = null) {
    if (!this.db) {
      const val = localStorage.getItem('LMS_CFG_' + key);
      return val ? JSON.parse(val) : defaultValue;
    }
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
      req.onerror = () => resolve(defaultValue);
    });
  }

  async setConfig(key, value) {
    if (!this.db) {
      localStorage.setItem('LMS_CFG_' + key, JSON.stringify(value));
      return value;
    }
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');
      store.put({ key, value });
      transaction.oncomplete = () => resolve(value);
      transaction.onerror = () => resolve(null);
    });
  }

  // --- Sao lưu & Phục hồi JSON ---
  async exportJSON() {
    const subjects = await this.getAllSubjects();
    const history = await this.getAllHistory();
    const classInfo = await this.getConfig('classInfo', window.DEFAULT_DATA.classInfo);
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      classInfo,
      subjects,
      history
    };
    return JSON.stringify(payload, null, 2);
  }

  async importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.subjects || !Array.isArray(data.subjects)) {
        throw new Error('Dữ liệu JSON không hợp lệ: Thiếu danh sách subjects');
      }
      for (const subj of data.subjects) {
        await this.saveSubject(subj);
      }
      if (data.history && Array.isArray(data.history)) {
        for (const h of data.history) {
          await this.saveHistory(h);
        }
      }
      if (data.classInfo) {
        await this.setConfig('classInfo', data.classInfo);
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      throw e;
    }
  }

  async resetData() {
    if (this.db) {
      const transaction = this.db.transaction(['subjects', 'history', 'config'], 'readwrite');
      transaction.objectStore('subjects').clear();
      transaction.objectStore('history').clear();
      transaction.objectStore('config').clear();
    }
    localStorage.clear();
    await this._checkAndSeedDefaultData();
    return true;
  }
}

window.db = new LMSDatabase();

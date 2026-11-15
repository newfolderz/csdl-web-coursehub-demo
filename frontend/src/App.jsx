import { useEffect, useState } from "react";
import { api, getEnrollmentEvents, getSections } from "./api.js";
import Notice from "./components/Notice.jsx";
import SectionTable from "./components/SectionTable.jsx";
import EnrollmentList from "./components/EnrollmentList.jsx";
import StudentForm from "./components/StudentForm.jsx";
import EnrollmentHistory from "./components/EnrollmentHistory.jsx";

const HISTORY_PAGE_SIZE = 10;
const SECTION_PAGE_SIZE = 10;

export default function App() {
  const [draftId, setDraftId] = useState("22000004");
  const [studentId, setStudentId] = useState("22000004");
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [sectionPage, setSectionPage] = useState(0);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ kind: "info", text: "" });
  const [refresh, setRefresh] = useState(0);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [courseData, enrollmentData] = await Promise.all([
          api("/courses", options),
          api(`/students/${encodeURIComponent(studentId)}/enrollments`, options),
        ]);
        if (controller.signal.aborted) return;
        setCourses(courseData);
        setEnrollments(enrollmentData);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
        setCourses([]);
        setSections([]);
        setEnrollments([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, [studentId, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSections() {
      setLoading(true);
      setError("");
      try {
        const sectionData = await getSections({
          search,
          courseCode,
          onlyAvailable,
          skip: sectionPage * SECTION_PAGE_SIZE,
          limit: SECTION_PAGE_SIZE,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setSections(sectionData);
      } catch (err) {
        if (!controller.signal.aborted) {
          setSections([]);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadSections();
    return () => controller.abort();
  }, [search, courseCode, onlyAvailable, sectionPage, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const events = await getEnrollmentEvents(
          studentId,
          historyPage * HISTORY_PAGE_SIZE,
          HISTORY_PAGE_SIZE,
          controller.signal,
        );
        if (!controller.signal.aborted) setHistoryEvents(events);
      } catch (err) {
        if (!controller.signal.aborted) {
          setHistoryEvents([]);
          setHistoryError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => controller.abort();
  }, [studentId, historyPage, refresh]);


    function chooseStudent(event) {
    event.preventDefault();
    const nextId = draftId.trim();
    if (!/^\d{8}$/.test(nextId)) {
      setNotice({ kind: "error", text: "Mã demo phải gồm 8 chữ số." });
      return;
    }
    setNotice({ kind: "info", text: "" });
    setLoading(true);
    setHistoryPage(0);
    setStudentId(nextId);
    setRefresh((value) => value + 1);
  }

  async function changeEnrollment(sectionId, cancel = false) {
    if (busy || loading || error) return;
    if (cancel && !window.confirm(`Hủy đăng ký lớp ${sectionId}?`)) return;
    setBusy(true);
    setNotice({ kind: "info", text: "Đang gửi yêu cầu..." });
    try {
      if (cancel) {
        await api(
          `/enrollments/${encodeURIComponent(studentId)}/${encodeURIComponent(sectionId)}`,
          { method: "DELETE" },
        );
      } else {
        await api("/enrollments", {
          method: "POST",
          body: { student_id: studentId, class_section_id: sectionId },
        });
      }
      setNotice({ kind: "success", text: cancel
        ? `Đã hủy đăng ký ${sectionId}.`
        : `Đăng ký ${sectionId} thành công.` });
    } catch (err) {
      setNotice({ kind: "error", text: err.message });
    } finally {
      // Đọc lại CSDL kể cả sau lỗi; không tự cộng/trừ số chỗ ở giao diện.
      setLoading(true);
      setRefresh((value) => value + 1);
      setBusy(false);
    }
  }

    const courseCodes = ["INT2204", "INT2205", "INT2206"].filter((code) =>
      courses.some((course) => course.code === code),
    );
  const rows = sections.map((section) => ({
    ...section,
    course_name: courses.find((course) => course.code === section.course_code)?.name
      ?? section.course_code,
    registered: enrollments.some((item) => item.class_section_id === section.class_id),
  }));
  const hasNextSectionPage = sections.length === SECTION_PAGE_SIZE;
  const disabled = loading || busy || Boolean(error);

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">CSDL WEB VÀ HỆ THỐNG THÔNG TIN · BUỔI 5</p>
        <h1>CourseHub</h1>
        <p>Tra cứu và đăng ký lớp học phần</p>
        <span className="chip">React → FastAPI → PostgreSQL</span>
      </header>
      <p className="demo-note">
        Môi trường thực hành. Nhập mã sinh viên để thử dữ liệu, không phải đăng nhập.
      </p>
      <StudentForm
        draftId={draftId}
        studentId={studentId}
        busy={busy}
        loading={loading}
        onDraftIdChange={setDraftId}
        onSubmit={chooseStudent}
        onRefresh={() => setRefresh((value) => value + 1)}
      />
      <Notice kind={notice.kind}>{notice.text}</Notice>
      <Notice kind="error">{error}</Notice>
      {loading && <Notice>Đang tải dữ liệu từ API...</Notice>}
      {!loading && !error && (
        <div className="workspace">
          <section className="panel">
            <h2>2. Danh sách lớp học phần</h2>
            <div className="filters">
              <label htmlFor="course-code">Mã học phần</label>
              <select
                id="course-code"
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value);
                  setSectionPage(0);
                }}
              >
                <option value="">Tất cả học phần</option>
                {courseCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <label htmlFor="search">Tìm lớp / học phần</label>
              <input id="search" value={search} placeholder="Ví dụ: web"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSectionPage(0);
                }} />
              <label className="check">
                <input type="checkbox" checked={onlyAvailable}
                  onChange={(e) => {
                    setOnlyAvailable(e.target.checked);
                    setSectionPage(0);
                  }} />
                Chỉ hiện lớp còn chỗ
              </label>
            </div>
            <SectionTable rows={rows} disabled={disabled}
              onEnroll={(id) => changeEnrollment(id)} />
            <nav className="pagination" aria-label="Phân trang lớp học phần">
              <button type="button" className="secondary"
                disabled={sectionPage === 0 || disabled}
                onClick={() => setSectionPage((page) => page - 1)}>
                Trang trước
              </button>
              <span>Trang {sectionPage + 1}</span>
              <button type="button" className="secondary"
                disabled={!hasNextSectionPage || disabled}
                onClick={() => setSectionPage((page) => page + 1)}>
                Trang sau
              </button>
            </nav>
          </section>
          <section className="panel">
            <h2>3. Lớp đã đăng ký</h2>
            <p className="muted">Sinh viên {studentId} · {enrollments.length} lớp</p>
            <EnrollmentList rows={enrollments} disabled={disabled}
              onCancel={(id) => changeEnrollment(id, true)} />
          </section>
        </div>
      )}
      {!loading && !error && (
        <EnrollmentHistory
          events={historyEvents}
          loading={historyLoading}
          error={historyError}
          page={historyPage}
          pageSize={HISTORY_PAGE_SIZE}
          onPageChange={setHistoryPage}
        />
      )}
      <footer>Số chỗ và đăng ký được đọc từ API; Backend quyết định tính hợp lệ.</footer>
    </main>
  );
}

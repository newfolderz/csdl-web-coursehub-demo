function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN");
}

export default function EnrollmentHistory({
  events,
  loading,
  error,
  page,
  pageSize,
  onPageChange,
}) {
  const hasNextPage = events.length === pageSize;

  return (
    <section className="panel">
      <h2>4. Lịch sử đăng ký</h2>
      {loading && <p className="muted">Đang tải lịch sử...</p>}
      {!loading && error && <p className="notice error">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="empty-state">Sinh viên chưa có nhật ký đăng ký.</p>
      )}
      {!loading && !error && events.length > 0 && (
        <>
          <div className="table-scroll">
            <table aria-label="Lịch sử đăng ký học phần">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Lớp học phần</th>
                  <th>Sự kiện</th>
                  <th>Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.occurred_at)}</td>
                    <td>{event.class_section_id}</td>
                    <td>{event.event_type}</td>
                    <td>{event.source ?? "demo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="pagination" aria-label="Phân trang lịch sử">
            <button
              type="button"
              className="secondary"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Trang trước
            </button>
            <span>Trang {page + 1}</span>
            <button
              type="button"
              className="secondary"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
            >
              Trang sau
            </button>
          </nav>
        </>
      )}
    </section>
  );
}

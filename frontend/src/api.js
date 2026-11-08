const BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function api(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Không nhận được phản hồi API. Kiểm tra Backend/CORS " +
      "và tải lại dữ liệu trước khi gửi lại thao tác.",
    );
  }

  // DELETE thành công trả 204: không có JSON để đọc.
  if (response.status === 204) return null;
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`HTTP ${response.status}: phản hồi không phải JSON.`);
  }
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join("; ")
      : typeof detail === "string" ? detail : "Yêu cầu không thành công.";
    const error = new Error(`HTTP ${response.status}: ${message}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getEnrollmentEvents(studentId, skip, limit, signal) {
  const params = new URLSearchParams({
    student_id: studentId,
    dataset: "demo",
    skip: String(skip),
    limit: String(limit),
  });
  return api(`/enrollment-events?${params}`, { signal });
}

export function getSections({ search, courseCode, onlyAvailable, skip, limit, signal }) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (search.trim()) params.set("q", search.trim());
  if (courseCode) params.set("course_code", courseCode);
  if (onlyAvailable) params.set("available_only", "true");
  return api(`/sections?${params}`, { signal });
}

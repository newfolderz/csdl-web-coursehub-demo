import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { api, getEnrollmentEvents, getSections } from "../src/api.js";

const originalFetch = globalThis.fetch;

function mockResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("api returns JSON for a successful 201 response", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return mockResponse(201, {
      message: "Dang ky thanh cong",
      student_id: "22000004",
      class_section_id: "INT2204-01",
    });
  };

  const result = await api("/enrollments", {
    method: "POST",
    body: { student_id: "22000004", class_section_id: "INT2204-01" },
  });

  assert.equal(result.message, "Dang ky thanh cong");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), {
    student_id: "22000004",
    class_section_id: "INT2204-01",
  });
});

test("api returns null for a successful 204 response", async () => {
  globalThis.fetch = async () => mockResponse(204);

  assert.equal(
    await api("/enrollments/22000004/INT2204-01", { method: "DELETE" }),
    null,
  );
});

test("api exposes 404 and 409 details as errors", async (t) => {
  await t.test("404 resource not found", async () => {
    globalThis.fetch = async () =>
      mockResponse(404, { detail: "Khong tim thay sinh vien" });

    await assert.rejects(
      api("/students/00000000/enrollments"),
      (error) => {
        assert.equal(error.status, 404);
        assert.equal(error.message, "HTTP 404: Khong tim thay sinh vien");
        return true;
      },
    );
  });

  await t.test("409 enrollment conflict", async () => {
    globalThis.fetch = async () =>
      mockResponse(409, { detail: "Lop hoc phan da het cho" });

    await assert.rejects(
      api("/enrollments", { method: "POST", body: {} }),
      (error) => {
        assert.equal(error.status, 409);
        assert.equal(error.message, "HTTP 409: Lop hoc phan da het cho");
        return true;
      },
    );
  });
});

test("getEnrollmentEvents requests only one demo page", async () => {
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = new URL(url);
    return mockResponse(200, []);
  };

  await getEnrollmentEvents("22000004", 20, 10);

  assert.equal(requestedUrl.pathname, "/enrollment-events");
  assert.deepEqual(Object.fromEntries(requestedUrl.searchParams), {
    student_id: "22000004",
    dataset: "demo",
    skip: "20",
    limit: "10",
  });
});

test("getSections sends server-side search and pagination parameters", async () => {
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = new URL(url);
    return mockResponse(200, []);
  };

  await getSections({
    search: "web",
    courseCode: "INT2204",
    onlyAvailable: true,
    skip: 10,
    limit: 10,
  });

  assert.equal(requestedUrl.pathname, "/sections");
  assert.deepEqual(Object.fromEntries(requestedUrl.searchParams), {
    q: "web",
    course_code: "INT2204",
    available_only: "true",
    skip: "10",
    limit: "10",
  });
});

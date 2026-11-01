# CourseHub - Buoi 4

- Migration 001: enrollment_events.
- Demo class: RACE-01, capacity = 1.
- POST /enrollments: lock class_sections bang FOR UPDATE.
- Concurrency test: 1 request 201, 1 request 409.
- Performance data: 100000 rows, dataset=performance.
- Index: idx_enrollment_events_dataset_student_time.
- Ghi lai scan type va Execution Time truoc/sau o day.

Khong commit backend/.env.

```text
"Limit  (cost=2913.07..2913.19 rows=50 width=39) (actual time=11.517..11.524 rows=50 loops=1)"
"  Buffers: shared hit=1137"
"  ->  Sort  (cost=2913.07..2915.02 rows=781 width=39) (actual time=11.514..11.517 rows=50 loops=1)"
"        Sort Key: occurred_at DESC"
"        Sort Method: top-N heapsort  Memory: 31kB"
"        Buffers: shared hit=1137"
"        ->  Seq Scan on enrollment_events  (cost=0.00..2887.12 rows=781 width=39) (actual time=0.072..11.235 rows=820 loops=1)"
"              Filter: ((occurred_at >= '2025-12-20 00:00:00'::timestamp without time zone) AND ((dataset)::text = 'performance'::text) AND ((student_id)::text = '22000001'::text))"
"              Rows Removed by Filter: 99187"
"              Buffers: shared hit=1137"
"Planning:"
"  Buffers: shared hit=42 read=1"
"Planning Time: 2.861 ms"
"Execution Time: 11.560 ms"
```

```text
"Limit  (cost=0.42..67.69 rows=50 width=39) (actual time=0.101..0.175 rows=50 loops=1)"
"  Buffers: shared hit=50 read=3"
"  ->  Index Scan using idx_enrollment_events_dataset_student_time on enrollment_events  (cost=0.42..1094.27 rows=813 width=39) (actual time=0.098..0.168 rows=50 loops=1)"
"        Index Cond: (((dataset)::text = 'performance'::text) AND ((student_id)::text = '22000001'::text) AND (occurred_at >= '2025-12-20 00:00:00'::timestamp without time zone))"
"        Buffers: shared hit=50 read=3"
"Planning:"
"  Buffers: shared hit=39 read=1"
"Planning Time: 2.216 ms"
"Execution Time: 0.202 ms"
```
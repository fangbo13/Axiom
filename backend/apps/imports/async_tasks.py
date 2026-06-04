import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from django.db import transaction
from .services import commit_batch

_executor = ThreadPoolExecutor(max_workers=2)
_jobs = {}


def submit_import_job(batch, structured_rows):
    job_id = f"import_{batch.id}_{uuid.uuid4().hex[:8]}"
    _jobs[job_id] = {
        'status': 'pending',
        'progress': 0,
        'result': None,
        'error': None,
    }

    def _task():
        try:
            _jobs[job_id]['status'] = 'processing'
            total = len(structured_rows)
            chunk_size = 100

            for i in range(0, total, chunk_size):
                chunk = structured_rows[i:i + chunk_size]
                with transaction.atomic():
                    commit_batch(batch, chunk)
                progress = min(100, int((i + len(chunk)) / total * 100))
                _jobs[job_id]['progress'] = progress

            _jobs[job_id]['status'] = 'completed'
            _jobs[job_id]['progress'] = 100
            _jobs[job_id]['result'] = {'records_created': total}
        except Exception as e:
            _jobs[job_id]['status'] = 'failed'
            _jobs[job_id]['error'] = str(e)
            batch.status = 'failed'
            batch.save(update_fields=['status'])

    _executor.submit(_task)
    return job_id


def get_job_status(job_id):
    return _jobs.get(job_id, {'status': 'unknown', 'progress': 0})
